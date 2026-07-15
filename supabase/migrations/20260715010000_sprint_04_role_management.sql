-- Sprint 04 (fechamento) - Gestao de papeis hospitalares por RPC transacional auditada
--
-- Responsabilidade:
-- 1. Referencia publica opaca (management_ref) no catalogo public.roles, para
--    que a atribuicao/revogacao de papel nunca transporte o id interno do
--    papel em HTML ou FormData. A referencia NAO autoriza nada.
-- 2. Hardening RPC-only de public.hospital_membership_roles: revoga INSERT e
--    UPDATE diretos de authenticated (concedidos na Sprint 03A) e remove as
--    policies de mutacao correspondentes; SELECT legitimo preservado.
-- 3. Extensao da auditoria administrativa existente (sem tabela paralela):
--    novos eventos hospital_role_assigned / hospital_role_revoked, coluna
--    opcional target_role_id e constraints de consistencia ampliadas.
-- 4. RPC unica de mutacao de papeis change_hospital_membership_role, SECURITY
--    DEFINER com validacao interna explicita, lock por hospital, protecao
--    contra auto-revogacao de hospital_admin e contra revogacao do ultimo
--    administrador ativo.
-- 5. get_hospital_team estendida com os papeis administraveis por integrante
--    (assigned_roles, somente para quem possui manage) e nova RPC de catalogo
--    minimo atribuivel get_hospital_assignable_roles (somente manage).
--
-- Limites:
-- - Nenhuma linha de roles/permissions/role_permissions e criada ou editada.
-- - organization_membership_roles, platform_role_assignments e o catalogo de
--   permissions permanecem intocados (grants, policies e dados).
-- - Nenhum SQL dinamico; nenhum service_role; nenhuma leitura de auth.users.
-- - Acoes restritas a assign/revoke de papeis de escopo hospital ja
--   existentes no catalogo.

-- === 1. Referencia opaca no catalogo de papeis ================================

alter table public.roles
  add column management_ref text not null
    default encode(extensions.gen_random_bytes(16), 'hex');

alter table public.roles
  add constraint roles_management_ref_unique unique (management_ref),
  add constraint roles_management_ref_format
    check (management_ref ~ '^[0-9a-f]{32}$');

-- === 2. Hardening RPC-only de hospital_membership_roles =======================
-- A Sprint 03A concedeu INSERT/UPDATE de colunas a authenticated antes da
-- existencia da RPC auditada. A partir daqui, a RPC e o UNICO caminho de
-- mutacao de atribuicoes de papel hospitalar.

revoke insert (hospital_membership_id, role_id, status, granted_by)
on table public.hospital_membership_roles
from authenticated;

revoke update (status, revoked_at)
on table public.hospital_membership_roles
from authenticated;

revoke insert, update, delete
on table public.hospital_membership_roles
from authenticated;

drop policy if exists hospital_membership_roles_insert_allowed
on public.hospital_membership_roles;

drop policy if exists hospital_membership_roles_update_allowed
on public.hospital_membership_roles;

-- === 3. Auditoria administrativa estendida ====================================
-- A tabela existente suporta os novos eventos de forma coerente: mesma
-- semantica append-only, mesmo fechamento de acesso, mesma transacao.

alter table public.administrative_audit_events
  add column target_role_id bigint references public.roles(id) on delete restrict;

create index administrative_audit_events_role_idx
  on public.administrative_audit_events(target_role_id)
  where target_role_id is not null;

alter table public.administrative_audit_events
  drop constraint administrative_audit_events_event_type_check,
  drop constraint administrative_audit_events_previous_status_check,
  drop constraint administrative_audit_events_new_status_check,
  drop constraint administrative_audit_events_transition_consistency_check;

alter table public.administrative_audit_events
  add constraint administrative_audit_events_event_type_check check (
    event_type in (
      'hospital_membership_suspended',
      'hospital_membership_reactivated',
      'hospital_role_assigned',
      'hospital_role_revoked'
    )
  ),
  add constraint administrative_audit_events_previous_status_check check (
    previous_status in ('active', 'suspended', 'revoked', 'none')
  ),
  add constraint administrative_audit_events_new_status_check check (
    new_status in ('active', 'suspended', 'revoked')
  ),
  -- Cada event_type aceita somente a transicao que descreve; eventos de
  -- vinculo nao carregam papel e eventos de papel exigem o papel alvo.
  add constraint administrative_audit_events_transition_consistency_check check (
    (
      event_type = 'hospital_membership_suspended'
      and previous_status = 'active'
      and new_status = 'suspended'
      and target_role_id is null
    )
    or (
      event_type = 'hospital_membership_reactivated'
      and previous_status = 'suspended'
      and new_status = 'active'
      and target_role_id is null
    )
    or (
      event_type = 'hospital_role_assigned'
      and previous_status in ('none', 'revoked')
      and new_status = 'active'
      and target_role_id is not null
    )
    or (
      event_type = 'hospital_role_revoked'
      and previous_status = 'active'
      and new_status = 'revoked'
      and target_role_id is not null
    )
  );

