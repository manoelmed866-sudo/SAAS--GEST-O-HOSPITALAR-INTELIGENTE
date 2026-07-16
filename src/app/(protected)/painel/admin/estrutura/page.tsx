import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { requirePortalAccess } from "@/lib/auth/access";
import {
  type HospitalStructureItemStatus,
  resolveActiveHospitalStructure,
} from "@/lib/auth/hospital-structure";
import {
  CreateBedForm,
  CreateResourceForm,
  CreateSectorForm,
  CreateUnitForm,
  type StructureParentOption,
} from "./structure-create-forms";
import { StructureStatusControls } from "./structure-status-controls";

// Sprint 05 - Estrutura institucional do hospital ativo
//
// A pagina aplica requirePortalAccess() (gate institucional) e delega TUDO a
// resolveActiveHospitalStructure(): contexto ativo, capacidade de leitura
// (canReadStructure), capacidade de gestao (canManageStructure) e a leitura
// sob RLS. A pagina nao cria cliente Supabase, nao chama RPC nem tabelas, nao
// le cookie, URL, query string ou form data, nao redireciona, nao usa
// notFound e nao aceita hospitalId/organizationId.
//
// Exposicao minima: nenhum UUID, e-mail, papel, permissao ou capacidade e
// exibido; referencias opacas aparecem apenas em value de campos ocultos e
// selects dos controles de gestao, nunca como texto. Leitores (auditor) veem a
// estrutura sem nenhum formulario ou controle de mutacao.

export const dynamic = "force-dynamic";

const ITEM_STATUS_LABEL: Record<HospitalStructureItemStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export default async function AdminStructurePage() {
  await requirePortalAccess();
  const result = await resolveActiveHospitalStructure();

  if (result.status === "allowed") {
    const { structure, canManage } = result;

    const unitOptions: StructureParentOption[] = structure.units
      .filter((unit) => unit.status === "active" && unit.managementRef !== null)
      .map((unit) => ({
        label: unit.displayName,
        managementRef: unit.managementRef as string,
      }));

    const sectorOptions: StructureParentOption[] = structure.units
      .flatMap((unit) =>
        unit.sectors.map((sector) => ({
          unitLabel: unit.displayName,
          sector,
        })),
      )
      .filter(
        (entry) =>
          entry.sector.status === "active" &&
          entry.sector.managementRef !== null,
      )
      .map((entry) => ({
        label: `${entry.sector.displayName} (${entry.unitLabel})`,
        managementRef: entry.sector.managementRef as string,
      }));

    return (
      <section className="state-page" aria-labelledby="admin-structure-title">
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-structure-title">Estrutura do hospital</h1>
          <p>{result.context.hospitalDisplayName}</p>

          <h2>Unidades</h2>
          {structure.units.length === 0 ? (
            <p>Nenhuma unidade cadastrada para este hospital.</p>
          ) : (
            <ul className="structure-list">
              {structure.units.map((unit) => (
                <li className="structure-item" key={`unit-${unit.code}`}>
                  <span className="structure-item__name">
                    {unit.displayName}
                  </span>{" "}
                  <span className="structure-item__code">({unit.code})</span>{" "}
                  <span className="structure-item__status">
                    {ITEM_STATUS_LABEL[unit.status]}
                  </span>
                  {canManage && unit.managementRef !== null ? (
                    <StructureStatusControls
                      currentStatus={unit.status}
                      kind="unit"
                      managementRef={unit.managementRef}
                    />
                  ) : null}
                  {unit.sectors.length === 0 ? (
                    <p>Nenhum setor cadastrado nesta unidade.</p>
                  ) : (
                    <ul>
                      {unit.sectors.map((sector) => (
                        <li
                          className="structure-item"
                          key={`sector-${sector.code}`}
                        >
                          <span className="structure-item__name">
                            {sector.displayName}
                          </span>{" "}
                          <span className="structure-item__code">
                            ({sector.code})
                          </span>{" "}
                          <span className="structure-item__status">
                            {ITEM_STATUS_LABEL[sector.status]}
                          </span>
                          {canManage && sector.managementRef !== null ? (
                            <StructureStatusControls
                              currentStatus={sector.status}
                              kind="sector"
                              managementRef={sector.managementRef}
                            />
                          ) : null}
                          {sector.beds.length === 0 ? (
                            <p>Nenhum leito cadastrado neste setor.</p>
                          ) : (
                            <ul>
                              {sector.beds.map((bed) => (
                                <li
                                  className="structure-item"
                                  key={`bed-${bed.code}`}
                                >
                                  <span className="structure-item__name">
                                    {bed.displayName}
                                  </span>{" "}
                                  <span className="structure-item__code">
                                    ({bed.code})
                                  </span>{" "}
                                  <span className="structure-item__status">
                                    {ITEM_STATUS_LABEL[bed.status]}
                                  </span>
                                  {canManage && bed.managementRef !== null ? (
                                    <StructureStatusControls
                                      currentStatus={bed.status}
                                      kind="bed"
                                      managementRef={bed.managementRef}
                                    />
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h2>Recursos institucionais</h2>
          {structure.resources.length === 0 ? (
            <p>Nenhum recurso institucional cadastrado para este hospital.</p>
          ) : (
            <ul className="structure-list">
              {structure.resources.map((resource) => (
                <li
                  className="structure-item"
                  key={`resource-${resource.code}`}
                >
                  <span className="structure-item__name">
                    {resource.displayName}
                  </span>{" "}
                  <span className="structure-item__code">
                    ({resource.code})
                  </span>{" "}
                  <span className="structure-item__status">
                    {ITEM_STATUS_LABEL[resource.status]}
                  </span>
                  {resource.description !== null ? (
                    <p>{resource.description}</p>
                  ) : null}
                  {canManage && resource.managementRef !== null ? (
                    <StructureStatusControls
                      currentStatus={resource.status}
                      kind="resource"
                      managementRef={resource.managementRef}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {canManage ? (
            <>
              <h2>Cadastrar itens</h2>
              <CreateUnitForm />
              <CreateSectorForm unitOptions={unitOptions} />
              <CreateBedForm sectorOptions={sectorOptions} />
              <CreateResourceForm />
            </>
          ) : null}

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

  if (result.status === "denied") {
    return (
      <section
        className="state-page"
        aria-labelledby="admin-structure-denied-title"
      >
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-structure-denied-title">
            Sem permissão para visualizar a estrutura
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

  if (result.status === "absent") {
    return (
      <section
        className="state-page"
        aria-labelledby="admin-structure-absent-title"
      >
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-structure-absent-title">Selecione um hospital</h1>
          <p>
            Selecione a unidade em que você irá trabalhar para acessar a
            estrutura do hospital.
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

  if (result.status === "invalid") {
    return (
      <section
        className="state-page"
        aria-labelledby="admin-structure-invalid-title"
      >
        <div className="state-panel">
          <p className="eyebrow">Administração institucional</p>
          <h1 id="admin-structure-invalid-title">
            Selecione novamente o hospital
          </h1>
          <p>
            O contexto do hospital não está mais disponível. Selecione
            novamente a unidade para continuar.
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
    <section
      className="state-page"
      aria-labelledby="admin-structure-error-title"
    >
      <div className="state-panel">
        <p className="eyebrow">Administração institucional</p>
        <h1 id="admin-structure-error-title">
          Não foi possível carregar a estrutura
        </h1>
        <p>Ocorreu uma falha temporária. Tente novamente em instantes.</p>

        <div className="state-actions">
          <Link className="button" href="/painel/admin/estrutura">
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
