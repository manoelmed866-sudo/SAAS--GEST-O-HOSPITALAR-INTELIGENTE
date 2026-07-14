import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { requirePortalAccess } from "@/lib/auth/access";
import { resolveActiveHospitalCapabilities } from "@/lib/auth/capabilities";

// Sprint 04B2 - Painel contextual com capacidades efetivas
//
// O painel primeiro aplica o gate de acesso (requirePortalAccess) e so entao
// resolve, numa unica chamada, o contexto ativo E as capacidades efetivas do
// hospital ativo (resolveActiveHospitalCapabilities, 04A2), renderizando
// distintamente os quatro estados active/absent/invalid/error. O painel nao
// chama resolveActiveContext diretamente, nao consulta o Supabase, nao usa
// createClient/service role, nao le cookies diretamente, nao redireciona e
// nunca exibe UUIDs. Nome e codigo do hospital vem exclusivamente do contexto
// revalidado sob RLS.
//
// Link condicional:
// "Gerenciar equipe" so e renderizado quando canManageMemberships e verdadeiro.
// Quando falso, o link simplesmente nao existe: nada de botao desabilitado nem
// explicacao de permissao interna. Nenhum nome de capacidade, papel, scope ou
// codigo de permissao e exibido ao usuario. "Trocar hospital" permanece em todo
// contexto active, independentemente de canSwitchContext, pois a barreira final
// da troca continua no servidor sob RLS.

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const access = await requirePortalAccess();
  const context = await resolveActiveHospitalCapabilities();

  return (
    <section className="section" aria-labelledby="panel-title">
      <div className="site-container">
        <div className="foundation-panel">
          <p className="eyebrow">Contexto institucional</p>
          <h1 id="panel-title">Painel inicial</h1>
          <p>
            Bem-vindo, {access.displayName}. Seu acesso institucional ativo foi
            validado para entrada no painel.
          </p>

          {context.status === "active" ? (
            <>
              <h2>Plantão ativo</h2>
              <p>
                Você está trabalhando em {context.context.hospitalDisplayName}.
              </p>
              <p>Código da unidade: {context.context.hospitalCode}</p>
            </>
          ) : null}

          {context.status === "absent" ? (
            <>
              <h2>Selecione um hospital</h2>
              <p>Você ainda não selecionou a unidade deste acesso.</p>
            </>
          ) : null}

          {context.status === "invalid" ? (
            <>
              <h2>Selecione novamente o hospital</h2>
              <p>
                O hospital selecionado não está mais disponível para o seu
                acesso.
              </p>
            </>
          ) : null}

          {context.status === "error" ? (
            <>
              <h2>Não foi possível carregar o contexto do hospital</h2>
              <p>Ocorreu uma falha temporária. Tente novamente em instantes.</p>
            </>
          ) : null}

          <div className="state-actions">
            {context.status === "active" ? (
              <>
                <Link
                  className="button button--secondary"
                  href="/painel/selecionar-contexto"
                >
                  Trocar hospital
                </Link>
                {context.capabilities.canManageMemberships ? (
                  <Link className="button" href="/painel/admin/equipe">
                    Gerenciar equipe
                  </Link>
                ) : null}
              </>
            ) : null}

            {context.status === "absent" ? (
              <Link
                className="button button--secondary"
                href="/painel/selecionar-contexto"
              >
                Selecionar hospital
              </Link>
            ) : null}

            {context.status === "invalid" ? (
              <Link
                className="button button--secondary"
                href="/painel/selecionar-contexto"
              >
                Selecionar outro hospital
              </Link>
            ) : null}

            {context.status === "error" ? (
              <>
                <Link className="button" href="/painel">
                  Tentar novamente
                </Link>
                <Link
                  className="button button--secondary"
                  href="/painel/selecionar-contexto"
                >
                  Selecionar hospital
                </Link>
              </>
            ) : null}

            <form action={logoutAction}>
              <button className="button" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
