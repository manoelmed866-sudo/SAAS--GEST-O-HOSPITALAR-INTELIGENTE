const mocks = vi.hoisted(() => ({
  resolveActiveHospitalCapabilities: vi.fn(),
  createClient: vi.fn(),
  from: vi.fn(),
}));

export {};

// Esta suite mocka resolveActiveHospitalCapabilities (que ja revalida o
// contexto sob RLS) e o cliente Supabase server-side. Ela cobre a ORQUESTRACAO
// do resolver da estrutura: gate por canReadStructure, aninhamento
// unidade -> setor -> leito, exposicao de referencias opacas somente para quem
// gerencia e o comportamento fail-closed. O RLS real e comprovado pelo teste
// pgTAP 011 da Sprint 05.

vi.mock("@/lib/auth/capabilities", () => ({
  resolveActiveHospitalCapabilities: mocks.resolveActiveHospitalCapabilities,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

const ACTIVE_CONTEXT = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  hospitalId: "22222222-2222-4222-8222-222222222222",
  hospitalCode: "hospital-alfa",
  hospitalDisplayName: "Hospital Alfa",
};

const UNIT_ID = "33333333-3333-4333-8333-333333333331";
const SECTOR_ID = "44444444-4444-4444-8444-444444444441";

const UNIT_REF = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1";
const SECTOR_REF = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2";
const BED_REF = "ccccccccccccccccccccccccccccccc3";
const RESOURCE_REF = "ddddddddddddddddddddddddddddddd4";

const UNIT_ROW = {
  id: UNIT_ID,
  code: "unidade-adulto",
  display_name: "Unidade Adulto",
  status: "active" as const,
  management_ref: UNIT_REF,
};

const SECTOR_ROW = {
  id: SECTOR_ID,
  unit_id: UNIT_ID,
  code: "setor-observacao",
  display_name: "Setor Observação",
  status: "active" as const,
  management_ref: SECTOR_REF,
};

const BED_ROW = {
  sector_id: SECTOR_ID,
  code: "leito-01",
  display_name: "Leito 01",
  status: "inactive" as const,
  management_ref: BED_REF,
};

const RESOURCE_ROW = {
  code: "tomografo",
  display_name: "Tomógrafo",
  description: "Equipamento de imagem",
  status: "active" as const,
  management_ref: RESOURCE_REF,
};

type QueryResponse = { data: unknown; error: unknown };

type RecordedQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
};

const recordedQueries = new Map<string, RecordedQuery>();

function configureTables(responses: Record<string, QueryResponse>) {
  recordedQueries.clear();
  mocks.from.mockImplementation((table: string) => {
    const response = responses[table] ?? { data: [], error: null };
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      then: (
        onFulfilled: (value: QueryResponse) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(response).then(onFulfilled, onRejected),
    };
    recordedQueries.set(table, {
      select: builder.select,
      eq: builder.eq,
      order: builder.order,
    });
    return builder;
  });
  mocks.createClient.mockResolvedValue({ from: mocks.from });
}

function mockCapabilities(overrides: {
  canReadStructure: boolean;
  canManageStructure: boolean;
}) {
  mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
    status: "active",
    context: ACTIVE_CONTEXT,
    capabilities: {
      canReadHospital: true,
      canReadMemberships: false,
      canManageMemberships: false,
      canReadAudit: false,
      canSwitchContext: true,
      ...overrides,
    },
  });
}

const FULL_RESPONSES = {
  hospital_units: { data: [UNIT_ROW], error: null },
  hospital_sectors: { data: [SECTOR_ROW], error: null },
  hospital_beds: { data: [BED_ROW], error: null },
  hospital_resources: { data: [RESOURCE_ROW], error: null },
};

async function importResolver() {
  const mod = await import("@/lib/auth/hospital-structure");

  return mod.resolveActiveHospitalStructure;
}

