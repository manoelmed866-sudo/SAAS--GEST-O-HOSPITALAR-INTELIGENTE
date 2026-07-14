import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  requirePortalAccess: vi.fn(),
  logoutAction: vi.fn(),
  resolveActiveHospitalCapabilities: vi.fn(),
  resolveActiveContext: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({
  requirePortalAccess: mocks.requirePortalAccess,
}));

vi.mock("@/lib/auth/capabilities", () => ({
  resolveActiveHospitalCapabilities: mocks.resolveActiveHospitalCapabilities,
}));

// O painel NAO deve importar nem chamar resolveActiveContext diretamente: a
// resolucao do contexto passa a ser interna a resolveActiveHospitalCapabilities.
// Mockamos o modulo apenas para provar que o spy nunca e invocado.
vi.mock("@/lib/auth/context", () => ({
  resolveActiveContext: mocks.resolveActiveContext,
}));

vi.mock("@/app/(auth)/actions", () => ({
  loginAction: vi.fn(),
  logoutAction: mocks.logoutAction,
}));

const ACTIVE_ORG_ID = "11111111-1111-4111-8111-111111111111";
const ACTIVE_HOSPITAL_ID = "22222222-2222-4222-8222-222222222222";

const ACTIVE_CONTEXT = {
  organizationId: ACTIVE_ORG_ID,
  hospitalId: ACTIVE_HOSPITAL_ID,
  hospitalCode: "hospital-alfa",
  hospitalDisplayName: "Hospital Alfa",
};

const ALL_CAPABILITIES_FALSE = {
  canReadHospital: false,
  canReadMemberships: false,
  canManageMemberships: false,
  canReadAudit: false,
  canSwitchContext: false,
};

function activeResult(
  overrides: Partial<typeof ALL_CAPABILITIES_FALSE> = {},
) {
  return {
    status: "active" as const,
    context: ACTIVE_CONTEXT,
    capabilities: { ...ALL_CAPABILITIES_FALSE, ...overrides },
  };
}

async function renderPanel() {
  const { default: PanelPage } = await import("@/app/(protected)/painel/page");

  render(await PanelPage());
}

describe("paginas de autenticacao e painel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePortalAccess.mockResolvedValue({
      status: "allowed",
      userId: "usuario-1",
      displayName: "Dra. Ana",
      accessKind: "hospital",
    });
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "absent",
    });
  });

  it("renderiza login publico com campos acessiveis e sem cadastro publico", async () => {
    const { default: LoginPage } = await import("@/app/(auth)/login/page");

    render(
      await LoginPage({
        searchParams: Promise.resolve({ next: "/painel" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: /entrar na plataforma/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail institucional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    expect(screen.queryByText(/cadastro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recuperar senha/i)).not.toBeInTheDocument();
  });

  it("renderiza acesso negado generico com retorno e logout", async () => {
    const { default: AccessDeniedPage } = await import(
      "@/app/(auth)/acesso-negado/page"
    );

    render(<AccessDeniedPage />);

    expect(
      screen.getByRole("heading", { name: /acesso negado/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/vinculo ativo autorizado/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voltar ao inicio/i }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("aplica o gate de acesso antes de resolver as capacidades do contexto", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValueOnce(
      activeResult(),
    );

    await renderPanel();

    expect(mocks.requirePortalAccess).toHaveBeenCalledTimes(1);
    expect(mocks.resolveActiveHospitalCapabilities).toHaveBeenCalledTimes(1);
    const gateOrder = mocks.requirePortalAccess.mock.invocationCallOrder[0];
    const capabilitiesOrder =
      mocks.resolveActiveHospitalCapabilities.mock.invocationCallOrder[0];
    expect(gateOrder).toBeLessThan(capabilitiesOrder);
    expect(screen.getByText(/bem-vindo, Dra\. Ana/i)).toBeInTheDocument();
  });

  it("resolve o contexto uma unica vez e nao chama resolveActiveContext diretamente", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValueOnce(
      activeResult(),
    );

    await renderPanel();

    expect(mocks.resolveActiveHospitalCapabilities).toHaveBeenCalledTimes(1);
    expect(mocks.resolveActiveContext).not.toHaveBeenCalled();
  });

  it("estado active + canManageMemberships true: exibe hospital, Trocar hospital e Gerenciar equipe", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValueOnce(
      activeResult({ canManageMemberships: true }),
    );

    await renderPanel();

    expect(
      screen.getByRole("heading", { name: /plantão ativo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hospital Alfa/)).toBeInTheDocument();
    expect(screen.getByText(/hospital-alfa/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /trocar hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(
      screen.getByRole("link", { name: /gerenciar equipe/i }),
    ).toHaveAttribute("href", "/painel/admin/equipe");
    expect(screen.queryByText(ACTIVE_HOSPITAL_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(ACTIVE_ORG_ID)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("estado active + canManageMemberships false: Trocar hospital permanece e Gerenciar equipe nao aparece", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValueOnce(
      activeResult({ canManageMemberships: false }),
    );

    await renderPanel();

    expect(screen.getByText(/Hospital Alfa/)).toBeInTheDocument();
    expect(screen.getByText(/hospital-alfa/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /trocar hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(
      screen.queryByRole("link", { name: /gerenciar equipe/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("Trocar hospital independe de canSwitchContext (false ainda mostra o link)", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValueOnce(
      activeResult({ canSwitchContext: false }),
    );

    await renderPanel();

    expect(
      screen.getByRole("link", { name: /trocar hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
  });

  it("estado absent: convida a selecionar sem erro, sem redirect e sem link administrativo", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValueOnce({
      status: "absent",
    });

    await renderPanel();

    expect(
      screen.getByRole("heading", { name: /selecione um hospital/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ainda não selecionou a unidade/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /selecionar hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(
      screen.queryByRole("heading", { name: /não foi possível carregar/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Hospital Alfa/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /gerenciar equipe/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("estado invalid: pede nova selecao, nao se confunde com erro e sem link administrativo", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValueOnce({
      status: "invalid",
    });

    await renderPanel();

    expect(
      screen.getByRole("heading", { name: /selecione novamente o hospital/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não está mais disponível para o seu acesso/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /selecionar outro hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(
      screen.queryByRole("heading", { name: /não foi possível carregar/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Hospital Alfa/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /gerenciar equipe/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("estado error: estado tecnico generico, com tentar novamente/seletor e sem link administrativo", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValueOnce({
      status: "error",
    });

    await renderPanel();

    expect(
      screen.getByRole("heading", {
        name: /não foi possível carregar o contexto do hospital/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /tentar novamente/i }),
    ).toHaveAttribute("href", "/painel");
    expect(
      screen.getByRole("link", { name: /selecionar hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(screen.queryByText(/Hospital Alfa/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /plantão ativo/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /gerenciar equipe/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
