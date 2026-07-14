import {
  type HospitalCapabilities,
  resolveActiveHospitalCapabilities,
} from "@/lib/auth/capabilities";
import type { ActiveContext } from "@/lib/auth/context";

// Sprint 04B1 - Gate server-side por capacidade
//
// Responsabilidade:
// Avaliar UMA capacidade semantica do hospital ativo e devolver um resultado
// discriminado, para que paginas e navegacao decidam o que renderizar. A
// avaliacao delega inteiramente a resolveActiveHospitalCapabilities (04A2), que
// ja resolve o contexto ativo e as capacidades sob RLS. Este helper nao acessa
// Supabase, nao cria cliente, nao chama RPC, nao consulta tabelas, nao le
// cookie, navegador, URL, query string ou form data, nao redireciona, nao chama
// notFound e nao usa service_role. Ele tambem nao interpreta papel, scope ou
// codigo cru de permissao.
//
// Fonte unica do hospital:
// O hospital vem exclusivamente de resolveActiveHospitalCapabilities (que o
// obtem de resolveActiveContext, revalidado sob RLS). O helper nao recebe
// hospitalId nem organizationId.
//
// Contrato de saida:
// Devolve apenas status + (quando aplicavel) o mesmo ActiveContext revalidado.
// Nunca devolve o objeto completo de capacidades: expor "pode X?" e suficiente
// para a UI, sem vazar o mapa de capacidades. A UI nunca e barreira de
// seguranca; a barreira final permanece no RLS.

export type HospitalCapability = keyof HospitalCapabilities;

export type CapabilityGateResult =
  | { status: "allowed"; context: ActiveContext }
  | { status: "denied"; context: ActiveContext }
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "error" };

export async function evaluateHospitalCapability(
  capability: HospitalCapability,
): Promise<CapabilityGateResult> {
  const result = await resolveActiveHospitalCapabilities();

  // absent / invalid / error sao propagados com a mesma forma discriminada.
  if (result.status !== "active") {
    return result;
  }

  // Somente a capacidade solicitada decide; o conjunto completo nao e devolvido.
  return result.capabilities[capability]
    ? { status: "allowed", context: result.context }
    : { status: "denied", context: result.context };
}
