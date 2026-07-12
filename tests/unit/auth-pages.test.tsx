import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  requirePortalAccess: vi.fn(),
  logoutAction: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({
  requirePortalAccess: mocks.requirePortalAccess,
}));

vi.mock("@/app/(auth)/actions", () => ({
  loginAction: vi.fn(),
  logoutAction: mocks.logoutAction,
}));

describe("paginas de autenticacao e painel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("renderiza painel somente apos validacao de acesso", async () => {
    mocks.requirePortalAccess.mockResolvedValueOnce({
      status: "allowed",
      userId: "usuario-1",
      displayName: "Dra. Ana",
      accessKind: "hospital",
    });
    const { default: PanelPage } = await import("@/app/(protected)/painel/page");

    render(await PanelPage());

    expect(mocks.requirePortalAccess).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: /painel inicial/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/bem-vindo, Dra\. Ana/i)).toBeInTheDocument();
    expect(screen.getByText(/nao cria contexto ativo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
