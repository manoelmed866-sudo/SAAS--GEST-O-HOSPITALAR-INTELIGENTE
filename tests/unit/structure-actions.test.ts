const mocks = vi.hoisted(() => ({
  resolveActiveHospitalCapabilities: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

export {};

// Esta suite cobre as Server Actions do cadastro institucional (Sprint 05):
// validacao Zod, gate por canManageStructure, origem exclusiva do hospital no
// contexto ativo, resolucao de pai por referencia opaca, traducao fail-closed
// de erros do banco e revalidacao somente em sucesso. O RLS real e comprovado
// pelo teste pgTAP 011.

vi.mock("@/lib/auth/capabilities", () => ({
  resolveActiveHospitalCapabilities: mocks.resolveActiveHospitalCapabilities,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

const ACTIVE_CONTEXT = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  hospitalId: "22222222-2222-4222-8222-222222222222",
  hospitalCode: "hospital-alfa",
  hospitalDisplayName: "Hospital Alfa",
};

const UNIT_REF = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1";
const SECTOR_REF = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2";
const ITEM_REF = "ccccccccccccccccccccccccccccccc3";

const IDLE = { status: "idle" as const };

function mockManage(canManageStructure: boolean) {
  mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
    status: "active",
    context: ACTIVE_CONTEXT,
    capabilities: {
      canReadHospital: true,
      canReadMemberships: false,
      canManageMemberships: false,
      canReadAudit: false,
      canSwitchContext: true,
      canReadStructure: true,
      canManageStructure,
    },
  });
}

type TableHandlers = {
  insert?: ReturnType<typeof vi.fn>;
  maybeSingleResponse?: { data: unknown; error: unknown };
  updateResponse?: { data: unknown; error: unknown };
  update?: ReturnType<typeof vi.fn>;
  recorded?: Record<string, unknown[][]>;
};

function configureClient(tables: Record<string, TableHandlers>) {
  const fromMock = vi.fn((table: string) => {
    const handlers = tables[table];
    if (!handlers) {
      throw new Error(`tabela inesperada: ${table}`);
    }

    const eqCalls: unknown[][] = [];
    const neqCalls: unknown[][] = [];
    handlers.recorded = { eq: eqCalls, neq: neqCalls };

    const builder = {
      insert: handlers.insert ?? vi.fn(() => Promise.resolve({ error: null })),
      select: vi.fn(() => builder),
      update: vi.fn((payload: unknown) => {
        handlers.update = builder.update;
        void payload;
        return builder;
      }),
      eq: vi.fn((...args: unknown[]) => {
        eqCalls.push(args);
        return builder;
      }),
      neq: vi.fn((...args: unknown[]) => {
        neqCalls.push(args);
        return builder;
      }),
      maybeSingle: vi.fn(() =>
        Promise.resolve(
          handlers.maybeSingleResponse ?? { data: null, error: null },
        ),
      ),
      then: (
        onFulfilled: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) =>
        Promise.resolve(
          handlers.updateResponse ?? { data: [], error: null },
        ).then(onFulfilled, onRejected),
    };

    return builder;
  });

  mocks.createClient.mockResolvedValue({ from: fromMock });

  return fromMock;
}

function makeFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

async function importActions() {
  return import("@/app/(protected)/painel/admin/estrutura/actions");
}

describe("createUnitAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia codigo invalido antes de qualquer consulta", async () => {
    const { createUnitAction } = await importActions();

    const result = await createUnitAction(
      IDLE,
      makeFormData({ code: "Código Inválido!", displayName: "Unidade" }),
    );

    expect(result.status).toBe("blocked");
    expect(mocks.resolveActiveHospitalCapabilities).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("nega sem canManageStructure, sem tocar no banco", async () => {
    mockManage(false);
    const { createUnitAction } = await importActions();

    const result = await createUnitAction(
      IDLE,
      makeFormData({ code: "unidade-a", displayName: "Unidade A" }),
    );

    expect(result.status).toBe("denied");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("contexto absent vira erro com orientacao de contexto", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "absent",
    });
    const { createUnitAction } = await importActions();

    const result = await createUnitAction(
      IDLE,
      makeFormData({ code: "unidade-a", displayName: "Unidade A" }),
    );

    expect(result.status).toBe("error");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("cria com organization/hospital EXCLUSIVAMENTE do contexto ativo", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    configureClient({ hospital_units: { insert } });
    const { createUnitAction } = await importActions();

    const result = await createUnitAction(
      IDLE,
      makeFormData({
        code: "  Unidade-A  ",
        displayName: "  Unidade A  ",
        // Campos maliciosos sao ignorados: nunca entram no insert.
        hospitalId: "99999999-9999-4999-8999-999999999999",
        organizationId: "88888888-8888-4888-8888-888888888888",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Unidade criada com sucesso.",
    });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith({
      organization_id: ACTIVE_CONTEXT.organizationId,
      hospital_id: ACTIVE_CONTEXT.hospitalId,
      code: "unidade-a",
      display_name: "Unidade A",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/painel/admin/estrutura",
    );
  });

  it("codigo duplicado (23505) vira mensagem amigavel sem revalidar", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: { code: "23505" } }));
    configureClient({ hospital_units: { insert } });
    const { createUnitAction } = await importActions();

    const result = await createUnitAction(
      IDLE,
      makeFormData({ code: "unidade-a", displayName: "Unidade A" }),
    );

    expect(result.status).toBe("blocked");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("RLS negada (42501) vira denied generico", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: { code: "42501" } }));
    configureClient({ hospital_units: { insert } });
    const { createUnitAction } = await importActions();

    const result = await createUnitAction(
      IDLE,
      makeFormData({ code: "unidade-a", displayName: "Unidade A" }),
    );

    expect(result.status).toBe("denied");
  });

  it("erro tecnico desconhecido vira error generico", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: { code: "XX000" } }));
    configureClient({ hospital_units: { insert } });
    const { createUnitAction } = await importActions();

    const result = await createUnitAction(
      IDLE,
      makeFormData({ code: "unidade-a", displayName: "Unidade A" }),
    );

    expect(result.status).toBe("error");
  });
});

