import { getLoginPath, getSafeNextPath } from "@/lib/auth/redirects";

describe("redirecionamentos de autenticacao", () => {
  it.each([
    ["/painel", "/painel"],
    ["/painel/agenda?aba=hoje#topo", "/painel/agenda?aba=hoje#topo"],
    ["", "/painel"],
    ["https://externo.local/painel", "/painel"],
    ["//externo.local/painel", "/painel"],
    ["/login", "/painel"],
    ["/acesso-negado", "/painel"],
    ["/painel\\externo", "/painel"],
  ])("normaliza next=%s para %s", (input, expected) => {
    expect(getSafeNextPath(input)).toBe(expected);
  });

  it("cria caminho de login com next codificado e restrito ao painel", () => {
    expect(getLoginPath("/painel")).toBe("/login?next=%2Fpainel");
    expect(getLoginPath("https://externo.local")).toBe(
      "/login?next=%2Fpainel",
    );
  });
});
