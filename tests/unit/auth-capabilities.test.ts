const mocks = vi.hoisted(() => ({
  resolveActiveContext: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

export {};

// Esta suite mocka resolveActiveContext (que ja revalida o cookie sob RLS) e o
// cliente Supabase server-side (rpc). Ela cobre a ORQUESTRACAO, o MAPEAMENTO
// snake_case -> camelCase e o comportamento fail-closed do resolver. Ela NAO
// exercita o RLS nem a combinacao dos tres escopos: isso e comprovado pelo
// teste pgTAP 007 da Sprint 04A1.

vi.mock("@/lib/auth/context", () => ({
  resolveActiveContext: mocks.resolveActiveContext,
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

const ALL_FALSE_ROW = {
  can_read_hospital: false,
  can_read_memberships: false,
  can_manage_memberships: false,
  can_read_audit: false,
  can_switch_context: false,
};

const ALL_TRUE_ROW = {
  can_read_hospital: true,
  can_read_memberships: true,
  can_manage_memberships: true,
  can_read_audit: true,
  can_switch_context: true,
};

function mockActiveContext() {
  mocks.resolveActiveContext.mockResolvedValue({
    status: "active",
    context: ACTIVE_CONTEXT,
  });
}

function configureRpc(response: { data: unknown; error: unknown }) {
  mocks.rpc.mockResolvedValue(response);
  mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
}

async function importResolver() {
  const mod = await import("@/lib/auth/capabilities");

  return mod.resolveActiveHospitalCapabilities;
}

describe("resolveActiveHospitalCapabilities - caminho active", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mapeia cinco false", async () => {
    mockActiveContext();
    configureRpc({ data: [ALL_FALSE_ROW], error: null });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({
      status: "active",
      context: ACTIVE_CONTEXT,
      capabilities: {
        canReadHospital: false,
        canReadMemberships: false,
        canManageMemberships: false,
        canReadAudit: false,
        canSwitchContext: false,
      },
    });
  });

  it("mapeia cinco true", async () => {
    mockActiveContext();
    configureRpc({ data: [ALL_TRUE_ROW], error: null });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({
      status: "active",
      context: ACTIVE_CONTEXT,
      capabilities: {
        canReadHospital: true,
        canReadMemberships: true,
        canManageMemberships: true,
        canReadAudit: true,
        canSwitchContext: true,
      },
    });
  });

  it("mapeia combinacao parcial de capacidades", async () => {
    mockActiveContext();
    configureRpc({
      data: [
        {
          can_read_hospital: true,
          can_read_memberships: true,
          can_manage_memberships: true,
          can_read_audit: false,
          can_switch_context: true,
        },
      ],
      error: null,
    });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({
      status: "active",
      context: ACTIVE_CONTEXT,
      capabilities: {
        canReadHospital: true,
        canReadMemberships: true,
        canManageMemberships: true,
        canReadAudit: false,
        canSwitchContext: true,
      },
    });
  });

  it("mapeia corretamente snake_case -> camelCase por campo", async () => {
    mockActiveContext();
    configureRpc({
      data: [
        {
          can_read_hospital: false,
          can_read_memberships: true,
          can_manage_memberships: false,
          can_read_audit: true,
          can_switch_context: false,
        },
      ],
      error: null,
    });
    const resolve = await importResolver();

    const result = await resolve();

    if (result.status !== "active") {
      throw new Error("esperava status active");
    }
    expect(result.capabilities.canReadHospital).toBe(false);
    expect(result.capabilities.canReadMemberships).toBe(true);
    expect(result.capabilities.canManageMemberships).toBe(false);
    expect(result.capabilities.canReadAudit).toBe(true);
    expect(result.capabilities.canSwitchContext).toBe(false);
  });

  it("devolve exatamente o ActiveContext revalidado", async () => {
    mockActiveContext();
    configureRpc({ data: [ALL_FALSE_ROW], error: null });
    const resolve = await importResolver();

    const result = await resolve();

    if (result.status !== "active") {
      throw new Error("esperava status active");
    }
    expect(result.context).toEqual(ACTIVE_CONTEXT);
  });

  it("envia a RPC exatamente o hospitalId do ActiveContext e nada mais", async () => {
    mockActiveContext();
    configureRpc({ data: [ALL_FALSE_ROW], error: null });
    const resolve = await importResolver();

    await resolve();

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("get_effective_hospital_capabilities", {
      target_hospital_id: ACTIVE_CONTEXT.hospitalId,
    });

    const argObject = mocks.rpc.mock.calls[0][1] as Record<string, unknown>;
    // Somente target_hospital_id participa da chamada; organizationId nunca vai.
    expect(Object.keys(argObject)).toEqual(["target_hospital_id"]);
    expect(argObject).not.toHaveProperty("organizationId");
  });

  it("o resolver nao aceita argumentos externos", async () => {
    const resolve = await importResolver();

    expect(resolve.length).toBe(0);
  });
});

describe("resolveActiveHospitalCapabilities - contexto nao-active propagado sem RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propaga absent sem chamar createClient nem rpc", async () => {
    mocks.resolveActiveContext.mockResolvedValue({ status: "absent" });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({ status: "absent" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("propaga invalid sem chamar createClient nem rpc", async () => {
    mocks.resolveActiveContext.mockResolvedValue({ status: "invalid" });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({ status: "invalid" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("propaga error do contexto sem chamar createClient nem rpc", async () => {
    mocks.resolveActiveContext.mockResolvedValue({ status: "error" });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({ status: "error" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("resolveActiveHospitalCapabilities - fail-closed na resposta da RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveContext();
  });

  it("retorna error quando a RPC devolve erro", async () => {
    configureRpc({ data: null, error: { message: "falha interna" } });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando a RPC devolve array vazio", async () => {
    configureRpc({ data: [], error: null });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando a RPC devolve mais de uma linha", async () => {
    configureRpc({ data: [ALL_FALSE_ROW, ALL_TRUE_ROW], error: null });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando a RPC devolve null", async () => {
    configureRpc({ data: null, error: null });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando falta um campo", async () => {
    const missing = {
      can_read_hospital: true,
      can_read_memberships: true,
      can_manage_memberships: true,
      can_read_audit: true,
      // sem can_switch_context
    };
    configureRpc({ data: [missing], error: null });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando um campo e nulo", async () => {
    configureRpc({
      data: [{ ...ALL_TRUE_ROW, can_read_audit: null }],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando um campo e string no lugar de boolean", async () => {
    configureRpc({
      data: [{ ...ALL_TRUE_ROW, can_read_hospital: "true" }],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("retorna error quando ha propriedade inesperada (schema estrito)", async () => {
    configureRpc({
      data: [{ ...ALL_TRUE_ROW, can_delete_hospital: true }],
      error: null,
    });
    const resolve = await importResolver();

    expect(await resolve()).toEqual({ status: "error" });
  });

  it("nunca retorna capacidades parciais em resposta malformada", async () => {
    const missing = {
      can_read_hospital: true,
      can_read_memberships: true,
      can_read_audit: true,
      can_switch_context: true,
      // sem can_manage_memberships
    };
    configureRpc({ data: [missing], error: null });
    const resolve = await importResolver();

    const result = await resolve();

    expect(result).toEqual({ status: "error" });
    expect(result).not.toHaveProperty("capabilities");
  });
});
