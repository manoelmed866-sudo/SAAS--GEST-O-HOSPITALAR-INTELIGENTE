const mocks = vi.hoisted(() => ({
  resolveActiveHospitalCapabilities: vi.fn(),
}));

export {};

// Esta suite mocka resolveActiveHospitalCapabilities (04A2), que ja resolve o
// contexto ativo e as capacidades sob RLS. Ela cobre APENAS o mapeamento do
// gate: allowed/denied conforme a capacidade solicitada, propagacao de
// absent/invalid/error, preservacao do contexto e a garantia de que o conjunto
// completo de capacidades nunca vaza pelo resultado.

vi.mock("@/lib/auth/capabilities", () => ({
  resolveActiveHospitalCapabilities: mocks.resolveActiveHospitalCapabilities,
}));

const CONTEXT = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  hospitalId: "22222222-2222-4222-8222-222222222222",
  hospitalCode: "hospital-alfa",
  hospitalDisplayName: "Hospital Alfa",
};

const ALL_CAPABILITIES = {
  canReadHospital: false,
  canReadMemberships: false,
  canManageMemberships: false,
  canReadAudit: false,
  canSwitchContext: false,
};

function mockActive(overrides: Partial<typeof ALL_CAPABILITIES>) {
  mocks.resolveActiveHospitalCapabilities.mockResolvedValue({
    status: "active",
    context: CONTEXT,
    capabilities: { ...ALL_CAPABILITIES, ...overrides },
  });
}

async function importGate() {
  const mod = await import("@/lib/auth/capability-gate");

  return mod.evaluateHospitalCapability;
}

const CAPABILITIES = [
  "canReadHospital",
  "canReadMemberships",
  "canManageMemberships",
  "canReadAudit",
  "canSwitchContext",
] as const;

describe("evaluateHospitalCapability - allowed/denied por capacidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const capability of CAPABILITIES) {
    it(`${capability} true -> allowed`, async () => {
      mockActive({ [capability]: true });
      const evaluate = await importGate();

      const result = await evaluate(capability);

      expect(result).toEqual({ status: "allowed", context: CONTEXT });
    });

    it(`${capability} false -> denied`, async () => {
      mockActive({ [capability]: false });
      const evaluate = await importGate();

      const result = await evaluate(capability);

      expect(result).toEqual({ status: "denied", context: CONTEXT });
    });
  }
});

describe("evaluateHospitalCapability - contexto e vazamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allowed devolve exatamente o mesmo ActiveContext revalidado", async () => {
    mockActive({ canReadHospital: true });
    const evaluate = await importGate();

    const result = await evaluate("canReadHospital");

    if (result.status !== "allowed") {
      throw new Error("esperava allowed");
    }
    expect(result.context).toBe(CONTEXT);
  });

  it("denied devolve exatamente o mesmo ActiveContext revalidado", async () => {
    mockActive({ canReadHospital: false });
    const evaluate = await importGate();

    const result = await evaluate("canReadHospital");

    if (result.status !== "denied") {
      throw new Error("esperava denied");
    }
    expect(result.context).toBe(CONTEXT);
  });

  it("allowed nao devolve o conjunto de capacidades", async () => {
    mockActive({ canManageMemberships: true });
    const evaluate = await importGate();

    const result = await evaluate("canManageMemberships");

    expect(result).not.toHaveProperty("capabilities");
  });

  it("denied nao devolve o conjunto de capacidades", async () => {
    mockActive({ canManageMemberships: false });
    const evaluate = await importGate();

    const result = await evaluate("canManageMemberships");

    expect(result).not.toHaveProperty("capabilities");
  });

  it("apenas a capacidade solicitada decide (false com outras true -> denied)", async () => {
    mockActive({
      canReadHospital: true,
      canReadMemberships: true,
      canReadAudit: true,
      canSwitchContext: true,
      canManageMemberships: false,
    });
    const evaluate = await importGate();

    const result = await evaluate("canManageMemberships");

    expect(result).toEqual({ status: "denied", context: CONTEXT });
  });

  it("apenas a capacidade solicitada decide (true com outras false -> allowed)", async () => {
    mockActive({ canReadAudit: true });
    const evaluate = await importGate();

    const result = await evaluate("canReadAudit");

    expect(result).toEqual({ status: "allowed", context: CONTEXT });
  });
});

describe("evaluateHospitalCapability - propagacao de estados nao-active", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propaga absent", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({ status: "absent" });
    const evaluate = await importGate();

    expect(await evaluate("canReadHospital")).toEqual({ status: "absent" });
  });

  it("propaga invalid", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({ status: "invalid" });
    const evaluate = await importGate();

    expect(await evaluate("canReadHospital")).toEqual({ status: "invalid" });
  });

  it("propaga error", async () => {
    mocks.resolveActiveHospitalCapabilities.mockResolvedValue({ status: "error" });
    const evaluate = await importGate();

    expect(await evaluate("canReadHospital")).toEqual({ status: "error" });
  });
});

describe("evaluateHospitalCapability - uma unica resolucao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama resolveActiveHospitalCapabilities exatamente uma vez", async () => {
    mockActive({ canReadHospital: true });
    const evaluate = await importGate();

    await evaluate("canReadHospital");

    expect(mocks.resolveActiveHospitalCapabilities).toHaveBeenCalledTimes(1);
    expect(mocks.resolveActiveHospitalCapabilities).toHaveBeenCalledWith();
  });
});
