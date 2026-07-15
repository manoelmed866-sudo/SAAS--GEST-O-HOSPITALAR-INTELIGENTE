-- Sprint 04C.2 - Hardening: RPC como unico caminho de alteracao de status
--
-- Responsabilidade:
-- 1. Revogar o UPDATE(status) direto de authenticated em hospital_memberships,
--    concedido na Sprint 03A antes da existencia da RPC transacional auditada.
--    A partir daqui, public.change_hospital_membership_status (SECURITY
--    DEFINER, auditada, com lock e protecoes) e o UNICO caminho de mutacao de
--    status de vinculo hospitalar.
-- 2. Remover a policy hospital_memberships_update_allowed, que autorizava o
--    UPDATE direto agora revogado.
-- 3. Constraint cruzada de consistencia na auditoria administrativa: cada
--    event_type so aceita a transicao de status que ele descreve.
--
-- Limites:
-- - Nenhum grant novo; nenhuma alteracao de SELECT/INSERT existentes.
-- - Nenhuma policy de leitura alterada; RLS de outras tabelas intocado.
-- - organization_memberships e tabelas de papeis permanecem como estao.
-- - Nenhuma funcao app_private alterada; nenhum SQL dinamico; auth.users
--   intocado.

-- === 1. Revogacao do UPDATE direto ===========================================

revoke update (status)
on table public.hospital_memberships
from authenticated;

-- === 2. Remocao da policy de UPDATE ==========================================

drop policy if exists hospital_memberships_update_allowed
on public.hospital_memberships;

-- === 3. Consistencia evento/transicao na auditoria ===========================
-- Somente as duas combinacoes coerentes sao aceitas:
--   suspended:  active -> suspended
--   reactivated: suspended -> active
-- Qualquer outra combinacao falha, mesmo vinda de codigo privilegiado.

alter table public.administrative_audit_events
  add constraint administrative_audit_events_transition_consistency_check check (
    (
      event_type = 'hospital_membership_suspended'
      and previous_status = 'active'
      and new_status = 'suspended'
    )
    or (
      event_type = 'hospital_membership_reactivated'
      and previous_status = 'suspended'
      and new_status = 'active'
    )
  );