describe("resolveActiveHospitalStructure - propagacao e gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propaga absent sem tocar no banco", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "absent",
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "absent" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("propaga invalid sem tocar no banco", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "invalid",
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "invalid" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("propaga error sem tocar no banco", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "error",
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("nega sem canReadStructure, preservando o contexto e sem consulta", async () => {
    mockCapabilities({ canReadStructure: false, canManageStructure: false });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({
      status: "denied",
      context: ACTIVE_CONTEXT,
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("o resolver nao aceita argumentos externos", async () => {
    const resolve = await importResolver();

    expect(resolve.length).toBe(0);
  });
});

describe("resolveActiveHospitalStructure - caminho allowed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("monta a hierarquia unidade -> setor -> leito e os recursos", async () => {
    mockCapabilities({ canReadStructure: true, canManageStructure: true });
    configureTables(FULL_RESPONSES);
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      canManage: true,
      structure: {
        units: [
          {
            code: "unidade-adulto",
            displayName: "Unidade Adulto",
            status: "active",
            managementRef: UNIT_REF,
            sectors: [
              {
                code: "setor-observacao",
                displayName: "Setor Observação",
                status: "active",
                managementRef: SECTOR_REF,
                beds: [
                  {
                    code: "leito-01",
                    displayName: "Leito 01",
                    status: "inactive",
                    managementRef: BED_REF,
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
            status: "active",
            managementRef: RESOURCE_REF,
          },
        ],
      },
    });
  });

  it("nenhum UUID interno aparece no resultado", async () => {
    mockCapabilities({ canReadStructure: true, canManageStructure: true });
    configureTables(FULL_RESPONSES);
    const resolve = await importResolver();

    const result = await resolve();
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain(UNIT_ID);
    expect(serialized).not.toContain(SECTOR_ID);
  });

  it("leitor sem gestao recebe referencias nulas e canManage false", async () => {
    mockCapabilities({ canReadStructure: true, canManageStructure: false });
    configureTables(FULL_RESPONSES);
    const resolve = await importResolver();

    const result = await resolve();

    if (result.status !== "allowed") {
      throw new Error("esperava status allowed");
    }
    expect(result.canManage).toBe(false);
    expect(result.structure.units[0].managementRef).toBeNull();
    expect(result.structure.units[0].sectors[0].managementRef).toBeNull();
    expect(result.structure.units[0].sectors[0].beds[0].managementRef).toBeNull();
    expect(result.structure.resources[0].managementRef).toBeNull();
    expect(JSON.stringify(result)).not.toContain(UNIT_REF);
  });

  it("todas as consultas filtram pelo hospital do contexto ativo", async () => {
    mockCapabilities({ canReadStructure: true, canManageStructure: true });
    configureTables(FULL_RESPONSES);
    const resolve = await importResolver();

    await resolve();

    for (const table of [
      "hospital_units",
      "hospital_sectors",
      "hospital_beds",
      "hospital_resources",
    ]) {
      const query = recordedQueries.get(table);
      expect(query).toBeDefined();
      expect(query?.eq).toHaveBeenCalledWith(
        "hospital_id",
        ACTIVE_CONTEXT.hospitalId,
      );
    }
  });

  it("estrutura vazia e um resultado valido", async () => {
    mockCapabilities({ canReadStructure: true, canManageStructure: false });
    configureTables({});
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      canManage: false,
      structure: { units: [], resources: [] },
    });
  });

  it("setor de unidade desconhecida nao e inventado em outra unidade", async () => {
    mockCapabilities({ canReadStructure: true, canManageStructure: false });
    configureTables({
      hospital_units: { data: [UNIT_ROW], error: null },
      hospital_sectors: {
        data: [
          {
            ...SECTOR_ROW,
            unit_id: "99999999-9999-4999-8999-999999999999",
          },
        ],
        error: null,
      },
    });
    const resolve = await importResolver();

    const result = await resolve();

    if (result.status !== "allowed") {
      throw new Error("esperava status allowed");
    }
    expect(result.structure.units[0].sectors).toEqual([]);
  });
});

describe("resolveActiveHospitalStructure - fail-closed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapabilities({ canReadStructure: true, canManageStructure: true });
  });

  it.each([
    "hospital_units",
    "hospital_sectors",
    "hospital_beds",
    "hospital_resources",
  ])("retorna error quando a consulta de %s falha", async (table) => {
    configureTables({
      ...FULL_RESPONSES,
      [table]: { data: null, error: { message: "falha" } },
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando uma linha tem propriedade inesperada", async () => {
    configureTables({
      ...FULL_RESPONSES,
      hospital_units: {
        data: [{ ...UNIT_ROW, secret_column: "x" }],
        error: null,
      },
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando o status esta fora do enum fechado", async () => {
    configureTables({
      ...FULL_RESPONSES,
      hospital_beds: {
        data: [{ ...BED_ROW, status: "occupied" }],
        error: null,
      },
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando a referencia opaca nao tem 32 hex", async () => {
    configureTables({
      ...FULL_RESPONSES,
      hospital_resources: {
        data: [{ ...RESOURCE_ROW, management_ref: "not-a-ref" }],
        error: null,
      },
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("nunca devolve estrutura parcial em resposta malformada", async () => {
    configureTables({
      ...FULL_RESPONSES,
      hospital_sectors: {
        data: [{ ...SECTOR_ROW, display_name: null }],
        error: null,
      },
    });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({ status: "error" });
    expect(result).not.toHaveProperty("structure");
  });
});
