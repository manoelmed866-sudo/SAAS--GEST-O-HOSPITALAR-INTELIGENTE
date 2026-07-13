import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  requirePortalAccess: vi.fn(),
  getAuthorizedContextInventory: vi.fn(),
  contextSelectorForm: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({
  requirePortalAccess: mocks.requirePortalAccess,
}));

vi.mock("@/lib/auth/context", () => ({
  getAuthorizedContextInventory: mocks.getAuthorizedContextInventory,
}));

vi.mock(
  "@/app/(protected)/painel/selecionar-contexto/context-selector-form",
  () => ({
    ContextSelectorForm: (props: {
      hospitals: { id: string }[];
      organizations: { id: string }[];
    }) => {
      mocks.contextSelectorForm(props);

      return (
        <div
          data-testid="context-selector-form"
          data-hospital-ids={props.hospitals.map((h) => h.id).join(",")}
          data-organization-ids={props.organizations.map((o) => o.id).join(",")}
        />
      );
    },
  }),
);

const ORG_1 = "11111111-1111-4111-8111-111111111111";
const ORG_2 = "22222222-2222-4222-8222-222222222222";
const HOSP_1 = "31111111-1111-4111-8111-111111111111";
const HOSP_2 = "32222222-2222-4222-8222-222222222222";
const HOSP_3 = "33333333-3333-4333-8333-333333333333";

const HOSPITAL_1 = {
  id: HOSP_1,
  organizationId: ORG_1,
  code: "HOSP-A",
  displayName: "Hospital Alfa",
};
const HOSPITAL_2 = {
  id: HOSP_2,
  organizationId: ORG_1,
  code: "HOSP-B",
  displayName: "Hospital Beta",
};
const HOSPITAL_3 = {
  id: HOSP_3,
  organizationId: ORG_2,
  code: "HOSP-C",
  displayName: "Hospital Gama",
};
const ORGANIZATION_1 = {
  id: ORG_1,
  code: "ORG-1",
  displayName: "Instituicao Um",
};

function mockInventory(
  organizations: unknown[],
  hospitals: unknown[],
): void {
  mocks.getAuthorizedContextInventory.mockResolvedValueOnce({
    status: "success",
    inventory: {
      organizations,
      hospitals,
      hospitalCount: hospitals.length,
    },
  });
}

async function importPage() {
  const mod = await import(
    "@/app/(protected)/painel/selecionar-contexto/page"
  );

  return mod.default;
}

describe("pagina de selecao de contexto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePortalAccess.mockResolvedValue({
      status: "allowed",
      userId: "usuario-1",
      displayName: "Dra. Ana",
      accessKind: "hospital",
    });
  });

  it("aplica o gate de acesso antes de carregar o inventario", async () => {
    mockInventory([ORGANIZATION_1], [HOSPITAL_1]);
    const SelectContextPage = await importPage();

    render(await SelectContextPage());

    expect(mocks.requirePortalAccess).toHaveBeenCalledTimes(1);
    expect(mocks.getAuthorizedContextInventory).toHaveBeenCalledTimes(1);
    const gateOrder = mocks.requirePortalAccess.mock.invocationCallOrder[0];
    const inventoryOrder =
      mocks.getAuthorizedContextInventory.mock.invocationCallOrder[0];
    expect(gateOrder).toBeLessThan(inventoryOrder);
  });

  it("um hospital: renderiza titulo e formulario com as listas exatas", async () => {
    mockInventory([ORGANIZATION_1], [HOSPITAL_1]);
    const SelectContextPage = await importPage();

    render(await SelectContextPage());

    expect(
      screen.getByRole("heading", {
        name: /selecione o hospital do seu plantão/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("context-selector-form")).toBeInTheDocument();
    expect(mocks.contextSelectorForm).toHaveBeenCalledTimes(1);
    expect(mocks.contextSelectorForm.mock.calls[0][0]).toEqual({
      hospitals: [HOSPITAL_1],
      organizations: [ORGANIZATION_1],
    });
  });

  it("varios hospitais: repassa todos preservando a ordem", async () => {
    mockInventory([ORGANIZATION_1], [HOSPITAL_1, HOSPITAL_2, HOSPITAL_3]);
    const SelectContextPage = await importPage();

    render(await SelectContextPage());

    expect(screen.getByTestId("context-selector-form")).toHaveAttribute(
      "data-hospital-ids",
      `${HOSP_1},${HOSP_2},${HOSP_3}`,
    );
  });

  it("hospital-only: repassa organizations vazio e mantem o hospital", async () => {
    mockInventory([], [HOSPITAL_1]);
    const SelectContextPage = await importPage();

    render(await SelectContextPage());

    const form = screen.getByTestId("context-selector-form");
    expect(form).toHaveAttribute("data-organization-ids", "");
    expect(form).toHaveAttribute("data-hospital-ids", HOSP_1);
    expect(mocks.contextSelectorForm.mock.calls[0][0].organizations).toEqual(
      [],
    );
  });

  it("inventario vazio: estado seguro sem formulario e sem erro tecnico", async () => {
    mockInventory([], []);
    const SelectContextPage = await importPage();

    render(await SelectContextPage());

    expect(
      screen.getByRole("heading", { name: /nenhum hospital disponível/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voltar ao painel/i }),
    ).toHaveAttribute("href", "/painel");
    expect(screen.queryByTestId("context-selector-form")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: /não foi possível carregar/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("erro tecnico: estado distinto com tentar novamente, sem formulario", async () => {
    mocks.getAuthorizedContextInventory.mockResolvedValueOnce({
      status: "error",
    });
    const SelectContextPage = await importPage();

    render(await SelectContextPage());

    expect(
      screen.getByRole("heading", {
        name: /não foi possível carregar seus hospitais/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /tentar novamente/i }),
    ).toHaveAttribute("href", "/painel/selecionar-contexto");
    expect(screen.queryByTestId("context-selector-form")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /nenhum hospital disponível/i }),
    ).not.toBeInTheDocument();
  });

  it("nao vaza: hospital ausente do inventario e UUID nao aparecem na pagina", async () => {
    mockInventory([ORGANIZATION_1], [HOSPITAL_1]);
    const SelectContextPage = await importPage();

    render(await SelectContextPage());

    expect(screen.queryByText("Hospital Gama")).not.toBeInTheDocument();
    expect(screen.queryByText(HOSP_1)).not.toBeInTheDocument();
    expect(screen.queryByText(ORG_1)).not.toBeInTheDocument();
  });

  it("seguranca estatica: sem Supabase, storage, fetch, redirect ou resolveActiveContext", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/app/(protected)/painel/selecionar-contexto/page.tsx",
      ),
      "utf8",
    );
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    expect(code).not.toMatch(/@\/lib\/supabase\/server/);
    expect(code).not.toMatch(/createClient/);
    expect(code).not.toMatch(/service[_-]?role/i);
    expect(code).not.toMatch(/localStorage/);
    expect(code).not.toMatch(/sessionStorage/);
    expect(code).not.toMatch(/\bfetch\b/);
    expect(code).not.toMatch(/redirect/);
    expect(code).not.toMatch(/resolveActiveContext/);
  });
});
