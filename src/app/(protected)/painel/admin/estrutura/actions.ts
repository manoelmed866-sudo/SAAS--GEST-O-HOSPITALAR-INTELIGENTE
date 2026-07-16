"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveActiveHospitalCapabilities } from "@/lib/auth/capabilities";
import { createClient } from "@/lib/supabase/server";

// Sprint 05 - Server Actions do cadastro institucional hospitalar
//
// Responsabilidade:
// Criar unidades, setores, leitos e recursos institucionais do hospital ATIVO
// e alternar o status (ativo/inativo) de itens existentes. O navegador envia
// SOMENTE campos de formulario (codigo, nome, descricao) e referencias opacas
// (32 hex); o hospital e a organizacao vem EXCLUSIVAMENTE do contexto ativo
// revalidado no servidor. A barreira final e o RLS da Sprint 05: as mutacoes
// sao diretas sob o cliente autenticado (SECURITY INVOKER por construcao) e as
// policies fail-closed exigem hospital_structure.manage.
//
// Limites de seguranca:
// - Nenhum hospitalId, organizationId, UUID, papel ou permissao vem do
//   navegador; referencias opacas nunca autorizam nada.
// - Sem service_role, sem leitura de auth.users, sem redirect.
// - Nenhum DELETE: desativacao logica por status.
// - Nenhum erro interno, UUID ou codigo cru vaza em mensagem.

export type StructureMutationState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "denied"; message: string }
  | { status: "blocked"; message: string }
  | { status: "error"; message: string };

const DENIED_MESSAGE = "Sua conta não está autorizada a executar esta ação.";
const CONTEXT_MESSAGE = "Selecione novamente o hospital para continuar.";
const TEMPORARY_ERROR_MESSAGE =
  "Não foi possível concluir a ação agora. Tente novamente.";
const INVALID_INPUT_MESSAGE =
  "Revise os campos informados: use código com letras minúsculas, números e hifens.";
const DUPLICATE_CODE_MESSAGE =
  "Já existe um item com este código neste hospital.";
const PARENT_UNAVAILABLE_MESSAGE =
  "O item de vínculo selecionado não está mais disponível.";
const STATUS_UNAVAILABLE_MESSAGE =
  "O item não está mais disponível para esta ação.";

// Codigo institucional: slug minusculo, mesmo formato validado pelo banco.
const codeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(60);

const displayNameSchema = z.string().trim().min(1).max(120);

const opaqueRefSchema = z.string().regex(/^[0-9a-f]{32}$/);

const descriptionSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length === 0 ? null : value));

