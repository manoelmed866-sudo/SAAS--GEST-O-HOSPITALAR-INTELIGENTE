import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { requirePortalAccess } from "@/lib/auth/access";
import {
  type HospitalTeamMemberStatus,
  resolveActiveHospitalTeam,
} from "@/lib/auth/hospital-team";
import { TeamMemberControls } from "./team-member-controls";
import { TeamRoleControls } from "./team-role-controls";

// Sprint 04C.1 - Equipe do hospital ativo (listagem somente leitura)
//
// A pagina aplica requirePortalAccess() (gate institucional) e delega TUDO a
// resolveActiveHospitalTeam(): contexto ativo, capacidade de leitura
// (canReadMemberships) e a listagem via RPC com validacao interna. A pagina
// nao chama evaluateHospitalCapability nem resolveActiveHospitalCapabilities
// diretamente, nao cria cliente Supabase, nao chama RPC nem tabelas, nao le
// cookie, URL, query string ou form data, nao redireciona, nao usa notFound e
// nao aceita hospitalId/organizationId.
//
// Escopo administrativo (04C.2):
// A lista permanece server-side; os UNICOS controles de mutacao sao suspensao
// e reativacao de vinculo, renderizados pelo componente cliente
// TeamMemberControls somente quando o servidor indicou a acao como possivel
// (canSuspend/canReactivate) e sempre revalidados pela RPC. Nenhum e-mail,
// UUID, codigo de papel ou nome de capacidade e exibido; a referencia opaca
// nunca e impressa como texto. Nenhuma exclusao, revogacao, alteracao de
// papel, convite ou criacao de conta.

export const dynamic = "force-dynamic";

const MEMBERSHIP_STATUS_LABEL: Record<HospitalTeamMemberStatus, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  pending: "Pendente",
};

export default async function AdminTeamPage() {
  await requirePortalAccess();
  const team = await resolveActiveHospitalTeam();

  if (team.status === "allowed") {
    return (
      <section className="state-page" aria-labelledby="admin-team-title">
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-team-title">Equipe do hospital</h1>
          <p>{team.context.hospitalDisplayName}</p>

          {team.members.length === 0 ? (
            <p>Nenhum integrante encontrado para este hospital.</p>
          ) : (
            <ul className="team-list">
              {team.members.map((member, index) => (
                <li className="team-member" key={`${member.displayName}-${index}`}>
                  <span className="team-member__name">{member.displayName}</span>
                  <span className="team-member__status">
                    {MEMBERSHIP_STATUS_LABEL[member.membershipStatus]}
                  </span>
                  {member.roleLabels.length > 0 ? (
                    <span className="team-member__roles">
                      {member.roleLabels.join(", ")}
                    </span>
                  ) : null}
                  {member.managementRef !== null &&
                  (member.canSuspend || member.canReactivate) ? (
                    <TeamMemberControls
                      canReactivate={member.canReactivate}
                      canSuspend={member.canSuspend}
                      managementRef={member.managementRef}
                    />
                  ) : null}
                  {member.managementRef !== null &&
                  member.assignedRoles !== null &&
                  team.assignableRoles !== null ? (
                    <TeamRoleControls
                      assignableRoles={team.assignableRoles}
                      assignedRoles={member.assignedRoles}
                      membershipRef={member.managementRef}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}

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

  if (team.status === "denied") {
    return (
      <section className="state-page" aria-labelledby="admin-team-denied-title">
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-team-denied-title">
            Sem permissão para visualizar a equipe
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

  if (team.status === "absent") {
    return (
      <section className="state-page" aria-labelledby="admin-team-absent-title">
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-team-absent-title">Selecione um hospital</h1>
          <p>
            Selecione a unidade em que você irá trabalhar para acessar a equipe
            do hospital.
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

  if (team.status === "invalid") {
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
          Não foi possível carregar a equipe
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
