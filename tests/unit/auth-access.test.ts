const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  getUser: vi.fn(),
  from: vi.fn(),
  createClient: vi.fn(),
}));

export {};

type MockQueryResponse = {
  data: unknown;
  error: { message?: string } | null;
};

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

function createQuery(response: MockQueryResponse) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => response),
    then: (
      resolve: (value: MockQueryResponse) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(response).then(resolve, reject),
  };

  return query;
}

function configureAccessMocks(
  responses: Record<string, MockQueryResponse[]>,
  user: { id: string } | null = { id: "usuario-1" },
) {
  const queues = new Map(Object.entries(responses));
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.from.mockImplementation((table: string) => {
    const queue = queues.get(table) ?? [];
    const response = queue.shift() ?? { data: [], error: null };
    queues.set(table, queue);

    return createQuery(response);
  });
  mocks.createClient.mockResolvedValue({
    auth: {
      getUser: mocks.getUser,
    },
    from: mocks.from,
  });
}

function activeProfile() {
  return {
    data: { display_name: "Dra. Ana", status: "active" },
    error: null,
  };
}

function emptyRows() {
  return { data: [], error: null };
}

// IMPORTANTE: esta suite mocka o Supabase por tabela e cobre apenas a LOGICA
// DE GATES (ordem platform -> organization -> hospital e fallthrough entre
// eles). Ela NAO exercita RLS nem o formato real do embed PostgREST; a garantia
// de que a consulta hospitalar retorna linhas sob RLS para um usuario
// hospital-only fica no teste pgTAP 004-sprint-03c-hospital-access.test.sql.
describe("validacao segura de acesso ao portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona usuario nao autenticado para login", async () => {
    configureAccessMocks({}, null);
    const { requirePortalAccess } = await import("@/lib/auth/access");

    await expect(requirePortalAccess()).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fpainel",
    );

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("nega acesso sem perfil ativo", async () => {
    configureAccessMocks({
      profiles: [
        {
          data: { display_name: "Dra. Ana", status: "inactive" },
          error: null,
        },
      ],
    });
    const { getPortalAccess } = await import("@/lib/auth/access");

    await expect(getPortalAccess()).resolves.toEqual({ status: "denied" });
  });

  it("libera acesso por papel ativo de plataforma sem expor contexto institucional", async () => {
    configureAccessMocks({
      profiles: [activeProfile()],
      platform_role_assignments: [{ data: [{ id: "papel-1" }], error: null }],
    });
    const { getPortalAccess } = await import("@/lib/auth/access");

    await expect(getPortalAccess()).resolves.toEqual({
      status: "allowed",
      userId: "usuario-1",
      displayName: "Dra. Ana",
      accessKind: "platform",
    });
  });

  it("libera acesso por vinculo ativo de organizacao", async () => {
    configureAccessMocks({
      profiles: [activeProfile()],
      platform_role_assignments: [emptyRows()],
      organization_memberships: [{ data: [{ id: "org-1" }], error: null }],
    });
    const { getPortalAccess } = await import("@/lib/auth/access");

    await expect(getPortalAccess()).resolves.toMatchObject({
      status: "allowed",
      accessKind: "organization",
    });
  });

  it("libera acesso por vinculo ativo de hospital para usuario hospital-only sem papel organizacional", async () => {
    // Usuario hospital-only: sem papel de plataforma e sem vinculo de
    // organizacao liberado (gate organizacional vazio), o fluxo deve cair no
    // gate hospitalar. A consulta hospitalar nao depende mais de embed de
    // organizations!inner, entao aqui basta a linha hospitalar retornar.
    configureAccessMocks({
      profiles: [activeProfile()],
      platform_role_assignments: [emptyRows()],
      organization_memberships: [emptyRows()],
      hospital_memberships: [{ data: [{ id: "hospital-1" }], error: null }],
    });
    const { getPortalAccess } = await import("@/lib/auth/access");

    await expect(getPortalAccess()).resolves.toMatchObject({
      status: "allowed",
      accessKind: "hospital",
    });
  });

  it("nega acesso quando nao ha vinculo ativo", async () => {
    configureAccessMocks({
      profiles: [activeProfile()],
      platform_role_assignments: [emptyRows()],
      organization_memberships: [emptyRows()],
      hospital_memberships: [emptyRows()],
    });
    const { getPortalAccess } = await import("@/lib/auth/access");

    await expect(getPortalAccess()).resolves.toEqual({ status: "denied" });
  });

  it("retorna erro generico para falha inesperada de consulta", async () => {
    configureAccessMocks({
      profiles: [activeProfile()],
      platform_role_assignments: [
        { data: null, error: { message: "falha interna do banco" } },
      ],
    });
    const { requirePortalAccess } = await import("@/lib/auth/access");

    await expect(requirePortalAccess()).rejects.toThrow(
      "Nao foi possivel validar o acesso institucional.",
    );
  });
});