function getStringField(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

type ManageGate =
  | {
      status: "allowed";
      organizationId: string;
      hospitalId: string;
    }
  | { status: "denied"; message: string }
  | { status: "error"; message: string };

// Gate comum: contexto ativo revalidado + canManageStructure. A RLS revalida
// tudo novamente no banco; este gate apenas evita mutacoes obviamente negadas
// e produz mensagens amigaveis.
async function requireManageStructure(): Promise<ManageGate> {
  const capabilities = await resolveActiveHospitalCapabilities();

  if (capabilities.status === "error") {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  if (capabilities.status !== "active") {
    return { status: "error", message: CONTEXT_MESSAGE };
  }

  if (!capabilities.capabilities.canManageStructure) {
    return { status: "denied", message: DENIED_MESSAGE };
  }

  return {
    status: "allowed",
    organizationId: capabilities.context.organizationId,
    hospitalId: capabilities.context.hospitalId,
  };
}

type SupabaseMutationError = { code?: string | null } | null;

// Traducao fail-closed de erros do banco: unicidade vira mensagem de codigo
// duplicado; violacao de check (inclui pai inativo) e RLS negada viram
// mensagens genericas sem detalhe interno.
function mapInsertError(error: SupabaseMutationError): StructureMutationState {
  if (error?.code === "23505") {
    return { status: "blocked", message: DUPLICATE_CODE_MESSAGE };
  }

  if (error?.code === "23514") {
    return { status: "blocked", message: PARENT_UNAVAILABLE_MESSAGE };
  }

  if (error?.code === "42501") {
    return { status: "denied", message: DENIED_MESSAGE };
  }

  return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
}

export async function createUnitAction(
  previousState: StructureMutationState,
  formData: FormData,
): Promise<StructureMutationState> {
  void previousState;

  const parsedInput = z
    .object({ code: codeSchema, displayName: displayNameSchema })
    .safeParse({
      code: getStringField(formData, "code"),
      displayName: getStringField(formData, "displayName"),
    });

  if (!parsedInput.success) {
    return { status: "blocked", message: INVALID_INPUT_MESSAGE };
  }

  const gate = await requireManageStructure();

  if (gate.status !== "allowed") {
    return { status: gate.status, message: gate.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hospital_units").insert({
    // O hospital e a organizacao vem EXCLUSIVAMENTE do contexto ativo.
    organization_id: gate.organizationId,
    hospital_id: gate.hospitalId,
    code: parsedInput.data.code,
    display_name: parsedInput.data.displayName,
  });

  if (error) {
    return mapInsertError(error);
  }

  revalidatePath("/painel/admin/estrutura");

  return { status: "success", message: "Unidade criada com sucesso." };
}

export async function createSectorAction(
  previousState: StructureMutationState,
  formData: FormData,
): Promise<StructureMutationState> {
  void previousState;

  const parsedInput = z
    .object({
      unitRef: opaqueRefSchema,
      code: codeSchema,
      displayName: displayNameSchema,
    })
    .safeParse({
      unitRef: getStringField(formData, "unitRef"),
      code: getStringField(formData, "code"),
      displayName: getStringField(formData, "displayName"),
    });

  if (!parsedInput.success) {
    return { status: "blocked", message: INVALID_INPUT_MESSAGE };
  }

  const gate = await requireManageStructure();

  if (gate.status !== "allowed") {
    return { status: gate.status, message: gate.message };
  }

  const supabase = await createClient();

  // Resolve a unidade-mae pela referencia opaca, restrita ao hospital ativo e
  // sob RLS; unidade inexistente, de outro hospital ou inativa recebem a MESMA
  // resposta. O trigger do banco garante o invariante mesmo em corrida.
  const unitResult = await supabase
    .from("hospital_units")
    .select("id")
    .eq("hospital_id", gate.hospitalId)
    .eq("management_ref", parsedInput.data.unitRef)
    .eq("status", "active")
    .maybeSingle();

  if (unitResult.error) {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  if (!unitResult.data) {
    return { status: "blocked", message: PARENT_UNAVAILABLE_MESSAGE };
  }

  const { error } = await supabase.from("hospital_sectors").insert({
    organization_id: gate.organizationId,
    hospital_id: gate.hospitalId,
    unit_id: unitResult.data.id,
    code: parsedInput.data.code,
    display_name: parsedInput.data.displayName,
  });

  if (error) {
    return mapInsertError(error);
  }

  revalidatePath("/painel/admin/estrutura");

  return { status: "success", message: "Setor criado com sucesso." };
}

export async function createBedAction(
  previousState: StructureMutationState,
  formData: FormData,
): Promise<StructureMutationState> {
  void previousState;

  const parsedInput = z
    .object({
      sectorRef: opaqueRefSchema,
      code: codeSchema,
      displayName: displayNameSchema,
    })
    .safeParse({
      sectorRef: getStringField(formData, "sectorRef"),
      code: getStringField(formData, "code"),
      displayName: getStringField(formData, "displayName"),
    });

  if (!parsedInput.success) {
    return { status: "blocked", message: INVALID_INPUT_MESSAGE };
  }

  const gate = await requireManageStructure();

  if (gate.status !== "allowed") {
    return { status: gate.status, message: gate.message };
  }

  const supabase = await createClient();

  const sectorResult = await supabase
    .from("hospital_sectors")
    .select("id")
    .eq("hospital_id", gate.hospitalId)
    .eq("management_ref", parsedInput.data.sectorRef)
    .eq("status", "active")
    .maybeSingle();

  if (sectorResult.error) {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  if (!sectorResult.data) {
    return { status: "blocked", message: PARENT_UNAVAILABLE_MESSAGE };
  }

  const { error } = await supabase.from("hospital_beds").insert({
    organization_id: gate.organizationId,
    hospital_id: gate.hospitalId,
    sector_id: sectorResult.data.id,
    code: parsedInput.data.code,
    display_name: parsedInput.data.displayName,
  });

  if (error) {
    return mapInsertError(error);
  }

  revalidatePath("/painel/admin/estrutura");

  return { status: "success", message: "Leito criado com sucesso." };
}

export async function createResourceAction(
  previousState: StructureMutationState,
  formData: FormData,
): Promise<StructureMutationState> {
  void previousState;

  const parsedInput = z
    .object({
      code: codeSchema,
      displayName: displayNameSchema,
      description: descriptionSchema,
    })
    .safeParse({
      code: getStringField(formData, "code"),
      displayName: getStringField(formData, "displayName"),
      description: getStringField(formData, "description"),
    });

  if (!parsedInput.success) {
    return { status: "blocked", message: INVALID_INPUT_MESSAGE };
  }

  const gate = await requireManageStructure();

  if (gate.status !== "allowed") {
    return { status: gate.status, message: gate.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hospital_resources").insert({
    organization_id: gate.organizationId,
    hospital_id: gate.hospitalId,
    code: parsedInput.data.code,
    display_name: parsedInput.data.displayName,
    description: parsedInput.data.description,
  });

  if (error) {
    return mapInsertError(error);
  }

  revalidatePath("/painel/admin/estrutura");

  return { status: "success", message: "Recurso criado com sucesso." };
}

// Enum fechado dos tipos de item: o cliente nunca envia nome de tabela.
const structureKindSchema = z.enum(["unit", "sector", "bed", "resource"]);

type StructureKind = z.infer<typeof structureKindSchema>;

const STRUCTURE_TABLE: Record<
  StructureKind,
  "hospital_units" | "hospital_sectors" | "hospital_beds" | "hospital_resources"
> = {
  unit: "hospital_units",
  sector: "hospital_sectors",
  bed: "hospital_beds",
  resource: "hospital_resources",
};

const statusInputSchema = z.object({
  kind: structureKindSchema,
  managementRef: opaqueRefSchema,
  requestedStatus: z.enum(["active", "inactive"]),
});

export async function changeStructureStatusAction(
  previousState: StructureMutationState,
  formData: FormData,
): Promise<StructureMutationState> {
  void previousState;

  const parsedInput = statusInputSchema.safeParse({
    kind: getStringField(formData, "kind"),
    managementRef: getStringField(formData, "managementRef"),
    requestedStatus: getStringField(formData, "requestedStatus"),
  });

  if (!parsedInput.success) {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  const gate = await requireManageStructure();

  if (gate.status !== "allowed") {
    return { status: gate.status, message: gate.message };
  }

  const supabase = await createClient();

  // UPDATE restrito ao hospital ativo e a referencia opaca, sob RLS. Item
  // inexistente, de outro hospital ou sem autorizacao produzem a MESMA
  // resposta (zero linhas), sem enumeracao.
  const { data, error } = await supabase
    .from(STRUCTURE_TABLE[parsedInput.data.kind])
    .update({ status: parsedInput.data.requestedStatus })
    .eq("hospital_id", gate.hospitalId)
    .eq("management_ref", parsedInput.data.managementRef)
    .neq("status", parsedInput.data.requestedStatus)
    .select("status");

  if (error) {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  if (!data || data.length === 0) {
    return { status: "blocked", message: STATUS_UNAVAILABLE_MESSAGE };
  }

  revalidatePath("/painel/admin/estrutura");

  return {
    status: "success",
    message:
      parsedInput.data.requestedStatus === "inactive"
        ? "Item desativado com sucesso."
        : "Item reativado com sucesso.",
  };
}
