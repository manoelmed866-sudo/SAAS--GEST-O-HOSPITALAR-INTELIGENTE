const mocks = vi.hoisted(() => ({
  resolveActiveHospitalCapabilities: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));

export {};

// Esta suite mocka resolveActiveHospitalCapabilities, o cliente Supabase (rpc)
// e revalidatePath. Ela cobre a ORQUESTRACAO da Server Action de mutacao:
// validacao Zod da entrada minima, gate por canManageMemberships sem RPC,
// contexto nao-active, mapeamento dos cinco outcomes e revalidacao somente em
// sucesso. As protecoes reais (autorizacao, transicoes, auto-suspensao,
// ultimo admin, lock e auditoria) sao comprovadas pelo pgTAP 009.

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

const MANAGEMENT_REF = "0123456789abcdef0123456789abcdef";

const ALL_CAPABILITIES_FALSE = {
  canReadHospital: false,
  canReadMemberships: false,
  canManageMemberships: false,
  canReadAudit: false,
  canSwitchContext: false,
};

function mockCapabilities(overrides: Partial<typeof ALL_CAPABILITIES_FALSE>) {
  mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
    status: "active",
    context: ACTIVE_CONTEXT,
    capabilities: { ...ALL_CAPABILITIES_FALSE, ...overrides },
  });
}

function configureRpc(response: { data: unknown; error: unknown }) {
  mocks.rpc.mockResolvedValue(response);
  mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
}

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }

  return formData;
}

async function importAction() {
  const mod = await import("@/app/(protected)/painel/admin/equipe/actions");

  return mod.changeMembershipStatusAction;
}

const IDLE = { status: "idle" as const };

describe("changeMembershipStatusAction - validacao de entrada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapabilities({ canManageMemberships: true });
    configureRpc({ data: "updated", error: null });
  });

  it("rejeita managementRef fora do formato opaco sem tocar em nada", async () => {
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({ managementRef: "abc", requestedStatus: "suspended" }),
    );

    expect(result.status).toBe("error");
    expect(mocks.resolveActiveHospitalCapabilities).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejeita managementRef em formato UUID", async () => {
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: "33333333-3333-4333-8333-333333333333",
        requestedStatus: "suspended",
      }),
    );

    expect(result.status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejeita requestedStatus fora do enum fechado (sem revogacao)", async () => {
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "revoked",
      }),
    );

    expect(result.status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("changeMembershipStatusAction - gates de contexto e capacidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureRpc({ data: "updated", error: null });
  });

  const VALID_FORM = () =>
    buildFormData({
      managementRef: MANAGEMENT_REF,
      requestedStatus: "suspended",
    });

  it("contexto absent -> error de contexto, sem RPC", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "absent",
    });
    const action = await importAction();

    const result = await action(IDLE, VALID_FORM());

    expect(result).toEqual({
      status: "error",
      message: "Selecione novamente o hospital para continuar.",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("contexto invalid -> error de contexto, sem RPC", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "invalid",
    });
    const action = await importAction();

    const result = await action(IDLE, VALID_FORM());

    expect(result.status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("contexto error -> error generico, sem RPC", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "error",
    });
    const action = await importAction();

    const result = await action(IDLE, VALID_FORM());

    expect(result.status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("sem canManageMemberships -> denied generico, sem RPC", async () => {
    mockCapabilities({ canManageMemberships: false, canReadMemberships: true });
    const action = await importAction();

    const result = await action(IDLE, VALID_FORM());

    expect(result.status).toBe("denied");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("changeMembershipStatusAction - chamada da RPC e outcomes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapabilities({ canManageMemberships: true });
  });

  it("chama a RPC uma vez, somente com hospitalId do contexto, ref e status", async () => {
    configureRpc({ data: "updated", error: null });
    const action = await importAction();

    await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "suspended",
      }),
    );

    expect(mocks.resolveActiveHospitalCapabilities).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("change_hospital_membership_status", {
      target_hospital_id: ACTIVE_CONTEXT.hospitalId,
      target_management_ref: MANAGEMENT_REF,
      requested_status: "suspended",
    });

    const argObject = mocks.rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(argObject).sort()).toEqual([
      "requested_status",
      "target_hospital_id",
      "target_management_ref",
    ]);
    expect(argObject).not.toHaveProperty("organizationId");
  });

  it("updated + suspended -> success com mensagem e revalidatePath", async () => {
    configureRpc({ data: "updated", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "suspended",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Vínculo suspenso com sucesso.",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/painel/admin/equipe");
  });

  it("updated + active -> success de reativacao", async () => {
    configureRpc({ data: "updated", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "active",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Vínculo reativado com sucesso.",
    });
  });

  it("self_suspension_forbidden -> blocked com mensagem propria, sem revalidate", async () => {
    configureRpc({ data: "self_suspension_forbidden", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "suspended",
      }),
    );

    expect(result).toEqual({
      status: "blocked",
      message: "Você não pode suspender o próprio vínculo.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("last_admin_forbidden -> blocked com mensagem propria", async () => {
    configureRpc({ data: "last_admin_forbidden", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "suspended",
      }),
    );

    expect(result).toEqual({
      status: "blocked",
      message:
        "Não é possível suspender o último administrador ativo do hospital.",
    });
  });

  it("invalid_transition -> blocked com mensagem de estado incompativel", async () => {
    configureRpc({ data: "invalid_transition", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "active",
      }),
    );

    expect(result).toEqual({
      status: "blocked",
      message: "O vínculo não está em um estado compatível com esta ação.",
    });
  });

  it("not_allowed -> denied generico sem revelar permissoes", async () => {
    configureRpc({ data: "not_allowed", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "suspended",
      }),
    );

    expect(result.status).toBe("denied");
    expect(result).not.toHaveProperty("outcome");
    if (result.status === "denied") {
      expect(result.message).not.toMatch(/hospital_memberships|manage|permission/i);
    }
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("erro da RPC -> error generico sem excecao vazada", async () => {
    configureRpc({ data: null, error: { message: "falha interna sensivel" } });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "suspended",
      }),
    );

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).not.toMatch(/falha interna sensivel/);
    }
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("outcome desconhecido -> error fail-closed", async () => {
    configureRpc({ data: "deleted", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        managementRef: MANAGEMENT_REF,
        requestedStatus: "suspended",
      }),
    );

    expect(result.status).toBe("error");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
