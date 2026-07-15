-- Sprint 04C.1 - Listagem somente leitura da equipe do hospital ativo
--
-- Responsabilidade:
-- Expor, para um hospital alvo, a lista minima dos integrantes vinculados:
-- nome de exibicao, status do vinculo hospitalar e rotulos amigaveis dos
-- papeis hospitalares ativos. Nunca devolve UUID, e-mail, codigo cru de
-- permissao, role.code ou dados de outro hospital.
--
-- Estrategia de seguranca (SECURITY DEFINER com validacao interna):
-- A auditoria da 04C comprovou que a leitura da equipe e estruturalmente
-- bloqueada sob RLS para o hospital_admin: a policy de SELECT de
-- public.organization_memberships exige permissao ORGANIZACIONAL
-- (organization_memberships.read), que o papel hospitalar nao possui; sem ler
-- organization_memberships nao ha como ligar o vinculo hospitalar ao profile.
-- SECURITY INVOKER herdaria exatamente esse bloqueio. Por isso esta funcao e
-- SECURITY DEFINER e valida a autorizacao EXPLICITAMENTE antes de qualquer
-- linha, reproduzindo a semantica de can_read_memberships da Sprint 04A:
-- perfil ativo E permissao hospital_memberships.read por papel hospitalar
-- ativo/nao revogado no hospital alvo OU papel organizacional ativo/nao
-- revogado na organizacao proprietaria. Sem permissao, zero linhas
-- (fail-closed). Nenhum bypass por nome de papel e nenhum bypass automatico
-- para platform_admin.
--
-- Limites:
-- - Nenhuma policy, RLS, grant de tabela, role ou permission alterada.
-- - Nenhuma leitura de auth.users; o nome vem de public.profiles.
-- - Nenhuma mutacao: funcao STABLE, somente leitura.

create or replace function public.get_hospital_team(
  target_hospital_id uuid
)
returns table (
  display_name text,
  membership_status text,
  role_labels text[]
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
  )
  select
    p.display_name,
    hm.status as membership_status,
    -- Rotulos amigaveis dos papeis hospitalares ativos e nao revogados,
    -- ordenados deterministicamente. Sem papel valido, array vazio.
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
    ) as role_labels
  from authorized_target t
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

-- Grants explicitos: nenhum acesso para public/anon; apenas authenticated executa.
revoke execute on function public.get_hospital_team(uuid) from public;
revoke execute on function public.get_hospital_team(uuid) from anon;
grant execute on function public.get_hospital_team(uuid) to authenticated;
