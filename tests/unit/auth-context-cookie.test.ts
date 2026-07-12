import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mocks = vi.hoisted(() => {
  const cookieStore = {
    get: vi.fn<(name: string) => { name: string; value: string } | undefined>(
      () => undefined,
    ),
    set: vi.fn(),
  };

  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore),
  };
});

export {};

const VALID_ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const VALID_HOSPITAL_ID = "22222222-2222-4222-8222-222222222222";
const COOKIE_NAME = "ghi_active_context";

function setStoredCookie(value: string): void {
  mocks.cookieStore.get.mockReturnValue({ name: COOKIE_NAME, value });
}

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

describe("cookie de contexto institucional ativo", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mocks.cookieStore.get.mockReturnValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("retorna absent quando o cookie nao existe", async () => {
    const { readContextCookie } = await import("@/lib/auth/context-cookie");

    const result = await readContextCookie();

    expect(result).toEqual({ status: "absent" });
  });

  it("retorna absent quando o cookie existe mas esta vazio", async () => {
    setStoredCookie("");
    const { readContextCookie } = await import("@/lib/auth/context-cookie");

    const result = await readContextCookie();

    expect(result).toEqual({ status: "absent" });
  });

  it("retorna present com o payload de um cookie valido", async () => {
    setStoredCookie(
      JSON.stringify({
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      }),
    );
    const { readContextCookie } = await import("@/lib/auth/context-cookie");

    const result = await readContextCookie();

    expect(result).toEqual({
      status: "present",
      payload: {
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      },
    });
  });

  it("retorna malformed quando o JSON e invalido", async () => {
    setStoredCookie("isto-nao-e-json");
    const { readContextCookie } = await import("@/lib/auth/context-cookie");

    const result = await readContextCookie();

    expect(result).toEqual({ status: "malformed" });
  });

  it("retorna malformed quando um UUID e invalido", async () => {
    setStoredCookie(
      JSON.stringify({
        organizationId: "nao-e-uuid",
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
      }),
    );
    const { readContextCookie } = await import("@/lib/auth/context-cookie");

    const result = await readContextCookie();

    expect(result).toEqual({ status: "malformed" });
  });

  it("retorna malformed quando a versao e diferente de 1", async () => {
    setStoredCookie(
      JSON.stringify({
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 2,
      }),
    );
    const { readContextCookie } = await import("@/lib/auth/context-cookie");

    const result = await readContextCookie();

    expect(result).toEqual({ status: "malformed" });
  });

  it("retorna malformed quando ha campo extra (strict)", async () => {
    setStoredCookie(
      JSON.stringify({
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: VALID_HOSPITAL_ID,
        v: 1,
        role: "hospital_admin",
      }),
    );
    const { readContextCookie } = await import("@/lib/auth/context-cookie");

    const result = await readContextCookie();

    expect(result).toEqual({ status: "malformed" });
  });

  it("acrescenta a versao internamente ao escrever", async () => {
    const { writeContextCookie } = await import("@/lib/auth/context-cookie");

    await writeContextCookie({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    expect(mocks.cookieStore.set).toHaveBeenCalledTimes(1);
    const [name, value] = mocks.cookieStore.set.mock.calls[0];
    expect(name).toBe(COOKIE_NAME);
    expect(JSON.parse(value as string)).toEqual({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
      v: 1,
    });
  });

  it("nao escreve e lanca erro generico quando organizationId e invalido", async () => {
    const invalidValue = "organizacao-invalida";
    const { writeContextCookie } = await import("@/lib/auth/context-cookie");

    await expect(
      writeContextCookie({
        organizationId: invalidValue,
        hospitalId: VALID_HOSPITAL_ID,
      }),
    ).rejects.toThrow("Selecao de contexto institucional invalida.");

    expect(mocks.cookieStore.set).not.toHaveBeenCalled();
    await expect(
      writeContextCookie({
        organizationId: invalidValue,
        hospitalId: VALID_HOSPITAL_ID,
      }),
    ).rejects.not.toThrow(new RegExp(invalidValue));
  });

  it("nao escreve e lanca erro generico quando hospitalId e invalido", async () => {
    const invalidValue = "hospital-invalido";
    const { writeContextCookie } = await import("@/lib/auth/context-cookie");

    await expect(
      writeContextCookie({
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: invalidValue,
      }),
    ).rejects.toThrow("Selecao de contexto institucional invalida.");

    expect(mocks.cookieStore.set).not.toHaveBeenCalled();
    await expect(
      writeContextCookie({
        organizationId: VALID_ORGANIZATION_ID,
        hospitalId: invalidValue,
      }),
    ).rejects.not.toThrow(new RegExp(invalidValue));
  });

  it("escreve com maxAge de 12 horas", async () => {
    const { writeContextCookie } = await import("@/lib/auth/context-cookie");

    await writeContextCookie({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    const options = mocks.cookieStore.set.mock.calls[0][2] as Record<
      string,
      unknown
    >;
    expect(options.maxAge).toBe(60 * 60 * 12);
  });

  it("escreve com httpOnly e SameSite lax", async () => {
    const { writeContextCookie } = await import("@/lib/auth/context-cookie");

    await writeContextCookie({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    const options = mocks.cookieStore.set.mock.calls[0][2] as Record<
      string,
      unknown
    >;
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
  });

  it("escreve com path /painel", async () => {
    const { writeContextCookie } = await import("@/lib/auth/context-cookie");

    await writeContextCookie({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    const options = mocks.cookieStore.set.mock.calls[0][2] as Record<
      string,
      unknown
    >;
    expect(options.path).toBe("/painel");
  });

  it("marca secure somente em producao", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { writeContextCookie } = await import("@/lib/auth/context-cookie");

    await writeContextCookie({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    const options = mocks.cookieStore.set.mock.calls[0][2] as Record<
      string,
      unknown
    >;
    expect(options.secure).toBe(true);
  });

  it("nao marca secure fora de producao", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { writeContextCookie } = await import("@/lib/auth/context-cookie");

    await writeContextCookie({
      organizationId: VALID_ORGANIZATION_ID,
      hospitalId: VALID_HOSPITAL_ID,
    });

    const options = mocks.cookieStore.set.mock.calls[0][2] as Record<
      string,
      unknown
    >;
    expect(options.secure).toBe(false);
  });

  it("limpa usando o mesmo nome, path /painel e maxAge 0", async () => {
    const { clearContextCookie } = await import("@/lib/auth/context-cookie");

    await clearContextCookie();

    expect(mocks.cookieStore.set).toHaveBeenCalledTimes(1);
    const [name, value, options] = mocks.cookieStore.set.mock.calls[0];
    expect(name).toBe(COOKIE_NAME);
    expect(value).toBe("");
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/painel",
      maxAge: 0,
    });
  });

  it("nao importa Supabase nem armazenamento do navegador (estatico)", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/lib/auth/context-cookie.ts"),
      "utf8",
    );
    // Remove comentarios: a checagem incide sobre o CODIGO real. O modulo pode
    // mencionar Supabase / storage em comentarios explicando a separacao de
    // camadas, mas nao pode importa-los nem usa-los.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    expect(code).not.toMatch(/supabase/i);
    expect(code).not.toMatch(/localStorage/);
    expect(code).not.toMatch(/sessionStorage/);
  });
});
