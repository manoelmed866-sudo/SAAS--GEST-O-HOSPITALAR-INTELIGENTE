const mocks = vi.hoisted(() => ({
  resolveActiveHospitalCapabilities: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));

export {};

// Sprint 04 (fechamento) - Server Action de gestao de papeis hospitalares.
// Esta suite mocka resolveActiveHospitalCapabilities, o cliente Supabase (rpc)
// e revalidatePath, cobrindo a ORQUESTRACAO: validacao Zod da entrada minima
// (duas refs opacas e a acao), gate por canManageMemberships sem RPC, contexto
// nao-active, mapeamento dos cinco outcomes e revalidacao somente em sucesso.
// As protecoes reais (autorizacao, duplicidade, reatribuicao, auto-revogacao,
// ultimo admin, lock e auditoria) sao comprovadas pelo pgTAP 010.

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

const MEMBERSHIP_REF = "0123456789abcdef0123456789abcdef";
const ROLE_REF = "fedcba9876543210fedcba9876543210";

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

  return mod.changeMembershipRoleAction;
}

const IDLE = { status: "idle" as const };

const VALID_INPUT = {
  membershipRef: MEMBERSHIP_REF,
  roleRef: ROLE_REF,
  requestedAction: "assign",
};

describe("changeMembershipRoleAction - validacao de entrada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapabilities({ canManageMemberships: true });
    configureRpc({ data: "updated", error: null });
  });

  it("rejeita membershipRef fora do formato opaco sem tocar em nada", async () => {
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({ ...VALID_INPUT, membershipRef: "abc" }),
    );

    expect(result.status).toBe("error");
    expect(mocks.resolveActiveHospitalCapabilities).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejeita roleRef em formato UUID", async () => {
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({
        ...VALID_INPUT,
        roleRef: "33333333-3333-4333-8333-333333333333",
      }),
    );

    expect(result.status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejeita acao fora do enum fechado assign/revoke", async () => {
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({ ...VALID_INPUT, requestedAction: "delete" }),
    );

    expect(result.status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("ignora campos extras do navegador (hospitalId nunca entra na RPC)", async () => {
    const action = await importAction();

    await action(
      IDLE,
      buildFormData({
        ...VALID_INPUT,
        hospitalId: "99999999-9999-4999-8999-999999999999",
        role: "hospital_admin",
      }),
    );

    expect(mocks.rpc).toHaveBeenCalledWith("change_hospital_membership_role", {
      target_hospital_id: ACTIVE_CONTEXT.hospitalId,
      target_membership_ref: MEMBERSHIP_REF,
      target_role_ref: ROLE_REF,
      requested_action: "assign",
    });
    const args = mocks.rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(args).sort()).toEqual([
      "requested_action",
      "target_hospital_id",
      "target_membership_ref",
      "target_role_ref",
    ]);
  });
});

describe("changeMembershipRoleAction - gates de contexto e capacidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureRpc({ data: "updated", error: null });
  });

  it("contexto absent -> erro de contexto sem RPC", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "absent",
    });
    const action = await importAction();

    const result = await action(IDLE, buildFormData(VALID_INPUT));

    expect(result.status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("erro tecnico do contexto -> error sem RPC", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "error",
    });
    const action = await importAction();

    const result = await action(IDLE, buildFormData(VALID_INPUT));

    expect(result.status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("sem canManageMemberships -> denied sem RPC", async () => {
    mockCapabilities({ canManageMemberships: false, canReadMemberships: true });
    const action = await importAction();

    const result = await action(IDLE, buildFormData(VALID_INPUT));

    expect(result.status).toBe("denied");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("changeMembershipRoleAction - outcomes da RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapabilities({ canManageMemberships: true });
  });

  it("updated em assign -> sucesso com revalidacao da pagina", async () => {
    configureRpc({ data: "updated", error: null });
    const action = await importAction();

    const result = await action(IDLE, buildFormData(VALID_INPUT));

    expect(result).toEqual({
      status: "success",
      message: "Papel atribuído com sucesso.",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/painel/admin/equipe");
  });

  it("updated em revoke -> mensagem propria de revogacao", async () => {
    configureRpc({ data: "updated", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({ ...VALID_INPUT, requestedAction: "revoke" }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Papel revogado com sucesso.",
    });
  });

  it("self_admin_role_forbidden -> blocked sem revalidacao", async () => {
    configureRpc({ data: "self_admin_role_forbidden", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({ ...VALID_INPUT, requestedAction: "revoke" }),
    );

    expect(result.status).toBe("blocked");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("last_admin_forbidden -> blocked com mensagem generica", async () => {
    configureRpc({ data: "last_admin_forbidden", error: null });
    const action = await importAction();

    const result = await action(
      IDLE,
      buildFormData({ ...VALID_INPUT, requestedAction: "revoke" }),
    );

    expect(result.status).toBe("blocked");
    if (result.status !== "blocked") {
      throw new Error("esperava blocked");
    }
    expect(result.message).not.toMatch(/hospital_admin|uuid|ref/i);
  });

  it("invalid_transition -> blocked", async () => {
    configureRpc({ data: "invalid_transition", error: null });
    const action = await importAction();

    const result = await action(IDLE, buildFormData(VALID_INPUT));

    expect(result.status).toBe("blocked");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("not_allowed -> denied", async () => {
    configureRpc({ data: "not_allowed", error: null });
    const action = await importAction();

    const result = await action(IDLE, buildFormData(VALID_INPUT));

    expect(result.status).toBe("denied");
  });

  it("erro da RPC -> error generico", async () => {
    configureRpc({ data: null, error: { message: "falha interna" } });
    const action = await importAction();

    const result = await action(IDLE, buildFormData(VALID_INPUT));

    expect(result.status).toBe("error");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("outcome fora do enum fechado -> error (fail-closed)", async () => {
    configureRpc({ data: "algo_inesperado", error: null });
    const action = await importAction();

    const result = await action(IDLE, buildFormData(VALID_INPUT));

    expect(result.status).toBe("error");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
