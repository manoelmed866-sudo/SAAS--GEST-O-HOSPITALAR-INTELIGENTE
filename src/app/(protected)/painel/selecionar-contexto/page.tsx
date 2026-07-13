import Link from "next/link";
import { requirePortalAccess } from "@/lib/auth/access";
import { getAuthorizedContextInventory } from "@/lib/auth/context";
import { ContextSelectorForm } from "./context-selector-form";

// Sprint 03D2 - Pagina server-side de selecao de contexto (Etapa 3)
//
// Executa o gate de acesso e carrega o inventario autorizado sob RLS, sem
// selecionar hospital automaticamente e sem redirecionar. Renderiza estados
// distintos para selecao, inventario vazio e falha tecnica, reusando as classes
// visuais existentes. Nao consulta Supabase diretamente, nao usa service role,
// storage do navegador, fetch, resolveActiveContext nem redirect.

export const dynamic = "force-dynamic";

export default async function SelectContextPage() {
  await requirePortalAccess();

  const result = await getAuthorizedContextInventory();

  if (result.status === "error") {
    return (
      <main className="state-page">
        <section className="state-panel" aria-labelledby="context-error-title">
          <p className="eyebrow">Contexto institucional</p>
          <h1 id="context-error-title">
            Não foi possível carregar seus hospitais
          </h1>
          <p>
            Ocorreu uma falha temporária ao carregar as unidades disponíveis
            para o seu acesso. Tente novamente em instantes.
          </p>

          <div className="state-actions">
            <Link className="button" href="/painel/selecionar-contexto">
              Tentar novamente
            </Link>
            <Link className="button button--secondary" href="/painel">
              Voltar ao painel
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { inventory } = result;

  if (inventory.hospitalCount === 0) {
    return (
      <main className="state-page">
        <section className="state-panel" aria-labelledby="context-empty-title">
          <p className="eyebrow">Contexto institucional</p>
          <h1 id="context-empty-title">Nenhum hospital disponível</h1>
          <p>
            No momento não há nenhuma unidade ativa disponível para o seu
            acesso. Fale com a administração da sua instituição se acredita que
            isso é um engano.
          </p>

          <div className="state-actions">
            <Link className="button button--secondary" href="/painel">
              Voltar ao painel
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="state-page">
      <section className="state-panel" aria-labelledby="context-select-title">
        <p className="eyebrow">Contexto institucional</p>
        <h1 id="context-select-title">Selecione o hospital do seu plantão</h1>
        <p>Escolha a unidade em que você irá trabalhar neste momento.</p>

        <ContextSelectorForm
          hospitals={inventory.hospitals}
          organizations={inventory.organizations}
        />
      </section>
    </main>
  );
}
