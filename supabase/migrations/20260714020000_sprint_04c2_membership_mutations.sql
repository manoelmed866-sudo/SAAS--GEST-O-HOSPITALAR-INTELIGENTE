-- Sprint 04C.2 - Suspensao e reativacao de vinculos hospitalares com auditoria
--
-- Responsabilidade:
-- 1. Referencia publica opaca (management_ref) em hospital_memberships, para
--    que acoes administrativas nunca transportem o UUID interno em HTML ou
--    FormData.
-- 2. Tabela append-only de auditoria administrativa, sem acesso direto da
--    aplicacao (nenhum grant, nenhuma policy permissiva); insercao somente
--    pela RPC de mutacao, na MESMA transacao da alteracao.
-- 3. RPC unica de mutacao change_hospital_membership_status, SECURITY DEFINER
--    com validacao interna explicita, lock do hospital para serializar
--    mutacoes concorrentes, protecao contra auto-suspensao e contra suspensao
--    do ultimo administrador ativo.
-- 4. get_hospital_team estendida com metadados de acao (management_ref,
--    can_suspend, can_reactivate) apenas para quem possui manage; indicadores
--    sao orientacao de interface e a RPC de mutacao revalida tudo.
--
-- Limites:
-- - Nenhuma policy ou grant de tabela existente e alterado ou enfraquecido.
-- - Nenhuma revogacao, delete, alteracao de papel, convite ou conta.
-- - Nenhuma leitura de auth.users; nenhum e-mail; nenhum UUID novo exposto.
-- - Transicoes permitidas: active -> suspended e suspended -> active.
--   pending e revoked sao intocaveis nesta etapa (revoked permanece terminal).

-- === 1. Referencia opaca ======================================================

alter table public.hospital_memberships
  add column management_ref text not null
    default encode(extensions.gen_random_bytes(16), 'hex');

alter table public.hospital_memberships
  add constraint hospital_memberships_management_ref_unique unique (management_ref),
  add constraint hospital_memberships_management_ref_format
    check (management_ref ~ '^[0-9a-f]{32}$');

-- === 2. Auditoria administrativa =============================================

create table public.administrative_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  hospital_id uuid not null references public.hospitals(id) on delete restrict,
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  target_hospital_membership_id uuid not null references public.hospital_memberships(id) on delete restrict,
  event_type text not null,
  previous_status text not null,
  new_status text not null,
  created_at timestamptz not null default now(),
  constraint administrative_audit_events_event_type_check check (
    event_type in ('hospital_membership_suspended', 'hospital_membership_reactivated')
  ),
  constraint administrative_audit_events_previous_status_check check (
    previous_status in ('active', 'suspended')
  ),
  constraint administrative_audit_events_new_status_check check (
    new_status in ('active', 'suspended')
  )
);

create index administrative_audit_events_hospital_idx
  on public.administrative_audit_events(hospital_id, created_at);
create index administrative_audit_events_actor_idx
  on public.administrative_audit_events(actor_profile_id);
create index administrative_audit_events_target_idx
  on public.administrative_audit_events(target_hospital_membership_id);

-- RLS habilitado SEM policy: nenhuma leitura ou escrita direta pela aplicacao.
-- A insercao acontece exclusivamente dentro da RPC SECURITY DEFINER.
alter table public.administrative_audit_events enable row level security;
revoke all on table public.administrative_audit_events from public, anon, authenticated;

-- === 3. RPC de mutacao ========================================================

create or replace function public.change_hospital_membership_status(
  target_hospital_id uuid,
  target_management_ref text,
  requested_status text
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
begin
  -- Somente os dois estados desta etapa; qualquer outro pedido e invalido.
  if requested_status is null
     or requested_status not in ('active', 'suspended') then
    return 'invalid_transition';
  end if;

  -- Autorizacao explicita do ator: perfil ativo e hospital_memberships.manage
  -- por papel hospitalar OU organizacional (ativo, nao revogado). Sem acesso
  -- por nome de papel e sem bypass para platform_admin. Fail-closed.
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

  -- Lock do hospital: serializa mutacoes administrativas concorrentes no mesmo
  -- hospital, garantindo que a checagem de ultimo administrador enxergue o
  -- estado consolidado.
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

  -- Alvo pela referencia opaca, restrito ao hospital/organizacao travados,
  -- com vinculo organizacional e perfil alvo ativos. Alvo inexistente e alvo
  -- fora do escopo retornam o MESMO resultado, evitando enumeracao.
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
    and hm.management_ref = target_management_ref
  for update of hm;

  if not found then
    return 'not_allowed';
  end if;

  if requested_status = 'suspended' then
    -- Somente active -> suspended.
    if v_target.status <> 'active' then
      return 'invalid_transition';
    end if;

    -- O ator nunca suspende o proprio vinculo.
    if v_target.user_id = v_actor then
      return 'self_suspension_forbidden';
    end if;

    -- Ultimo administrador ativo: se o alvo e hospital_admin ativo e nao
    -- revogado e nao resta nenhum outro administrador qualificado, bloqueia.
    -- A checagem ocorre APOS o lock do hospital.
    if exists (
      select 1
      from public.hospital_membership_roles hmr
      join public.roles r
        on r.id = hmr.role_id
       and r.scope = hmr.role_scope
       and r.scope = 'hospital'
       and r.code = 'hospital_admin'
      where hmr.hospital_membership_id = v_target.id
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
      where hm2.hospital_id = v_hospital.id
        and hm2.status = 'active'
        and hm2.id <> v_target.id
    ) then
      return 'last_admin_forbidden';
    end if;
  else
    -- Somente suspended -> active (revoked permanece terminal; pending fica
    -- fora desta etapa; active -> active e repeticao invalida).
    if v_target.status <> 'suspended' then
      return 'invalid_transition';
    end if;
  end if;

  -- Alteracao e auditoria na MESMA transacao: qualquer falha reverte ambas.
  update public.hospital_memberships
     set status = requested_status
   where id = v_target.id;

  insert into public.administrative_audit_events (
    organization_id,
    hospital_id,
    actor_profile_id,
    target_hospital_membership_id,
    event_type,
    previous_status,
    new_status
  )
  values (
    v_hospital.organization_id,
    v_hospital.id,
    v_actor,
    v_target.id,
    case
      when requested_status = 'suspended' then 'hospital_membership_suspended'
      else 'hospital_membership_reactivated'
    end,
    v_target.status,
    requested_status
  );

  return 'updated';
end;
$$;

revoke execute on function public.change_hospital_membership_status(uuid, text, text) from public;
revoke execute on function public.change_hospital_membership_status(uuid, text, text) from anon;
grant execute on function public.change_hospital_membership_status(uuid, text, text) to authenticated;

-- === 4. get_hospital_team com metadados de acao ==============================
-- A alteracao do tipo de retorno exige drop + recreate; a semantica de leitura
-- e a validacao interna da 04C.1 (DEC-056) permanecem identicas.

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
  can_reactivate boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with
  -- Alvo autorizado: hospital ativo, organizacao proprietaria ativa, perfil
  -- do chamador ativo e permissao explicita hospital_memberships.read em um
  -- dos dois escopos qualificantes. Sem isso, zero linhas em tudo abaixo.
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
  -- Capacidade de gestao do chamador: define se os metadados de acao sao
  -- expostos. Leitores sem manage (ex.: auditor) recebem referencia nula e
  -- indicadores falsos. Estes indicadores sao apenas orientacao de interface;
  -- a RPC de mutacao revalida tudo.
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
    (cm.can_manage and hm.status = 'suspended') as can_reactivate
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
