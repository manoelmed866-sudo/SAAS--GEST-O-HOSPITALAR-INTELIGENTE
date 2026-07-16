"use client";

import { useActionState } from "react";
import {
  type StructureMutationState,
  createBedAction,
  createResourceAction,
  createSectorAction,
  createUnitAction,
} from "./actions";

// Sprint 05 - Formularios cliente de criacao da estrutura institucional
//
// Cada formulario envia SOMENTE campos de cadastro (codigo, nome, descricao) e,
// quando ha vinculo hierarquico, a referencia opaca (32 hex) da unidade ou do
// setor escolhido. Nenhum hospitalId, organizationId, UUID, papel ou permissao
// trafega pelo navegador. As opcoes de vinculo vem prontas do servidor (apenas
// itens ativos) e sao orientacao de interface: as Server Actions e o RLS
// revalidam tudo no servidor.

export type StructureParentOption = {
  label: string;
  managementRef: string;
};

const INITIAL_STATE: StructureMutationState = { status: "idle" };

function MutationMessage({ state }: { state: StructureMutationState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p aria-live="polite" role="status">
      {state.message}
    </p>
  );
}

export function CreateUnitForm() {
  const [state, formAction, isPending] = useActionState(
    createUnitAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="structure-form">
      <h3>Nova unidade</h3>
      <label>
        Código
        <input
          disabled={isPending}
          maxLength={60}
          name="code"
          required
          type="text"
        />
      </label>
      <label>
        Nome
        <input
          disabled={isPending}
          maxLength={120}
          name="displayName"
          required
          type="text"
        />
      </label>
      <button className="button" disabled={isPending} type="submit">
        Criar unidade
      </button>
      <MutationMessage state={state} />
    </form>
  );
}

export function CreateSectorForm({
  unitOptions,
}: {
  unitOptions: StructureParentOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    createSectorAction,
    INITIAL_STATE,
  );

  if (unitOptions.length === 0) {
    return (
      <div className="structure-form">
        <h3>Novo setor</h3>
        <p>Crie uma unidade ativa antes de cadastrar setores.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="structure-form">
      <h3>Novo setor</h3>
      <label>
        Unidade
        <select defaultValue="" disabled={isPending} name="unitRef" required>
          <option disabled value="">
            Selecione a unidade
          </option>
          {unitOptions.map((option) => (
            <option key={option.managementRef} value={option.managementRef}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Código
        <input
          disabled={isPending}
          maxLength={60}
          name="code"
          required
          type="text"
        />
      </label>
      <label>
        Nome
        <input
          disabled={isPending}
          maxLength={120}
          name="displayName"
          required
          type="text"
        />
      </label>
      <button className="button" disabled={isPending} type="submit">
        Criar setor
      </button>
      <MutationMessage state={state} />
    </form>
  );
}

export function CreateBedForm({
  sectorOptions,
}: {
  sectorOptions: StructureParentOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    createBedAction,
    INITIAL_STATE,
  );

  if (sectorOptions.length === 0) {
    return (
      <div className="structure-form">
        <h3>Novo leito</h3>
        <p>Crie um setor ativo antes de cadastrar leitos.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="structure-form">
      <h3>Novo leito</h3>
      <label>
        Setor
        <select defaultValue="" disabled={isPending} name="sectorRef" required>
          <option disabled value="">
            Selecione o setor
          </option>
          {sectorOptions.map((option) => (
            <option key={option.managementRef} value={option.managementRef}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Código
        <input
          disabled={isPending}
          maxLength={60}
          name="code"
          required
          type="text"
        />
      </label>
      <label>
        Nome
        <input
          disabled={isPending}
          maxLength={120}
          name="displayName"
          required
          type="text"
        />
      </label>
      <button className="button" disabled={isPending} type="submit">
        Criar leito
      </button>
      <MutationMessage state={state} />
    </form>
  );
}

export function CreateResourceForm() {
  const [state, formAction, isPending] = useActionState(
    createResourceAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="structure-form">
      <h3>Novo recurso institucional</h3>
      <label>
        Código
        <input
          disabled={isPending}
          maxLength={60}
          name="code"
          required
          type="text"
        />
      </label>
      <label>
        Nome
        <input
          disabled={isPending}
          maxLength={120}
          name="displayName"
          required
          type="text"
        />
      </label>
      <label>
        Descrição (opcional)
        <input
          disabled={isPending}
          maxLength={500}
          name="description"
          type="text"
        />
      </label>
      <button className="button" disabled={isPending} type="submit">
        Criar recurso
      </button>
      <MutationMessage state={state} />
    </form>
  );
}
