import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  requirePortalAccess: vi.fn(),
  evaluateHospitalCapability: vi.fn(),
  logoutAction: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({
  requirePortalAccess: mocks.requirePortalAccess,
}));

vi.mock("@/lib/auth/capability-gate", () => ({
  evaluateHospitalCapability: mocks.evaluateHospitalCapability,
}));

vi.mock("@/app/(auth)/actions", () => ({
  loginAction: vi.fn(),
  logoutAction: mocks.logoutAction,
}));

// Esta suite exercita a rota administrativa demonstrativa /painel/admin/equipe.
// A decisao allowed/denied vem exclusivamente de evaluateHospitalCapability
// ("canManageMemberships"); a pagina nunca rele capabilities, nao testa papel
// por nome e nao confia em estado visual, URL ou cookie. O acesso direto a URL
// e barrado no servidor mesmo sem o link no painel.

const ACTIVE_CONTEXT = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  hospitalId: "22222222-2222-4222-8222-222222222222",
  hospitalCode: "hospital-alfa",
  hospitalDisplayName: "Hospital Alfa",
};

// Tokens internos que jamais devem vazar para a interface em nenhum estado.
const LEAK_TOKENS = [
  /canManageMemberships/i,
  /\bscope\b/i,
  /\bpapel\b/i,
  /\bpapeis\b/i,
  /\bcapacidad/i,
  /\brole\b/i,
];

// Rotulos de controles de mutacao que nao devem existir nesta etapa (sem CRUD).
const MUTATION_CONTROLS = [
  /adicionar/i,
  /convidar/i,
  /editar/i,
  /suspender/i,
  /excluir/i,
  /remover/i,
  /salvar/i,
];

async function renderAdmin() {
  const { default: AdminTeamPage } = await import(
    "@/app/(protected)/painel/admin/equipe/page"
  );

  render(await AdminTeamPage());
}

function expectNoLeakedTokens() {
  for (const token of LEAK_TOKENS) {
    expect(document.body.textContent ?? "").not.toMatch(token);
  }
}

function expectNoMutationControls() {
  for (const control of MUTATION_CONTROLS) {
    expect(screen.queryByRole("button", { name: control })).toBeNull();
  }
}

describe("rota administrativa /painel/admin/equipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePortalAccess.mockResolvedValue({
      status: "allowed",
      userId: "usuario-1",
      displayName: "Dra. Ana",
      accessKind: "hospital",
    });
  });

  it("aplica requirePortalAccess antes do gate e chama o gate exatamente uma vez", async () => {
    mocks.evaluateHospitalCapability.mockResolvedValueOnce({
      status: "allowed",
      context: ACTIVE_CONTEXT,
    });

    await renderAdmin();

    expect(mocks.requirePortalAccess).toHaveBeenCalledTimes(1);
    expect(mocks.evaluateHospitalCapability).toHaveBeenCalledTimes(1);
    expect(mocks.evaluateHospitalCapability).toHaveBeenCalledWith(
      "canManageMemberships",
    );
    const gateAccessOrder = mocks.requirePortalAccess.mock.invocationCallOrder[0];
    const capabilityOrder =
      mocks.evaluateHospitalCapability.mock.invocationCallOrder[0];
    expect(gateAccessOrder).toBeLessThan(capabilityOrder);
  });

  it("allowed: exibe Gestao da equipe, o hospital, o aviso futuro e nenhum CRUD", async () => {
    mocks.evaluateHospitalCapability.mockResolvedValueOnce({
      status: "allowed",
      context: ACTIVE_CONTEXT,
    });

    await renderAdmin();

    expect(
      screen.getByRole("heading", { name: /gestão da equipe/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hospital Alfa/)).toBeInTheDocument();
    expect(
      screen.getByText(/será implementada em uma etapa posterior/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voltar ao painel/i }),
    ).toHaveAttribute("href", "/painel");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
    expectNoLeakedTokens();
  });

  it("denied por acesso direto: barra no servidor mesmo sem link no painel", async () => {
    mocks.evaluateHospitalCapability.mockResolvedValueOnce({
      status: "denied",
      context: ACTIVE_CONTEXT,
    });

    // A pagina e renderizada isoladamente, sem qualquer painel: prova que a
    // protecao nao depende da existencia do link "Gerenciar equipe".
    await renderAdmin();

    expect(
      screen.getByRole("heading", {
        name: /sem permissão para gerenciar a equipe/i,
      }),
    ).toBeInTheDocument();
    // Nenhum conteudo autorizado vaza.
    expect(
      screen.queryByRole("heading", { name: /gestão da equipe/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/será implementada em uma etapa posterior/i),
    ).not.toBeInTheDocument();
    // Continua oferecendo retorno ao painel e logout.
    expect(
      screen.getByRole("link", { name: /voltar ao painel/i }),
    ).toHaveAttribute("href", "/painel");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
    expectNoLeakedTokens();
  });

  it("absent: orienta a selecionar uma unidade", async () => {
    mocks.evaluateHospitalCapability.mockResolvedValueOnce({ status: "absent" });

    await renderAdmin();

    expect(
      screen.getByRole("heading", { name: /selecione um hospital/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /selecionar hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(
      screen.getByRole("link", { name: /voltar ao painel/i }),
    ).toHaveAttribute("href", "/painel");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
    expectNoLeakedTokens();
  });

  it("invalid: orienta nova selecao do hospital", async () => {
    mocks.evaluateHospitalCapability.mockResolvedValueOnce({
      status: "invalid",
    });

    await renderAdmin();

    expect(
      screen.getByRole("heading", { name: /selecione novamente o hospital/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /selecionar outro hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(
      screen.getByRole("link", { name: /voltar ao painel/i }),
    ).toHaveAttribute("href", "/painel");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
    expectNoLeakedTokens();
  });

  it("error: oferece tentar novamente na propria rota", async () => {
    mocks.evaluateHospitalCapability.mockResolvedValueOnce({ status: "error" });

    await renderAdmin();

    expect(
      screen.getByRole("heading", {
        name: /não foi possível verificar a autorização/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /tentar novamente/i }),
    ).toHaveAttribute("href", "/painel/admin/equipe");
    expect(
      screen.getByRole("link", { name: /voltar ao painel/i }),
    ).toHaveAttribute("href", "/painel");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
    expectNoLeakedTokens();
  });
});
