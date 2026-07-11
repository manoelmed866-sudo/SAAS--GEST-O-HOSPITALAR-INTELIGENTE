import { parsePublicEnv } from "@/lib/validation/public-env";

describe("parsePublicEnv", () => {
  it("aceita valores publicos validos", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_APP_NAME: "Hospital Demo",
        NEXT_PUBLIC_APP_ENV: "test",
      }),
    ).toEqual({
      NEXT_PUBLIC_APP_NAME: "Hospital Demo",
      NEXT_PUBLIC_APP_ENV: "test",
    });
  });

  it("aplica valores padrao seguros", () => {
    expect(parsePublicEnv({})).toEqual({
      NEXT_PUBLIC_APP_NAME: "Plataforma de Inteligencia Hospitalar",
      NEXT_PUBLIC_APP_ENV: "development",
    });
  });

  it("rejeita ambiente invalido", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_APP_ENV: "homologation",
      }),
    ).toThrow();
  });
});