describe("createSectorAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia referencia de unidade fora do formato opaco", async () => {
    const { createSectorAction } = await importActions();

    const result = await createSectorAction(
      IDLE,
      makeFormData({
        unitRef: "22222222-2222-4222-8222-222222222222",
        code: "setor-a",
        displayName: "Setor A",
      }),
    );

    expect(result.status).toBe("blocked");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("unidade inexistente, inativa ou de outro hospital recebe a MESMA resposta", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    const tables = {
      hospital_units: {
        maybeSingleResponse: { data: null, error: null },
      },
      hospital_sectors: { insert },
    };
    configureClient(tables);
    const { createSectorAction } = await importActions();

    const result = await createSectorAction(
      IDLE,
      makeFormData({
        unitRef: UNIT_REF,
        code: "setor-a",
        displayName: "Setor A",
      }),
    );

    expect(result.status).toBe("blocked");
    expect(insert).not.toHaveBeenCalled();
  });

  it("resolve a unidade-mae restrita ao hospital ativo e cria o setor", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    const tables: Record<string, TableHandlers> = {
      hospital_units: {
        maybeSingleResponse: {
          data: { id: "33333333-3333-4333-8333-333333333331" },
          error: null,
        },
      },
      hospital_sectors: { insert },
    };
    configureClient(tables);
    const { createSectorAction } = await importActions();

    const result = await createSectorAction(
      IDLE,
      makeFormData({
        unitRef: UNIT_REF,
        code: "setor-a",
        displayName: "Setor A",
      }),
    );

    expect(result.status).toBe("success");
    expect(tables.hospital_units.recorded?.eq).toEqual(
      expect.arrayContaining([
        ["hospital_id", ACTIVE_CONTEXT.hospitalId],
        ["management_ref", UNIT_REF],
        ["status", "active"],
      ]),
    );
    expect(insert).toHaveBeenCalledWith({
      organization_id: ACTIVE_CONTEXT.organizationId,
      hospital_id: ACTIVE_CONTEXT.hospitalId,
      unit_id: "33333333-3333-4333-8333-333333333331",
      code: "setor-a",
      display_name: "Setor A",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/painel/admin/estrutura",
    );
  });

  it("falha tecnica na busca da unidade vira error sem insert", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    configureClient({
      hospital_units: {
        maybeSingleResponse: { data: null, error: { message: "falha" } },
      },
      hospital_sectors: { insert },
    });
    const { createSectorAction } = await importActions();

    const result = await createSectorAction(
      IDLE,
      makeFormData({
        unitRef: UNIT_REF,
        code: "setor-a",
        displayName: "Setor A",
      }),
    );

    expect(result.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("createBedAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("setor indisponivel bloqueia sem insert", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    configureClient({
      hospital_sectors: { maybeSingleResponse: { data: null, error: null } },
      hospital_beds: { insert },
    });
    const { createBedAction } = await importActions();

    const result = await createBedAction(
      IDLE,
      makeFormData({
        sectorRef: SECTOR_REF,
        code: "leito-01",
        displayName: "Leito 01",
      }),
    );

    expect(result.status).toBe("blocked");
    expect(insert).not.toHaveBeenCalled();
  });

  it("cria o leito vinculado ao setor resolvido no servidor", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    configureClient({
      hospital_sectors: {
        maybeSingleResponse: {
          data: { id: "44444444-4444-4444-8444-444444444441" },
          error: null,
        },
      },
      hospital_beds: { insert },
    });
    const { createBedAction } = await importActions();

    const result = await createBedAction(
      IDLE,
      makeFormData({
        sectorRef: SECTOR_REF,
        code: "leito-01",
        displayName: "Leito 01",
      }),
    );

    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith({
      organization_id: ACTIVE_CONTEXT.organizationId,
      hospital_id: ACTIVE_CONTEXT.hospitalId,
      sector_id: "44444444-4444-4444-8444-444444444441",
      code: "leito-01",
      display_name: "Leito 01",
    });
  });
});

