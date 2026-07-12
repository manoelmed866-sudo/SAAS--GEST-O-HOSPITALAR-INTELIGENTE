"use client";

import { useActionState } from "react";
import type {
  AuthorizedHospital,
  AuthorizedOrganization,
} from "@/lib/auth/context";
import {
  type SelectContextActionState,
  selectActiveContextAction,
} from "./actions";

// Sprint 03D2 - Formulario cliente de selecao de contexto (Etapa 2)
//
// Exibe os hospitais autorizados (ja carregados no servidor sob RLS) em um
// radiogroup e submete a selecao pela Server Action. Nao busca dados no
// cliente, nao consulta Supabase, nao usa storage do navegador e nunca usa o
// organizationId como texto visivel. O nome da organizacao e resolvido apenas
// para apresentacao e nunca vira fonte de autorizacao.

type ContextSelectorFormProps = {
  hospitals: AuthorizedHospital[];
  organizations: AuthorizedOrganization[];
};

const INITIAL_STATE: SelectContextActionState = {
  status: "idle",
};

const STATUS_MESSAGE_ID = "context-selector-status";

export function ContextSelectorForm({
  hospitals,
  organizations,
}: ContextSelectorFormProps) {
  const [state, formAction, isPending] = useActionState(
    selectActiveContextAction,
    INITIAL_STATE,
  );

  const organizationNameById = new Map(
    organizations.map((organization) => [
      organization.id,
      organization.displayName,
    ]),
  );

  const hasMessage = state.status !== "idle";

  return (
    <form
      action={formAction}
      aria-describedby={hasMessage ? STATUS_MESSAGE_ID : undefined}
      aria-labelledby="context-selector-legend"
      className="context-selector-form"
    >
      <fieldset className="context-selector-options" disabled={isPending}>
        <legend id="context-selector-legend">Escolha o hospital</legend>

        {hospitals.map((hospital) => {
          const organizationName = organizationNameById.get(
            hospital.organizationId,
          );
          const inputId = `context-option-${hospital.id}`;

          return (
            <div key={hospital.id} className="context-option">
              <input
                id={inputId}
                name="contextSelection"
                type="radio"
                value={`${hospital.organizationId}:${hospital.id}`}
              />
              <label htmlFor={inputId}>
                <span className="context-option__hospital">
                  {hospital.displayName}
                </span>
                {organizationName ? (
                  <span className="context-option__organization">
                    {organizationName}
                  </span>
                ) : null}
                <span className="context-option__code">{hospital.code}</span>
              </label>
            </div>
          );
        })}
      </fieldset>

      {hasMessage ? (
        <p aria-live="polite" id={STATUS_MESSAGE_ID} role="status">
          {state.message}
        </p>
      ) : null}

      <button className="button" disabled={isPending} type="submit">
        {isPending ? "Confirmando..." : "Confirmar seleção"}
      </button>
    </form>
  );
}
