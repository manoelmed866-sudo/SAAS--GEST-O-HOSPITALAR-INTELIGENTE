import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  createClient: vi.fn(),
  readContextCookie: vi.fn(),
}));

export {};

// IMPORTANTE: esta suite mocka o Supabase server-side e o cookie. Ela cobre
// apenas a ORQUESTRACAO (cookie -> validacao) e o FORMATO discriminado dos
// resultados. Ela NAO exercita o RLS: a garantia de que a leitura de hospitals
// so libera contexto autorizado, ativo e do proprio tenant sera comprovada
// pelo teste pgTAP da Etapa 4 da Sprint 03D3.

type MaybeSingleResponse = {
  data: {
    id: string;
    organization_id: string;
    code: string;
    display_name: string;
  } | null;
  error: { message?: string } | null;
};

type EqCall = { column: string; value: unknown };

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/auth/context-cookie", () => ({
  readContextCookie: mocks.readContextCookie,
}));

const VALID_ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const VALID_HOSPITAL_ID = "22222222-2222-4222-8222-222222222222";
const VALID_HOSPITAL_CODE = "hospital-alfa";
const VALID_HOSPITAL_DISPLAY_NAME = "Hospital Alfa";

type QuerySpy = {
  table: string | null;
  selectArg: string | null;
  eqCalls: EqCall[];
  maybeSingleCalls: number;
};

function configureHospitalsQuery(response: MaybeSingleResponse): QuerySpy {
  const spy: QuerySpy = {
    table: null,
    selectArg: null,
    eqCalls: [],
    maybeSingleCalls: 0,
  };

  const query = {
    select: vi.fn((columns: string) => {
      spy.selectArg = columns;

      return query;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      spy.eqCalls.push({ column, value });

      return query;
    }),
    maybeSingle: vi.fn(() => {
      spy.maybeSingleCalls += 1;

      return Promise.resolve(response);
    }),
  };

  mocks.from.mockImplementation((table: string) => {
    spy.table = table;

    return query;
  });
  mocks.createClient.mockResolvedValue({ from: mocks.from });

  return spy;
}