describe("createResourceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("descricao vazia vira null e a criacao revalida", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    configureClient({ hospital_resources: { insert } });
    const { createResourceAction } = await importActions();

    const result = await createResourceAction(
      IDLE,
      makeFormData({
        code: "tomografo",
        displayName: "Tomógrafo",
        description: "   ",
      }),
    );

    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith({
      organization_id: ACTIVE_CONTEXT.organizationId,
      hospital_id: ACTIVE_CONTEXT.hospitalId,
      code: "tomografo",
      display_name: "Tomógrafo",
      description: null,
    });
  });

  it("descricao preenchida e preservada apos trim", async () => {
    mockManage(true);
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    configureClient({ hospital_resources: { insert } });
    const { createResourceAction } = await importActions();

    await createResourceAction(
      IDLE,
      makeFormData({
        code: "tomografo",
        displayName: "Tomógrafo",
        description: "  Equipamento de imagem  ",
      }),
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Equipamento de imagem" }),
    );
  });

  it("nega sem canManageStructure", async () => {
    mockManage(false);
    const { createResourceAction } = await importActions();

    const result = await createResourceAction(
      IDLE,
      makeFormData({ code: "tomografo", displayName: "Tomógrafo" }),
    );

    expect(result.status).toBe("denied");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe("changeStructureStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tipo de item fora do enum fechado vira error sem consulta", async () => {
    const { changeStructureStatusAction } = await importActions();

    const result = await changeStructureStatusAction(
      IDLE,
      makeFormData({
        kind: "profiles",
        managementRef: ITEM_REF,
        requestedStatus: "inactive",
      }),
    );

    expect(result.status).toBe("error");
    expect(mocks.resolveActiveHospitalCapabilities).not.toHaveBeenCalled();
  });

  it("nega sem canManageStructure", async () => {
    mockManage(false);
    const { changeStructureStatusAction } = await importActions();

    const result = await changeStructureStatusAction(
      IDLE,
      makeFormData({
        kind: "unit",
        managementRef: ITEM_REF,
        requestedStatus: "inactive",
      }),
    );

    expect(result.status).toBe("denied");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("desativa restrito ao hospital ativo e a referencia opaca", async () => {
    mockManage(true);
    const tables: Record<string, TableHandlers> = {
      hospital_units: {
        updateResponse: { data: [{ status: "inactive" }], error: null },
      },
    };
    configureClient(tables);
    const { changeStructureStatusAction } = await importActions();

    const result = await changeStructureStatusAction(
      IDLE,
      makeFormData({
        kind: "unit",
        managementRef: ITEM_REF,
        requestedStatus: "inactive",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Item desativado com sucesso.",
    });
    expect(tables.hospital_units.recorded?.eq).toEqual(
      expect.arrayContaining([
        ["hospital_id", ACTIVE_CONTEXT.hospitalId],
        ["management_ref", ITEM_REF],
      ]),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/painel/admin/estrutura",
    );
  });

  it("reativa leito mapeando kind=bed para hospital_beds", async () => {
    mockManage(true);
    const tables = {
      hospital_beds: {
        updateResponse: { data: [{ status: "active" }], error: null },
      },
    };
    const fromMock = configureClient(tables);
    const { changeStructureStatusAction } = await importActions();

    const result = await changeStructureStatusAction(
      IDLE,
      makeFormData({
        kind: "bed",
        managementRef: ITEM_REF,
        requestedStatus: "active",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Item reativado com sucesso.",
    });
    expect(fromMock).toHaveBeenCalledWith("hospital_beds");
  });

  it("zero linhas atualizadas vira blocked sem revalidar (anti-enumeracao)", async () => {
    mockManage(true);
    configureClient({
      hospital_resources: { updateResponse: { data: [], error: null } },
    });
    const { changeStructureStatusAction } = await importActions();

    const result = await changeStructureStatusAction(
      IDLE,
      makeFormData({
        kind: "resource",
        managementRef: ITEM_REF,
        requestedStatus: "inactive",
      }),
    );

    expect(result.status).toBe("blocked");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("erro tecnico do banco vira error generico", async () => {
    mockManage(true);
    configureClient({
      hospital_sectors: {
        updateResponse: { data: null, error: { message: "falha" } },
      },
    });
    const { changeStructureStatusAction } = await importActions();

    const result = await changeStructureStatusAction(
      IDLE,
      makeFormData({
        kind: "sector",
        managementRef: ITEM_REF,
        requestedStatus: "active",
      }),
    );

    expect(result.status).toBe("error");
  });
});
