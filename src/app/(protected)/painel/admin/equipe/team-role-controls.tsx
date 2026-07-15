"use client";

import { useActionState, useState } from "react";
import type {
  HospitalAssignableRole,
  HospitalTeamAssignedRole,
} from "@/lib/auth/hospital-team";
import {
  type MembershipMutationState,
  changeMembershipRoleAction,
} from "./actions";

// Sprint 04 (fechamento) - Controles cliente de papeis hospitalares
//
// Renderiza, por integrante, a atribuicao e a revogacao de papeis hospitalares
// EXISTENTES, com confirmacao explicita inline antes de submeter. O formulario
// envia APENAS referencias opacas (membershipRef, roleRef) e a acao; nenhum
// hospitalId, organizationId, UUID, role.code, permission.code ou e-mail
// trafega pelo navegador. Os indicadores (canRevoke, catalogo) sao orientacao
// de interface: a Server Action e a RPC revalidam tudo no servidor.

type TeamRoleControlsProps = {
  membershipRef: string;
  assignedRoles: HospitalTeamAssignedRole[];
  assignableRoles: HospitalAssignableRole[];
};

const INITIAL_STATE: MembershipMutationState = { status: "idle" };

type PendingRoleAction = {
  action: "assign" | "revoke";
  roleRef: string;
  label: string;
} | null;

export function TeamRoleControls({
  membershipRef,
  assignedRoles,
  assignableRoles,
}: TeamRoleControlsProps) {
  const [state, formAction, isPending] = useActionState(
    changeMembershipRoleAction,
    INITIAL_STATE,
  );
  const [confirming, setConfirming] = useState<PendingRoleAction>(null);
  const [selectedRoleRef, setSelectedRoleRef] = useState("");

  const assignedRefs = new Set(assignedRoles.map((role) => role.roleRef));
  const availableRoles = assignableRoles.filter(
    (role) => !assignedRefs.has(role.roleRef),
  );
  const hasMessage = state.status !== "idle";

  return (
    <div className="team-member__roles-admin">
      {confirming === null ? (
        <>
          {assignedRoles
            .filter((role) => role.canRevoke)
            .map((role) => (
              <button
                className="button button--secondary"
                disabled={isPending}
                key={role.roleRef}
                onClick={() =>
                  setConfirming({
                    action: "revoke",
                    roleRef: role.roleRef,
                    label: role.label,
                  })
                }
                type="button"
              >
                Revogar papel: {role.label}
              </button>
            ))}
          {availableRoles.length > 0 ? (
            <>
              <label>
                Atribuir papel
                <select
                  disabled={isPending}
                  onChange={(event) => setSelectedRoleRef(event.target.value)}
                  value={selectedRoleRef}
                >
                  <option value="">Selecione um papel</option>
                  {availableRoles.map((role) => (
                    <option key={role.roleRef} value={role.roleRef}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button button--secondary"
                disabled={isPending || selectedRoleRef === ""}
                onClick={() => {
                  const role = availableRoles.find(
                    (candidate) => candidate.roleRef === selectedRoleRef,
                  );

                  if (role) {
                    setConfirming({
                      action: "assign",
                      roleRef: role.roleRef,
                      label: role.label,
                    });
                  }
                }}
                type="button"
              >
                Atribuir papel
              </button>
            </>
          ) : null}
        </>
      ) : (
        <form
          action={formAction}
          onSubmit={() => {
            setConfirming(null);
            setSelectedRoleRef("");
          }}
        >
          <input name="membershipRef" type="hidden" value={membershipRef} />
          <input name="roleRef" type="hidden" value={confirming.roleRef} />
          <input
            name="requestedAction"
            type="hidden"
            value={confirming.action}
          />
          <button className="button" disabled={isPending} type="submit">
            {confirming.action === "assign"
              ? `Confirmar atribuição: ${confirming.label}`
              : `Confirmar revogação: ${confirming.label}`}
          </button>
          <button
            className="button button--secondary"
            disabled={isPending}
            onClick={() => setConfirming(null)}
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