-- === 4. RPC de mutacao de papeis ==============================================

create or replace function public.change_hospital_membership_role(
  target_hospital_id uuid,
  target_membership_ref text,
  target_role_ref text,
  requested_action text
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_hospital record;
  v_target record;
  v_role record;
  v_assignment record;
  v_previous text;
begin
  -- Somente as duas acoes desta etapa.
  if requested_action is null
     or requested_action not in ('assign', 'revoke') then
    return 'invalid_transition';
  end if;

  -- Autorizacao explicita do ator: identica a semantica da 04C.2. Fail-closed,
  -- sem acesso por nome de papel e sem bypass para platform_admin.
  if not (
    app_private.current_profile_is_active()
    and (
      app_private.current_user_has_hospital_permission(
        target_hospital_id, 'hospital_memberships.manage'
      )
      or exists (
        select 1
        from public.hospitals h
        where h.id = target_hospital_id
          and app_private.current_user_has_organization_permission(
            h.organization_id, 'hospital_memberships.manage'
          )
      )
    )
  ) then
    return 'not_allowed';
  end if;

  -- Lock do hospital: serializa mutacoes administrativas concorrentes e
  -- garante que a checagem de ultimo administrador veja o estado consolidado.
  select h.id, h.organization_id
    into v_hospital
  from public.hospitals h
  join public.organizations o
    on o.id = h.organization_id
   and o.status = 'active'
  where h.id = target_hospital_id
    and h.status = 'active'
  for update of h;

  if not found then
    return 'not_allowed';
  end if;

  -- Alvo pela referencia opaca, restrito ao hospital travado; vinculo nao
  -- revogado, vinculo organizacional e perfil alvo ativos. Alvo inexistente e
  -- alvo fora do escopo retornam o MESMO resultado (sem enumeracao).
  select hm.id, hm.status, om.user_id
    into v_target
  from public.hospital_memberships hm
  join public.organization_memberships om
    on om.id = hm.organization_membership_id
   and om.status = 'active'
  join public.profiles p
    on p.id = om.user_id
   and p.status = 'active'
  where hm.hospital_id = v_hospital.id
    and hm.organization_id = v_hospital.organization_id
    and hm.management_ref = target_membership_ref
    and hm.status <> 'revoked'
  for update of hm;

  if not found then
    return 'not_allowed';
  end if;

  -- Papel pela referencia opaca, restrito ao escopo hospital. Papel
  -- inexistente e papel de scope incorreto retornam o mesmo resultado.
  select r.id, r.code
    into v_role
  from public.roles r
  where r.management_ref = target_role_ref
    and r.scope = 'hospital';

  if not found then
    return 'not_allowed';
  end if;

  -- Atribuicao existente (unica por par vinculo/papel), travada para a mutacao.
  select hmr.id, hmr.status
    into v_assignment
  from public.hospital_membership_roles hmr
  where hmr.hospital_membership_id = v_target.id
    and hmr.role_id = v_role.id
  for update of hmr;

  if requested_action = 'assign' then
    -- Ja ativa: nada a fazer; duplicata e transicao invalida.
    if found and v_assignment.status = 'active' then
      return 'invalid_transition';
    end if;

    if found then
      -- Reatribuicao: reativa a linha revogada existente, sem duplicar.
      update public.hospital_membership_roles
         set status = 'active',
             revoked_at = null,
             granted_by = v_actor
       where id = v_assignment.id;
      v_previous := 'revoked';
    else
      insert into public.hospital_membership_roles (
        hospital_membership_id, role_id, role_scope, status, granted_by
      )
      values (v_target.id, v_role.id, 'hospital', 'active', v_actor);
      v_previous := 'none';
    end if;

    insert into public.administrative_audit_events (
      organization_id, hospital_id, actor_profile_id,
      target_hospital_membership_id, target_role_id,
      event_type, previous_status, new_status
    )
    values (
      v_hospital.organization_id, v_hospital.id, v_actor,
      v_target.id, v_role.id,
      'hospital_role_assigned', v_previous, 'active'
    );

    return 'updated';
  end if;

  -- revoke: somente atribuicao ativa.
  if not found or v_assignment.status <> 'active' then
    return 'invalid_transition';
  end if;

  if v_role.code = 'hospital_admin' then
    -- O ator nunca revoga o proprio papel de administrador.
    if v_target.user_id = v_actor then
      return 'self_admin_role_forbidden';
    end if;

    -- Ultimo administrador ativo qualificado: se o alvo conta como
    -- administrador qualificado (vinculo hospitalar ativo) e nao resta nenhum
    -- outro, bloqueia. A checagem ocorre APOS o lock do hospital.
    if v_target.status = 'active'
    and not exists (
      select 1
      from public.hospital_memberships hm2
      join public.organization_memberships om2
        on om2.id = hm2.organization_membership_id
       and om2.status = 'active'
      join public.profiles p2
        on p2.id = om2.user_id
       and p2.status = 'active'
      join public.hospital_membership_roles hmr2
        on hmr2.hospital_membership_id = hm2.id
       and hmr2.status = 'active'
       and hmr2.revoked_at is null
      join public.roles r2
        on r2.id = hmr2.role_id
       and r2.scope = hmr2.role_scope
       and r2.scope = 'hospital'
       and r2.code = 'hospital_admin'
      where hm2.hospital_id = v_hospital.id
        and hm2.status = 'active'
        and hm2.id <> v_target.id
    ) then
      return 'last_admin_forbidden';
    end if;
  end if;

  update public.hospital_membership_roles
     set status = 'revoked',
         revoked_at = now()
   where id = v_assignment.id;

  insert into public.administrative_audit_events (
    organization_id, hospital_id, actor_profile_id,
    target_hospital_membership_id, target_role_id,
    event_type, previous_status, new_status
  )
  values (
    v_hospital.organization_id, v_hospital.id, v_actor,
    v_target.id, v_role.id,
    'hospital_role_revoked', 'active', 'revoked'
  );

  return 'updated';
end;
$$;

revoke execute on function public.change_hospital_membership_role(uuid, text, text, text) from public;
revoke execute on function public.change_hospital_membership_role(uuid, text, text, text) from anon;
grant execute on function public.change_hospital_membership_role(uuid, text, text, text) to authenticated;

-- === 5. Catalogo minimo atribuivel (somente manage) ===========================

create or replace function public.get_hospital_assignable_roles(
  target_hospital_id uuid
)
returns table (
  role_label text,
  role_ref text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.display_name, r.management_ref
  from public.roles r
  where r.scope = 'hospital'
    and app_private.current_profile_is_active()
    and exists (
      select 1
      from public.hospitals h
      join public.organizations o
        on o.id = h.organization_id
       and o.status = 'active'
      where h.id = target_hospital_id
        and h.status = 'active'
        and (
          app_private.current_user_has_hospital_permission(
            h.id, 'hospital_memberships.manage'
          )
          or app_private.current_user_has_organization_permission(
            h.organization_id, 'hospital_memberships.manage'
          )
        )
    )
  order by r.display_name;
$$;

revoke execute on function public.get_hospital_assignable_roles(uuid) from public;
revoke execute on function public.get_hospital_assignable_roles(uuid) from anon;
grant execute on function public.get_hospital_assignable_roles(uuid) to authenticated;

-- === 6. get_hospital_team com papeis administraveis ===========================
-- A alteracao do tipo de retorno exige drop + recreate; a semantica de leitura
-- da 04C.1 (DEC-056) e os metadados da 04C.2 (DEC-057) permanecem identicos.
-- A unica adicao e assigned_roles: papeis ativos do integrante com referencia
-- opaca e indicador de revogabilidade, expostos SOMENTE a quem possui manage.

drop function public.get_hospital_team(uuid);

create or replace function public.get_hospital_team(
  target_hospital_id uuid
)
returns table (
  display_name text,
  membership_status text,
  role_labels text[],
  management_ref text,
  can_suspend boolean,
  can_reactivate boolean,
  assigned_roles jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with
  authorized_target as (
    select h.id as hospital_id, h.organization_id
    from public.hospitals h
    join public.organizations o
      on o.id = h.organization_id
     and o.status = 'active'
    where h.id = target_hospital_id
      and h.status = 'active'
      and app_private.current_profile_is_active()
      and (
        app_private.current_user_has_hospital_permission(
          h.id,
          'hospital_memberships.read'
        )
        or app_private.current_user_has_organization_permission(
          h.organization_id,
          'hospital_memberships.read'
        )
      )
  ),
  caller_manage as (
    select exists (
      select 1
      from authorized_target t
      where app_private.current_user_has_hospital_permission(
          t.hospital_id, 'hospital_memberships.manage'
        )
        or app_private.current_user_has_organization_permission(
          t.organization_id, 'hospital_memberships.manage'
        )
    ) as can_manage
  )
  select
    p.display_name,
    hm.status as membership_status,
    coalesce(
      (
        select array_agg(distinct r.display_name order by r.display_name)
        from public.hospital_membership_roles hmr
        join public.roles r
          on r.id = hmr.role_id
         and r.scope = hmr.role_scope
         and r.scope = 'hospital'
        where hmr.hospital_membership_id = hm.id
          and hmr.status = 'active'
          and hmr.revoked_at is null
      ),
      array[]::text[]
    ) as role_labels,
    case when cm.can_manage then hm.management_ref else null end as management_ref,
    (
      cm.can_manage
      and hm.status = 'active'
      and om.user_id <> auth.uid()
      and not (
        exists (
          select 1
          from public.hospital_membership_roles hmr
          join public.roles r
            on r.id = hmr.role_id
           and r.scope = hmr.role_scope
           and r.scope = 'hospital'
           and r.code = 'hospital_admin'
          where hmr.hospital_membership_id = hm.id
            and hmr.status = 'active'
            and hmr.revoked_at is null
        )
        and not exists (
          select 1
          from public.hospital_memberships hm2
          join public.organization_memberships om2
            on om2.id = hm2.organization_membership_id
           and om2.status = 'active'
          join public.profiles p2
            on p2.id = om2.user_id
           and p2.status = 'active'
          join public.hospital_membership_roles hmr2
            on hmr2.hospital_membership_id = hm2.id
           and hmr2.status = 'active'
           and hmr2.revoked_at is null
          join public.roles r2
            on r2.id = hmr2.role_id
           and r2.scope = hmr2.role_scope
           and r2.scope = 'hospital'
           and r2.code = 'hospital_admin'
          where hm2.hospital_id = t.hospital_id
            and hm2.status = 'active'
            and hm2.id <> hm.id
        )
      )
    ) as can_suspend,
    (cm.can_manage and hm.status = 'suspended') as can_reactivate,
    case when cm.can_manage then
      coalesce(
        (
          select jsonb_agg(
                   jsonb_build_object(
                     'label', r.display_name,
                     'roleRef', r.management_ref,
                     'canRevoke', (
                       r.code <> 'hospital_admin'
                       or (
                         om.user_id <> auth.uid()
                         and not (
                           hm.status = 'active'
                           and not exists (
                             select 1
                             from public.hospital_memberships hm3
                             join public.organization_memberships om3
                               on om3.id = hm3.organization_membership_id
                              and om3.status = 'active'
                             join public.profiles p3
                               on p3.id = om3.user_id
                              and p3.status = 'active'
                             join public.hospital_membership_roles hmr3
                               on hmr3.hospital_membership_id = hm3.id
                              and hmr3.status = 'active'
                              and hmr3.revoked_at is null
                             join public.roles r3
                               on r3.id = hmr3.role_id
                              and r3.scope = hmr3.role_scope
                              and r3.scope = 'hospital'
                              and r3.code = 'hospital_admin'
                             where hm3.hospital_id = t.hospital_id
                               and hm3.status = 'active'
                               and hm3.id <> hm.id
                           )
                         )
                       )
                     )
                   )
                   order by r.display_name
                 )
          from public.hospital_membership_roles hmr
          join public.roles r
            on r.id = hmr.role_id
           and r.scope = hmr.role_scope
           and r.scope = 'hospital'
          where hmr.hospital_membership_id = hm.id
            and hmr.status = 'active'
            and hmr.revoked_at is null
        ),
        '[]'::jsonb
      )
    else null end as assigned_roles
  from authorized_target t
  cross join caller_manage cm
  join public.hospital_memberships hm
    on hm.hospital_id = t.hospital_id
   and hm.organization_id = t.organization_id
   and hm.status in ('active', 'suspended', 'pending')
  join public.organization_memberships om
    on om.id = hm.organization_membership_id
   and om.status = 'active'
  join public.profiles p
    on p.id = om.user_id
   and p.status = 'active'
  order by p.display_name, p.id;
$$;

revoke execute on function public.get_hospital_team(uuid) from public;
revoke execute on function public.get_hospital_team(uuid) from anon;
grant execute on function public.get_hospital_team(uuid) to authenticated;
