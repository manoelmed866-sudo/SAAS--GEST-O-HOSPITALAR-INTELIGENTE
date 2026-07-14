import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  requirePortalAccess: vi.fn(),
  resolveActiveHospitalTeam: vi.fn(),
  logoutAction: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({
  requirePortalAccess: mocks.requirePortalAccess,
}));

vi.mock("@/lib/auth/hospital-team", () => ({
  resolveActiveHospitalTeam: mocks.resolveActiveHospitalTeam,
}));

vi.mock("@/app/(auth)/actions", () => ({
  loginAction: vi.fn(),
  logoutAction: mocks.logoutAction,
}));

// Esta suite exercita a pagina /painel/admin/equipe da Sprint 04C.1 (listagem
// somente leitura). A decisao allowed/denied e a listagem vem exclusivamente
// de resolveActiveHospitalTeam; a pagina nunca consulta capacidades, gate ou
// RPC diretamente. O acesso direto a URL continua barrado no servidor mesmo
// sem o link no painel.

const ACTIVE_ORG_ID = "11111111-1111-4111-8111-111111111111";
const ACTIVE_HOSPITAL_ID = "22222222-2222-4222-8222-222222222222";

const ACTIVE_CONTEXT = {
  organizationId: ACTIVE_ORG_ID,
  hospitalId: ACTIVE_HOSPITAL_ID,
  hospitalCode: "hospital-alfa",
  hospitalDisplayName: "Hospital Alfa",
};

const TEAM = [
  {
    displayName: "Dra. Ana Ficticia",
    membershipStatus: "active" as const,
    roleLabels: ["Administrador hospitalar", "Membro hospitalar"],
  },
  {
    displayName: "Dr. Bruno Ficticio",
    membershipStatus: "suspended" as const,
    roleLabels: ["Membro hospitalar"],
  },
  {
    displayName: "Enf. Clara Ficticia",
    membershipStatus: "pending" as const,
    roleLabels: [],
  },
];

// Tokens internos que jamais devem vazar para a interface em nenhum estado.
const LEAK_TOKENS = [
  /canReadMemberships/i,
  /canManageMemberships/i,
  /\bscope\b/i,
  /\bcapacidad/i,
  /hospital_admin/,
  /\bmember\b/,
  /\bauditor\b/,
  /@/,
];

// Rotulos de controles de mutacao que nao devem existir (sem CRUD).
const MUTATION_CONTROLS = [
  /adicionar/i,
  /convidar/i,
  /editar/i,
  /suspender$/i,
  /reativar/i,
  /excluir/i,
  /remover/i,
  /salvar/i,
  /alterar papel/i,
];

async function renderTeamPage() {
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
  expect(document.querySelector("input, select, textarea")).toBeNull();
}

describe("pagina /painel/admin/equipe (Sprint 04C.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePortalAccess.mockResolvedValue({
      status: "allowed",
      userId: "usuario-1",
      displayName: "Dra. Ana",
      accessKind: "hospital",
    });
  });

  it("aplica requirePortalAccess antes do resolver, chamado exatamente uma vez", async () => {
    mocks.resolveActiveHospitalTeam.mockResolvedValueOnce({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      members: TEAM,
    });

    await renderTeamPage();

    expect(mocks.requirePortalAccess).toHaveBeenCalledTimes(1);
    expect(mocks.resolveActiveHospitalTeam).toHaveBeenCalledTimes(1);
    const accessOrder = mocks.requirePortalAccess.mock.invocationCallOrder[0];
    const teamOrder = mocks.resolveActiveHospitalTeam.mock.invocationCallOrder[0];
    expect(accessOrder).toBeLessThan(teamOrder);
  });

  it("allowed com membros: lista nomes, status traduzidos e papeis amigaveis", async () => {
    mocks.resolveActiveHospitalTeam.mockResolvedValueOnce({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      members: TEAM,
    });

    await renderTeamPage();

    expect(
      screen.getByRole("heading", { name: /equipe do hospital/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hospital Alfa/)).toBeInTheDocument();
    expect(screen.getByText("Dra. Ana Ficticia")).toBeInTheDocument();
    expect(screen.getByText("Dr. Bruno Ficticio")).toBeInTheDocument();
    expect(screen.getByText("Enf. Clara Ficticia")).toBeInTheDocument();
    // Status traduzidos, nunca o valor interno em ingles.
    expect(screen.getAllByText("Ativo").length).toBeGreaterThan(0);
    expect(screen.getByText("Suspenso")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.queryByText(/\bactive\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bsuspended\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bpending\b/)).not.toBeInTheDocument();
    // Papeis amigaveis.
    expect(
      screen.getByText(/Administrador hospitalar, Membro hospitalar/),
    ).toBeInTheDocument();
    // Sem UUID e sem e-mail.
    expect(screen.queryByText(ACTIVE_HOSPITAL_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(ACTIVE_ORG_ID)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voltar ao painel/i }),
    ).toHaveAttribute("href", "/painel");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
    expectNoLeakedTokens();
  });

  it("allowed com lista vazia: mensagem propria, sem erro tecnico", async () => {
    mocks.resolveActiveHospitalTeam.mockResolvedValueOnce({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      members: [],
    });

    await renderTeamPage();

    expect(
      screen.getByRole("heading", { name: /equipe do hospital/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hospital Alfa/)).toBeInTheDocument();
    expect(
      screen.getByText(/nenhum integrante encontrado para este hospital/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /não foi possível/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
    expectNoLeakedTokens();
  });

  it("denied por acesso direto: generico, sem lista e sem motivo interno", async () => {
    mocks.resolveActiveHospitalTeam.mockResolvedValueOnce({
      status: "denied",
      context: ACTIVE_CONTEXT,
    });

    await renderTeamPage();

    expect(
      screen.getByRole("heading", {
        name: /sem permissão para visualizar a equipe/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /equipe do hospital/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Dra. Ana Ficticia")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voltar ao painel/i }),
    ).toHaveAttribute("href", "/painel");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
    expectNoLeakedTokens();
  });

  it("absent: orienta a selecionar uma unidade", async () => {
    mocks.resolveActiveHospitalTeam.mockResolvedValueOnce({ status: "absent" });

    await renderTeamPage();

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
  });

  it("invalid: orienta nova selecao do hospital", async () => {
    mocks.resolveActiveHospitalTeam.mockResolvedValueOnce({
      status: "invalid",
    });

    await renderTeamPage();

    expect(
      screen.getByRole("heading", { name: /selecione novamente o hospital/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /selecionar outro hospital/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expectNoMutationControls();
  });

  it("error: falha generica com tentar novamente na propria rota", async () => {
    mocks.resolveActiveHospitalTeam.mockResolvedValueOnce({ status: "error" });

    await renderTeamPage();

    expect(
      screen.getByRole("heading", {
        name: /não foi possível carregar a equipe/i,
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
