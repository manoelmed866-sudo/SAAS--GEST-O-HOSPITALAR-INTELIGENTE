import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  requirePortalAccess: vi.fn(),
  resolveActiveHospitalStructure: vi.fn(),
  logoutAction: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({
  requirePortalAccess: mocks.requirePortalAccess,
}));

vi.mock("@/lib/auth/hospital-structure", () => ({
  resolveActiveHospitalStructure: mocks.resolveActiveHospitalStructure,
}));

vi.mock("@/app/(auth)/actions", () => ({
  loginAction: vi.fn(),
  logoutAction: mocks.logoutAction,
}));

// As actions sao mockadas para que os componentes cliente nao importem
// dependencias de servidor durante o render da pagina.
vi.mock("@/app/(protected)/painel/admin/estrutura/actions", () => ({
  createUnitAction: vi.fn(),
  createSectorAction: vi.fn(),
  createBedAction: vi.fn(),
  createResourceAction: vi.fn(),
  changeStructureStatusAction: vi.fn(),
}));

// Esta suite exercita a pagina /painel/admin/estrutura da Sprint 05. A decisao
// allowed/denied, a estrutura e o indicador de gestao vem exclusivamente de
// resolveActiveHospitalStructure; a pagina nunca consulta capacidades, RPC ou
// tabelas diretamente. O acesso direto a URL continua barrado no servidor
// mesmo sem o link no painel.

const ACTIVE_CONTEXT = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  hospitalId: "22222222-2222-4222-8222-222222222222",
  hospitalCode: "hospital-alfa",
  hospitalDisplayName: "Hospital Alfa",
};

const UNIT_REF = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1";
const SECTOR_REF = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2";
const BED_REF = "ccccccccccccccccccccccccccccccc3";
const RESOURCE_REF = "ddddddddddddddddddddddddddddddd4";

function makeStructure(withRefs: boolean) {
  const ref = (value: string) => (withRefs ? value : null);

  return {
    units: [
      {
        code: "unidade-adulto",
        displayName: "Unidade Adulto",
        status: "active" as const,
        managementRef: ref(UNIT_REF),
        sectors: [
          {
            code: "setor-observacao",
            displayName: "Setor Observação",
            status: "active" as const,
            managementRef: ref(SECTOR_REF),
            beds: [
              {
                code: "leito-01",
                displayName: "Leito 01",
                status: "inactive" as const,
                managementRef: ref(BED_REF),
              },
            ],
          },
        ],
      },
    ],
    resources: [
      {
        code: "tomografo",
        displayName: "Tomógrafo",
        description: "Equipamento de imagem",
        status: "active" as const,
        managementRef: ref(RESOURCE_REF),
      },
    ],
  };
}

async function renderPage() {
  const { default: AdminStructurePage } = await import(
    "@/app/(protected)/painel/admin/estrutura/page"
  );

  const { container } = render(await AdminStructurePage());

  return container;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requirePortalAccess.mockResolvedValue({
    displayName: "Pessoa Fictícia",
  });
});

