"use client";

import { useActionState, useState } from "react";
import {
  type StructureMutationState,
  changeStructureStatusAction,
} from "./actions";

// Sprint 05 - Controle cliente de ativacao/desativacao de item da estrutura
//
// Renderiza somente a acao coerente com o status atual indicado pelo servidor
// (ativo -> Desativar; inativo -> Reativar), com confirmacao explicita inline
// antes de submeter. O formulario envia APENAS o tipo do item (enum fechado),
// a referencia opaca e o status solicitado; nenhum hospitalId, organizationId,
// UUID, papel ou permissao trafega pelo navegador. A Server Action e o RLS
// revalidam tudo no servidor; nenhuma exclusao fisica existe.

type StructureStatusControlsProps = {
  kind: "unit" | "sector" | "bed" | "resource";
  managementRef: string;
  currentStatus: "active" | "inactive";
};

const INITIAL_STATE: StructureMutationState = { status: "idle" };

export function StructureStatusControls({
  kind,
  managementRef,
  currentStatus,
}: StructureStatusControlsProps) {
  const [state, formAction, isPending] = useActionState(
    changeStructureStatusAction,
    INITIAL_STATE,
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const requestedStatus = currentStatus === "active" ? "inactive" : "active";
  const actionLabel = currentStatus === "active" ? "Desativar" : "Reativar";
  const confirmLabel =
    currentStatus === "active" ? "Confirmar desativação" : "Confirmar reativação";

  return (
    <div className="structure-item__controls">
      {isConfirming ? (
        <form action={formAction} onSubmit={() => setIsConfirming(false)}>
          <input name="kind" type="hidden" value={kind} />
          <input name="managementRef" type="hidden" value={managementRef} />
          <input name="requestedStatus" type="hidden" value={requestedStatus} />
          <button className="button" disabled={isPending} type="submit">
            {confirmLabel}
          </button>
          <button
            className="button button--secondary"
            disabled={isPending}
            onClick={() => setIsConfirming(false)}
            type="button"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          className="button button--secondary"
          disabled={isPending}
          onClick={() => setIsConfirming(true)}
          type="button"
        >
          {actionLabel}
        </button>
      )}

      {state.status !== "idle" ? (
        <p aria-live="polite" role="status">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
