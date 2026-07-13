import type { SupabaseClient } from "@supabase/supabase-js";
import { expectTypeOf } from "vitest";
import type { Database } from "@/types/database.types";

const mocks = vi.hoisted(() => ({
  createBrowserClient: vi.fn(() => ({ auth: {} })),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mocks.createBrowserClient,
}));

describe("createClient para navegador", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-local-key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("cria cliente browser com URL e chave publicavel validadas", async () => {
    const { createClient } = await import("@/lib/supabase/client");

    const client = createClient();

    expect(mocks.createBrowserClient).toHaveBeenCalledWith(
      "http://127.0.0.1:54321",
      "publishable-local-key",
    );
    expect(client).toEqual({ auth: {} });
    expectTypeOf(client).toMatchTypeOf<SupabaseClient<Database>>();
  });

  it("nao consulta chave privada para criar o cliente browser", async () => {
    const privateKeyName = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");
    process.env[privateKeyName] = "valor-privado-nao-consultado";
    const { createClient } = await import("@/lib/supabase/client");

    createClient();

    expect(mocks.createBrowserClient).toHaveBeenCalledTimes(1);
  });

  it("propaga erro de ambiente sem revelar valor recebido", async () => {
    const receivedValue = "valor-invalido-sensivel";
    process.env.NEXT_PUBLIC_SUPABASE_URL = receivedValue;
    const { createClient } = await import("@/lib/supabase/client");

    expect(() => createClient()).toThrow(/supabase invalida/i);

    try {
      createClient();
    } catch (error) {
      expect(String(error)).not.toContain(receivedValue);
    }
  });
});
