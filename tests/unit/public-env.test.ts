import {
  getPublicEnv as getSupabasePublicEnv,
  parsePublicEnv as parseSupabasePublicEnv,
} from "@/lib/env/public";
import { parsePublicEnv as parseAppPublicEnv } from "@/lib/validation/public-env";

describe("parsePublicEnv da aplicacao", () => {
  it("aceita valores publicos validos", () => {
    expect(
      parseAppPublicEnv({
        NEXT_PUBLIC_APP_NAME: "Hospital Demo",
        NEXT_PUBLIC_APP_ENV: "test",
      }),
    ).toEqual({
      NEXT_PUBLIC_APP_NAME: "Hospital Demo",
      NEXT_PUBLIC_APP_ENV: "test",
    });
  });

  it("aplica valores padrao seguros", () => {
    expect(parseAppPublicEnv({})).toEqual({
      NEXT_PUBLIC_APP_NAME: "Plataforma de Inteligencia Hospitalar",
      NEXT_PUBLIC_APP_ENV: "development",
    });
  });

  it("rejeita ambiente invalido", () => {
    expect(() =>
      parseAppPublicEnv({
        NEXT_PUBLIC_APP_ENV: "homologation",
      }),
    ).toThrow();
  });
});

describe("parsePublicEnv do Supabase", () => {
  const validInput = {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-local-key",
  };

  it("aceita URL local valida e chave publicavel nao vazia", () => {
    expect(parseSupabasePublicEnv(validInput)).toEqual(validInput);
  });

  it("aceita URL HTTPS valida", () => {
    expect(
      parseSupabasePublicEnv({
        ...validInput,
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual({
      ...validInput,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });
  });

  it("retorna objeto imutavel", () => {
    const env = parseSupabasePublicEnv(validInput);

    expect(Object.isFrozen(env)).toBe(true);
  });

  it("rejeita URL invalida", () => {
    expect(() =>
      parseSupabasePublicEnv({
        ...validInput,
        NEXT_PUBLIC_SUPABASE_URL: "nao-e-url",
      }),
    ).toThrow(/supabase invalida/i);
  });

  it("rejeita URL ausente", () => {
    expect(() =>
      parseSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          validInput.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejeita chave ausente", () => {
    expect(() =>
      parseSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: validInput.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("rejeita chave vazia", () => {
    expect(() =>
      parseSupabasePublicEnv({
        ...validInput,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "   ",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("rejeita chave sb_secret_", () => {
    expect(() =>
      parseSupabasePublicEnv({
        ...validInput,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_valor_de_teste",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("rejeita valor contendo service_role", () => {
    expect(() =>
      parseSupabasePublicEnv({
        ...validInput,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "valor_service_role_teste",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("erro nao reproduz a chave recebida", () => {
    const receivedValue = "sb_secret_valor_que_nao_deve_aparecer";

    try {
      parseSupabasePublicEnv({
        ...validInput,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: receivedValue,
      });
    } catch (error) {
      expect(String(error)).not.toContain(receivedValue);
    }
  });

  it("le process.env somente quando getPublicEnv e chamada", async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    await expect(import("@/lib/env/public")).resolves.toBeDefined();
    expect(() => getSupabasePublicEnv()).toThrow(/supabase invalida/i);

    process.env.NEXT_PUBLIC_SUPABASE_URL =
      validInput.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      validInput.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(getSupabasePublicEnv()).toEqual(validInput);

    process.env = originalEnv;
  });
});
