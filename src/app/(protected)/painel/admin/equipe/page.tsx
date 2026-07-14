import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { requirePortalAccess } from "@/lib/auth/access";
import { evaluateHospitalCapability } from "@/lib/auth/capability-gate";

// Sprint 04B2 - Rota administrativa demonstrativa protegida no servidor
//
// Esta rota comprova o gate server-side por capacidade: mesmo que o link
// "Gerenciar equipe" nao apareca no painel, o acesso direto a URL continua
// barrado no servidor. Primeiro aplica requirePortalAccess() (gate
// institucional) e so entao consulta evaluateHospitalCapability
// ("canManageMemberships"), que resolve contexto e capacidades sob RLS. A
// pagina nao cria cliente Supabase, nao chama RPC nem tabelas, nao le cookie,
// URL, query string ou form data, nao redireciona, nao usa notFound e nao
// aceita hospitalId/organizationId. A decisao allowed/denied vem
// exclusivamente do gate; a pagina nao rele capabilities nem testa papel por
// nome.
//
// Escopo demonstrativo:
// Nenhum CRUD, formulario, Server Action ou mutacao. A gestao real de usuarios
// e vinculos sera implementada em etapa posterior. Nenhum nome de capacidade,
// papel, scope ou codigo de permissao e exibido ao usuario.

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  await requirePortalAccess();
  const gate = await evaluateHospitalCapability("canManageMemberships");

  if (gate.status === "allowed") {
    return (
      <section className="state-page" aria-labelledby="admin-team-title">
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-team-title">Gestão da equipe</h1>
          <p>
            O acesso administrativo está autorizado para{" "}
            {gate.context.hospitalDisplayName}.
          </p>
          <p>
            A gestão de usuários e vínculos desta unidade será implementada em
            uma etapa posterior.
          </p>

          <div className="state-actions">
            <Link className="button button--secondary" href="/painel">
              Voltar ao painel
            </Link>
            <form action={logoutAction}>
              <button className="button" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  if (gate.status === "denied") {
    return (
      <section className="state-page" aria-labelledby="admin-team-denied-title">
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-team-denied-title">
            Sem permissão para gerenciar a equipe
          </h1>
          <p>
            Sua conta não está autorizada a acessar a administração desta
            unidade.
          </p>

          <div className="state-actions">
            <Link className="button button--secondary" href="/painel">
              Voltar ao painel
            </Link>
            <form action={logoutAction}>
              <button className="button" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  if (gate.status === "absent") {
    return (
      <section className="state-page" aria-labelledby="admin-team-absent-title">
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-team-absent-title">Selecione um hospital</h1>
          <p>
            Selecione a unidade em que você irá trabalhar para acessar a
            administração da equipe.
          </p>

          <div className="state-actions">
            <Link
              className="button button--secondary"
              href="/painel/selecionar-contexto"
            >
              Selecionar hospital
            </Link>
            <Link className="button button--secondary" href="/painel">
              Voltar ao painel
            </Link>
            <form action={logoutAction}>
              <button className="button" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  if (gate.status === "invalid") {
    return (
      <section className="state-page" aria-labelledby="admin-team-invalid-title">
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-team-invalid-title">Selecione novamente o hospital</h1>
          <p>
            O contexto do hospital não está mais disponível. Selecione novamente
            a unidade para continuar.
          </p>

          <div className="state-actions">
            <Link
              className="button button--secondary"
              href="/painel/selecionar-contexto"
            >
              Selecionar outro hospital
            </Link>
            <Link className="button button--secondary" href="/painel">
              Voltar ao painel
            </Link>
            <form action={logoutAction}>
              <button className="button" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="state-page" aria-labelledby="admin-team-error-title">
      <div className="state-panel">
        <p className="eyebrow">Administração institucional</p>
        <h1 id="admin-team-error-title">
          Não foi possível verificar a autorização
        </h1>
        <p>Ocorreu uma falha temporária. Tente novamente em instantes.</p>

        <div className="state-actions">
          <Link className="button" href="/painel/admin/equipe">
            Tentar novamente
          </Link>
          <Link className="button button--secondary" href="/painel">
            Voltar ao painel
          </Link>
          <form action={logoutAction}>
            <button className="button" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