describe("validateActiveContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna active com IDs, codigo e nome do hospital", async () => {
    configureHospitalsQuery({
      data: {
        id: VALID_HOSPITAL_ID,
        organization_id: VALID_ORGANIZATION_ID,
        code: VALID_HOSPITAL_CODE,
        display_name: VALID_HOSPITAL_DISPLAY_NAME,
      },
      error: null,
    });
    const { validateActiveContext } = await import("@/lib/auth/context");

    const result = await validateActiveContext({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    expect(result).toEqual({
      status: "active",
      context: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        hospitalCode: VALID_HOSPITAL_CODE,
        hospitalDisplayName: VALID_HOSPITAL_DISPLAY_NAME,
      },
    });
  });

  it("no retorno active usa os IDs, codigo e nome vindos da linha do banco", async () => {
    const bankOrganizationId = "33333333-3333-4333-8333-333333333333";
    const bankHospitalId = "44444444-4444-4444-8444-444444444444";
    const bankCode = "hospital-beta";
    const bankName = "Hospital Beta";
    configureHospitalsQuery({
      data: {
        id: bankHospitalId,
        organization_id: bankOrganizationId,
        code: bankCode,
        display_name: bankName,
      },
      error: null,
    });
    const { validateActiveContext } = await import("@/lib/auth/context");

    const result = await validateActiveContext({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    // Todos os campos apresentaveis vem da linha do banco, nunca do input.
    expect(result).toEqual({
      status: "active",
      context: {
        organizationId: bankOrganizationId,
        hospitalId: bankHospitalId,
        hospitalCode: bankCode,
        hospitalDisplayName: bankName,
      },
    });
  });

  it("retorna invalid quando maybeSingle devolve data null", async () => {
    configureHospitalsQuery({ data: null, error: null });
    const { validateActiveContext } = await import("@/lib/auth/context");

    const result = await validateActiveContext({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    expect(result).toEqual({ status: "invalid" });
  });

  it("retorna error quando a consulta falha", async () => {
    configureHospitalsQuery({
      data: null,
      error: { message: "falha interna do banco" },
    });
    const { validateActiveContext } = await import("@/lib/auth/context");

    const result = await validateActiveContext({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    expect(result).toEqual({ status: "error" });
  });

  it("estados invalid e error nao possuem context", async () => {
    configureHospitalsQuery({ data: null, error: null });
    const { validateActiveContext } = await import("@/lib/auth/context");

    const invalidResult = await validateActiveContext({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    configureHospitalsQuery({
      data: null,
      error: { message: "falha interna do banco" },
    });
    const errorResult = await validateActiveContext({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    expect(invalidResult).not.toHaveProperty("context");
    expect(errorResult).not.toHaveProperty("context");
  });

  it("consulta apenas a tabela hospitals com select explicito, filtros e maybeSingle", async () => {
    const spy = configureHospitalsQuery({
      data: {
        id: VALID_HOSPITAL_ID,
        organization_id: VALID_ORGANIZATION_ID,
        code: VALID_HOSPITAL_CODE,
        display_name: VALID_HOSPITAL_DISPLAY_NAME,
      },
      error: null,
    });
    const { validateActiveContext } = await import("@/lib/auth/context");

    await validateActiveContext({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    // Uma unica consulta: nenhuma chamada extra ao banco foi introduzida.
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(spy.table).toBe("hospitals");
    expect(spy.selectArg).toBe("id, organization_id, code, display_name");
    expect(spy.eqCalls).toEqual([
      { column: "id", value: VALID_HOSPITAL_ID },
      { column: "organization_id", value: VALID_ORGANIZATION_ID },
      { column: "status", value: "active" },
    ]);
    expect(spy.maybeSingleCalls).toBe(1);
  });
});

describe("resolveActiveContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna absent sem chamar createClient quando o cookie esta ausente", async () => {
    mocks.readContextCookie.mockResolvedValue({ status: "absent" });
    const { resolveActiveContext } = await import("@/lib/auth/context");

    const result = await resolveActiveContext();

    expect(result).toEqual({ status: "absent" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("retorna invalid sem chamar createClient quando o cookie esta malformed", async () => {
    mocks.readContextCookie.mockResolvedValue({ status: "malformed" });
    const { resolveActiveContext } = await import("@/lib/auth/context");

    const result = await resolveActiveContext();

    expect(result).toEqual({ status: "invalid" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("retorna active quando o cookie presente e valido no banco", async () => {
    mocks.readContextCookie.mockResolvedValue({
      status: "present",
      payload: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      },
    });
    configureHospitalsQuery({
      data: {
        id: VALID_HOSPITAL_ID,
        organization_id: VALID_ORGANIZATION_ID,
        code: VALID_HOSPITAL_CODE,
        display_name: VALID_HOSPITAL_DISPLAY_NAME,
      },
      error: null,
    });
    const { resolveActiveContext } = await import("@/lib/auth/context");

    const result = await resolveActiveContext();

    expect(result).toEqual({
      status: "active",
      context: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        hospitalCode: VALID_HOSPITAL_CODE,
        hospitalDisplayName: VALID_HOSPITAL_DISPLAY_NAME,
      },
    });
  });

  it("nao le nome nem codigo do cookie: o cookie so carrega ids e v", async () => {
    // O cookie presente nao possui code/display_name; eles vem do banco.
    mocks.readContextCookie.mockResolvedValue({
      status: "present",
      payload: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      },
    });
    configureHospitalsQuery({
      data: {
        id: VALID_HOSPITAL_ID,
        organization_id: VALID_ORGANIZATION_ID,
        code: "codigo-do-banco",
        display_name: "Nome Do Banco",
      },
      error: null,
    });
    const { resolveActiveContext } = await import("@/lib/auth/context");

    const result = await resolveActiveContext();

    if (result.status !== "active") {
      throw new Error("esperava contexto ativo");
    }
    expect(result.context.hospitalCode).toBe("codigo-do-banco");
    expect(result.context.hospitalDisplayName).toBe("Nome Do Banco");
  });

  it("retorna invalid quando o cookie presente nao tem linha no banco", async () => {
    mocks.readContextCookie.mockResolvedValue({
      status: "present",
      payload: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      },
    });
    configureHospitalsQuery({ data: null, error: null });
    const { resolveActiveContext } = await import("@/lib/auth/context");

    const result = await resolveActiveContext();

    expect(result).toEqual({ status: "invalid" });
  });

  it("retorna error quando o cookie presente encontra erro tecnico no banco", async () => {
    mocks.readContextCookie.mockResolvedValue({
      status: "present",
      payload: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      },
    });
    configureHospitalsQuery({
      data: null,
      error: { message: "falha interna do banco" },
    });
    const { resolveActiveContext } = await import("@/lib/auth/context");

    const result = await resolveActiveContext();

    expect(result).toEqual({ status: "error" });
  });

  it("nenhum estado nao-active contem context", async () => {
    const nonActiveResults: unknown[] = [];

    mocks.readContextCookie.mockResolvedValue({ status: "absent" });
    let mod = await import("@/lib/auth/context");
    nonActiveResults.push(await mod.resolveActiveContext());

    vi.clearAllMocks();
    mocks.readContextCookie.mockResolvedValue({ status: "malformed" });
    nonActiveResults.push(await mod.resolveActiveContext());

    vi.clearAllMocks();
    mocks.readContextCookie.mockResolvedValue({
      status: "present",
      payload: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      },
    });
    configureHospitalsQuery({ data: null, error: null });
    mod = await import("@/lib/auth/context");
    nonActiveResults.push(await mod.resolveActiveContext());

    vi.clearAllMocks();
    mocks.readContextCookie.mockResolvedValue({
      status: "present",
      payload: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      },
    });
    configureHospitalsQuery({
      data: null,
      error: { message: "falha interna do banco" },
    });
    nonActiveResults.push(await mod.resolveActiveContext());

    for (const result of nonActiveResults) {
      expect(result).not.toHaveProperty("context");
    }
  });
});

describe("seguranca estatica de context.ts", () => {
  it("nao usa service role, storage do navegador nem log de dados sensiveis", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/lib/auth/context.ts"),
      "utf8",
    );
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    expect(code).not.toMatch(/service[_-]?role/i);
    expect(code).not.toMatch(/localStorage/);
    expect(code).not.toMatch(/sessionStorage/);
    expect(code).not.toMatch(/console\./);
    // Exatamente dois pontos de cliente Supabase (inventario + validacao),
    // sem cliente extra introduzido nesta etapa.
    expect(code.match(/createClient\(/g)?.length ?? 0).toBe(2);
  });
});
