const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  createClient: vi.fn(),
}));

export {};

type MockQueryResponse = {
  data: unknown;
  error: { message?: string } | null;
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

function createQuery(response: MockQueryResponse) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    then: (
      resolve: (value: MockQueryResponse) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(response).then(resolve, reject),
  };

  return query;
}

function configureInventoryMocks(responses: Record<string, MockQueryResponse>) {
  mocks.from.mockImplementation((table: string) => {
    const response = responses[table] ?? { data: [], error: null };

    return createQuery(response);
  });
  mocks.createClient.mockResolvedValue({
    from: mocks.from,
  });
}

// IMPORTANTE: esta suite mocka o Supabase por tabela e cobre apenas a
// normalizacao snake_case -> camelCase, a derivacao de hospitalCount e o
// comportamento fail-closed diante de erro. Ela NAO exercita RLS: a garantia de
// que organizations/hospitals sao filtrados por autorizacao e status ativo sob
// authenticated fica no teste pgTAP 005-sprint-03d-context-inventory.test.sql.
describe("inventario de contexto institucional autorizado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normaliza organizations de snake_case para camelCase", async () => {
    configureInventoryMocks({
      organizations: {
        data: [
          { id: "org-1", code: "org-a", display_name: "Instituicao A" },
          { id: "org-2", code: "org-b", display_name: "Instituicao B" },
        ],
        error: null,
      },
      hospitals: { data: [], error: null },
    });
    const { getAuthorizedContextInventory } = await import(
      "@/lib/auth/context"
    );

    const result = await getAuthorizedContextInventory();

    expect(result).toEqual({
      status: "success",
      inventory: {
        organizations: [
          { id: "org-1", code: "org-a", displayName: "Instituicao A" },
          { id: "org-2", code: "org-b", displayName: "Instituicao B" },
        ],
        hospitals: [],
        hospitalCount: 0,
      },
    });
  });

  it("normaliza hospitals e converte organization_id para organizationId", async () => {
    configureInventoryMocks({
      organizations: { data: [], error: null },
      hospitals: {
        data: [
          {
            id: "hosp-1",
            organization_id: "org-1",
            code: "hosp-a",
            display_name: "Hospital A",
          },
        ],
        error: null,
      },
    });
    const { getAuthorizedContextInventory } = await import(
      "@/lib/auth/context"
    );

    const result = await getAuthorizedContextInventory();

    expect(result).toMatchObject({
      status: "success",
      inventory: {
        hospitals: [
          {
            id: "hosp-1",
            organizationId: "org-1",
            code: "hosp-a",
            displayName: "Hospital A",
          },
        ],
      },
    });
  });

  it("deriva hospitalCount exclusivamente de hospitals.length", async () => {
    configureInventoryMocks({
      organizations: { data: [], error: null },
      hospitals: {
        data: [
          {
            id: "hosp-1",
            organization_id: "org-1",
            code: "hosp-a",
            display_name: "Hospital A",
          },
          {
            id: "hosp-2",
            organization_id: "org-1",
            code: "hosp-b",
            display_name: "Hospital B",
          },
          {
            id: "hosp-3",
            organization_id: "org-2",
            code: "hosp-c",
            display_name: "Hospital C",
          },
        ],
        error: null,
      },
    });
    const { getAuthorizedContextInventory } = await import(
      "@/lib/auth/context"
    );

    const result = await getAuthorizedContextInventory();

    if (result.status !== "success") {
      throw new Error("esperava inventario com sucesso");
    }

    expect(result.inventory.hospitalCount).toBe(3);
    expect(result.inventory.hospitalCount).toBe(
      result.inventory.hospitals.length,
    );
  });

  it("permite organizations vazio com hospitals preenchido (usuario hospital-only)", async () => {
    configureInventoryMocks({
      organizations: { data: [], error: null },
      hospitals: {
        data: [
          {
            id: "hosp-1",
            organization_id: "org-1",
            code: "hosp-a",
            display_name: "Hospital A",
          },
        ],
        error: null,
      },
    });
    const { getAuthorizedContextInventory } = await import(
      "@/lib/auth/context"
    );

    const result = await getAuthorizedContextInventory();

    expect(result).toMatchObject({
      status: "success",
      inventory: {
        organizations: [],
        hospitalCount: 1,
      },
    });
  });

  it("retorna inventario completamente vazio como sucesso legitimo", async () => {
    configureInventoryMocks({
      organizations: { data: [], error: null },
      hospitals: { data: [], error: null },
    });
    const { getAuthorizedContextInventory } = await import(
      "@/lib/auth/context"
    );

    const result = await getAuthorizedContextInventory();

    expect(result).toEqual({
      status: "success",
      inventory: {
        organizations: [],
        hospitals: [],
        hospitalCount: 0,
      },
    });
  });

  it("retorna status error quando a consulta de organizations falha", async () => {
    configureInventoryMocks({
      organizations: {
        data: null,
        error: { message: "falha interna do banco" },
      },
      hospitals: {
        data: [
          {
            id: "hosp-1",
            organization_id: "org-1",
            code: "hosp-a",
            display_name: "Hospital A",
          },
        ],
        error: null,
      },
    });
    const { getAuthorizedContextInventory } = await import(
      "@/lib/auth/context"
    );

    const result = await getAuthorizedContextInventory();

    expect(result).toEqual({ status: "error" });
  });

  it("retorna status error quando a consulta de hospitals falha", async () => {
    configureInventoryMocks({
      organizations: {
        data: [{ id: "org-1", code: "org-a", display_name: "Instituicao A" }],
        error: null,
      },
      hospitals: {
        data: null,
        error: { message: "falha interna do banco" },
      },
    });
    const { getAuthorizedContextInventory } = await import(
      "@/lib/auth/context"
    );

    const result = await getAuthorizedContextInventory();

    expect(result).toEqual({ status: "error" });
  });

  it("nao devolve dados parciais quando ha erro em qualquer consulta", async () => {
    configureInventoryMocks({
      organizations: {
        data: [{ id: "org-1", code: "org-a", display_name: "Instituicao A" }],
        error: null,
      },
      hospitals: {
        data: null,
        error: { message: "falha interna do banco" },
      },
    });
    const { getAuthorizedContextInventory } = await import(
      "@/lib/auth/context"
    );

    const result = await getAuthorizedContextInventory();

    expect(result).not.toHaveProperty("inventory");
    expect(result.status).toBe("error");
  });
});
