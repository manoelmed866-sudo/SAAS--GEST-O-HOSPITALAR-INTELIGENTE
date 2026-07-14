const mocks = vi.hoisted(() => ({
  resolveActiveHospitalCapabilities: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

export {};

// Esta suite mocka resolveActiveHospitalCapabilities (04A2) e o cliente
// Supabase server-side (rpc). Ela cobre a ORQUESTRACAO do resolver da equipe:
// propagacao de estados, gate por canReadMemberships sem RPC no caminho
// negado, mapeamento snake_case -> camelCase e o comportamento fail-closed.
// A autorizacao real da RPC (SECURITY DEFINER com validacao interna) e
// comprovada pelo teste pgTAP 008 da Sprint 04C.

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

async function importResolver() {
  const mod = await import("@/lib/auth/hospital-team");

  return mod.resolveActiveHospitalTeam;
}

const MANAGEMENT_REF = "0123456789abcdef0123456789abcdef";

const MEMBER_ROW = {
  display_name: "Dra. Ana Ficticia",
  membership_status: "active",
  role_labels: ["Administrador hospitalar"],
  management_ref: MANAGEMENT_REF,
  can_suspend: true,
  can_reactivate: false,
};

describe("resolveActiveHospitalTeam - propagacao sem RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propaga absent sem criar cliente nem chamar RPC", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "absent",
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "absent" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("propaga invalid sem criar cliente nem chamar RPC", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "invalid",
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "invalid" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("propaga error sem criar cliente nem chamar RPC", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
      status: "error",
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("active sem canReadMemberships -> denied com o mesmo contexto, sem RPC", async () => {
    mockCapabilities({ canReadMemberships: false, canManageMemberships: true });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({ status: "denied", context: ACTIVE_CONTEXT });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("resolveActiveHospitalTeam - caminho allowed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapabilities({ canReadMemberships: true });
  });

  it("chama a RPC exatamente uma vez, somente com o hospitalId do contexto", async () => {
    configureRpc({ data: [MEMBER_ROW], error: null });
    const resolve = await importResolver();

    await resolve();

    expect(mocks.resolveActiveHospitalCapabilities).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("get_hospital_team", {
      target_hospital_id: ACTIVE_CONTEXT.hospitalId,
    });

    const argObject = mocks.rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(argObject)).toEqual(["target_hospital_id"]);
    expect(argObject).not.toHaveProperty("organizationId");
  });

  it("lista vazia -> allowed com members vazio e o mesmo contexto", async () => {
    configureRpc({ data: [], error: null });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      members: [],
    });
  });

  it("mapeia membro active de snake_case para camelCase", async () => {
    configureRpc({ data: [MEMBER_ROW], error: null });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({
      status: "allowed",
      context: ACTIVE_CONTEXT,
      members: [
        {
          displayName: "Dra. Ana Ficticia",
          membershipStatus: "active",
          roleLabels: ["Administrador hospitalar"],
          managementRef: MANAGEMENT_REF,
          canSuspend: true,
          canReactivate: false,
        },
      ],
    });
  });

  it("mapeia membro suspended e pending com multiplos rotulos e metadados de acao", async () => {
    configureRpc({
      data: [
        {
          display_name: "Dr. Bruno Ficticio",
          membership_status: "suspended",
          role_labels: ["Auditor hospitalar", "Membro hospitalar"],
          management_ref: MANAGEMENT_REF,
          can_suspend: false,
          can_reactivate: true,
        },
        {
          display_name: "Enf. Clara Ficticia",
          membership_status: "pending",
          role_labels: [],
          management_ref: null,
          can_suspend: false,
          can_reactivate: false,
        },
      ],
      error: null,
    });
    const resolve = await importResolver();

    const result = await resolve();

    if (result.status !== "allowed") {
      throw new Error("esperava allowed");
    }
    expect(result.members).toEqual([
      {
        displayName: "Dr. Bruno Ficticio",
        membershipStatus: "suspended",
        roleLabels: ["Auditor hospitalar", "Membro hospitalar"],
        managementRef: MANAGEMENT_REF,
        canSuspend: false,
        canReactivate: true,
      },
      {
        displayName: "Enf. Clara Ficticia",
        membershipStatus: "pending",
        roleLabels: [],
        managementRef: null,
        canSuspend: false,
        canReactivate: false,
      },
    ]);
  });

  it("leitor sem gestao (auditor) recebe managementRef nula e indicadores falsos", async () => {
    configureRpc({
      data: [
        {
          ...MEMBER_ROW,
          management_ref: null,
          can_suspend: false,
          can_reactivate: false,
        },
      ],
      error: null,
    });
    const resolve = await importResolver();

    const result = await resolve();

    if (result.status !== "allowed") {
      throw new Error("esperava allowed");
    }
    expect(result.members[0].managementRef).toBeNull();
    expect(result.members[0].canSuspend).toBe(false);
    expect(result.members[0].canReactivate).toBe(false);
  });

  it("devolve exatamente o ActiveContext revalidado", async () => {
    configureRpc({ data: [MEMBER_ROW], error: null });
    const resolve = await importResolver();

    const result = await resolve();

    if (result.status !== "allowed") {
      throw new Error("esperava allowed");
    }
    expect(result.context).toBe(ACTIVE_CONTEXT);
  });

  it("o resolver nao aceita argumentos externos", async () => {
    const resolve = await importResolver();

    expect(resolve.length).toBe(0);
  });
});

describe("resolveActiveHospitalTeam - fail-closed na resposta da RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapabilities({ canReadMemberships: true });
  });

  it("erro da RPC -> error", async () => {
    configureRpc({ data: null, error: { message: "falha interna" } });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("data null -> error", async () => {
    configureRpc({ data: null, error: null });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("campo ausente -> error", async () => {
    configureRpc({
      data: [{ display_name: "Fulano", membership_status: "active" }],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("management_ref em formato UUID -> error (referencia deve ser opaca)", async () => {
    configureRpc({
      data: [
        {
          ...MEMBER_ROW,
          management_ref: "33333333-3333-4333-8333-333333333333",
        },
      ],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("metadado de acao ausente -> error", async () => {
    const rowWithoutFlag: Partial<typeof MEMBER_ROW> = { ...MEMBER_ROW };
    delete rowWithoutFlag.can_reactivate;
    configureRpc({ data: [rowWithoutFlag], error: null });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("propriedade extra (schema estrito) -> error", async () => {
    configureRpc({
      data: [{ ...MEMBER_ROW, email: "vazado@exemplo.test" }],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("propriedade extra com UUID -> error", async () => {
    configureRpc({
      data: [
        { ...MEMBER_ROW, user_id: "33333333-3333-4333-8333-333333333333" },
      ],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("status fora do enum fechado -> error", async () => {
    configureRpc({
      data: [{ ...MEMBER_ROW, membership_status: "revoked" }],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("role_labels invalido (nao array de strings) -> error", async () => {
    configureRpc({
      data: [{ ...MEMBER_ROW, role_labels: [null] }],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("display_name vazio -> error", async () => {
    configureRpc({
      data: [{ ...MEMBER_ROW, display_name: "" }],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("linha malformada no meio da lista nunca gera resultado parcial", async () => {
    configureRpc({
      data: [MEMBER_ROW, { display_name: 123 }],
      error: null,
    });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({ status: "error" });
    expect(result).not.toHaveProperty("members");
  });
});