describe("AdminStructurePage - allowed", () => {
  it("gestor ve a hierarquia, os recursos, os formularios e os controles", async () => {
    mocks.resolveActiveHospitalStructure.mockResolvedValue({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      canManage: true,
      structure: makeStructure(true),
    });

    await renderPage();

    expect(mocks.requirePortalAccess).toHaveBeenCalledTimes(1);
    expect(mocks.resolveActiveHospitalStructure).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("heading", { name: "Estrutura do hospital" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hospital Alfa")).toBeInTheDocument();
    // O nome tambem aparece como opcao nos selects dos formularios de gestao.
    expect(screen.getAllByText("Unidade Adulto").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Setor Observação").length).toBeGreaterThan(0);
    expect(screen.getByText("Leito 01")).toBeInTheDocument();
    expect(screen.getByText("Tomógrafo")).toBeInTheDocument();
    expect(screen.getByText("Equipamento de imagem")).toBeInTheDocument();

    // Status traduzidos, nunca os valores internos.
    expect(screen.getAllByText("Ativo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inativo").length).toBe(1);

    // Formularios de criacao e controles de status presentes para o gestor.
    expect(screen.getByText("Nova unidade")).toBeInTheDocument();
    expect(screen.getByText("Novo setor")).toBeInTheDocument();
    expect(screen.getByText("Novo leito")).toBeInTheDocument();
    expect(screen.getByText("Novo recurso institucional")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Desativar" }).length).toBe(3);
    expect(screen.getAllByRole("button", { name: "Reativar" }).length).toBe(1);
  });

  it("leitor sem gestao ve a estrutura SEM formularios e SEM controles", async () => {
    mocks.resolveActiveHospitalStructure.mockResolvedValue({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      canManage: false,
      structure: makeStructure(false),
    });

    const container = await renderPage();

    expect(screen.getByText("Unidade Adulto")).toBeInTheDocument();
    expect(screen.queryByText("Nova unidade")).not.toBeInTheDocument();
    expect(screen.queryByText("Cadastrar itens")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Desativar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reativar" }),
    ).not.toBeInTheDocument();
    // Nenhuma referencia opaca aparece no HTML do leitor.
    expect(container.innerHTML).not.toContain(UNIT_REF);
  });

  it("estrutura vazia mostra estados vazios amigaveis", async () => {
    mocks.resolveActiveHospitalStructure.mockResolvedValue({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      canManage: true,
      structure: { units: [], resources: [] },
    });

    await renderPage();

    expect(
      screen.getByText("Nenhuma unidade cadastrada para este hospital."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhum recurso institucional cadastrado para este hospital.",
      ),
    ).toBeInTheDocument();
    // Sem unidade ativa, os formularios de setor e leito orientam a sequencia.
    expect(
      screen.getByText("Crie uma unidade ativa antes de cadastrar setores."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Crie um setor ativo antes de cadastrar leitos."),
    ).toBeInTheDocument();
  });

  it("nenhum UUID aparece no HTML renderizado", async () => {
    mocks.resolveActiveHospitalStructure.mockResolvedValue({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      canManage: true,
      structure: makeStructure(true),
    });

    const container = await renderPage();

    expect(container.innerHTML).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });
});

describe("AdminStructurePage - estados nao autorizados", () => {
  it("denied mostra mensagem generica sem conteudo autorizado", async () => {
    mocks.resolveActiveHospitalStructure.mockResolvedValue({
      status: "denied",
      context: ACTIVE_CONTEXT,
    });

    await renderPage();

    expect(
      screen.getByRole("heading", {
        name: "Sem permissão para visualizar a estrutura",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Unidades")).not.toBeInTheDocument();
    expect(screen.queryByText("Nova unidade")).not.toBeInTheDocument();
  });

  it("absent orienta a selecao de hospital", async () => {
    mocks.resolveActiveHospitalStructure.mockResolvedValue({
      status: "absent",
    });

    await renderPage();

    expect(
      screen.getByRole("heading", { name: "Selecione um hospital" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Selecionar hospital" }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
  });

  it("invalid orienta nova selecao", async () => {
    mocks.resolveActiveHospitalStructure.mockResolvedValue({
      status: "invalid",
    });

    await renderPage();

    expect(
      screen.getByRole("heading", { name: "Selecione novamente o hospital" }),
    ).toBeInTheDocument();
  });

  it("error oferece tentativa novamente na propria rota", async () => {
    mocks.resolveActiveHospitalStructure.mockResolvedValue({
      status: "error",
    });

    await renderPage();

    expect(
      screen.getByRole("heading", {
        name: "Não foi possível carregar a estrutura",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tentar novamente" })).toHaveAttribute(
      "href",
      "/painel/admin/estrutura",
    );
  });

  it("logout esta presente em todos os estados", async () => {
    for (const result of [
      { status: "denied", context: ACTIVE_CONTEXT },
      { status: "absent" },
      { status: "invalid" },
      { status: "error" },
    ]) {
      mocks.resolveActiveHospitalStructure.mockResolvedValue(result);
      const { default: AdminStructurePage } = await import(
        "@/app/(protected)/painel/admin/estrutura/page"
      );
      const { unmount } = render(await AdminStructurePage());

      expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
      unmount();
    }
  });
});
