"use client";

import { useActionState, useState } from "react";
import {
  type MembershipMutationState,
  changeMembershipStatusAction,
} from "./actions";

// Sprint 04C.2 - Controles cliente de suspensao/reativacao de vinculo
//
// Renderiza, por integrante, somente a acao que o servidor indicou como
// possivel (canSuspend/canReactivate), com confirmacao explicita inline antes
// de submeter. O formulario envia APENAS a referencia opaca (managementRef) e
// o estado solicitado; nenhum hospitalId, organizationId, UUID, papel ou
// permissao trafega pelo navegador. Os indicadores sao orientacao de
// interface: a Server Action e a RPC revalidam tudo no servidor.

type TeamMemberControlsProps = {
  managementRef: string;
  canSuspend: boolean;
  canReactivate: boolean;
};

const INITIAL_STATE: MembershipMutationState = { status: "idle" };

type PendingAction = "suspended" | "active" | null;

export function TeamMemberControls({
  managementRef,
  canSuspend,
  canReactivate,
}: TeamMemberControlsProps) {
  const [state, formAction, isPending] = useActionState(
    changeMembershipStatusAction,
    INITIAL_STATE,
  );
  const [confirmingAction, setConfirmingAction] = useState<PendingAction>(null);

  const hasMessage = state.status !== "idle";

  return (
    <div className="team-member__controls">
      {confirmingAction === null ? (
        <>
          {canSuspend ? (
            <button
              className="button button--secondary"
              disabled={isPending}
              onClick={() => setConfirmingAction("suspended")}
              type="button"
            >
              Suspender vínculo
            </button>
          ) : null}
          {canReactivate ? (
            <button
              className="button button--secondary"
              disabled={isPending}
              onClick={() => setConfirmingAction("active")}
              type="button"
            >
              Reativar vínculo
            </button>
          ) : null}
        </>
      ) : (
        <form action={formAction} onSubmit={() => setConfirmingAction(null)}>
          <input name="managementRef" type="hidden" value={managementRef} />
          <input
            name="requestedStatus"
            type="hidden"
            value={confirmingAction}
          />
          <button className="button" disabled={isPending} type="submit">
            {confirmingAction === "suspended"
              ? "Confirmar suspensão"
              : "Confirmar reativação"}
          </button>
          <button
            className="button button--secondary"
            disabled={isPending}
            onClick={() => setConfirmingAction(null)}
            type="button"
          >
            Cancelar
          </button>
        </form>
      )}

      {hasMessage ? (
        <p aria-live="polite" role="status">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
