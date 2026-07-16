import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  createUnitAction: vi.fn(),
  createSectorAction: vi.fn(),
  createBedAction: vi.fn(),
  createResourceAction: vi.fn(),
}));

// Mock apenas useActionState de "react", preservando o restante, no mesmo
// padrao dos demais componentes cliente. As actions sao mockadas para nao
// importar dependencias de servidor.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return { ...actual, useActionState: mocks.useActionState };
});

vi.mock("@/app/(protected)/painel/admin/estrutura/actions", () => ({
  createUnitAction: mocks.createUnitAction,
  createSectorAction: mocks.createSectorAction,
  createBedAction: mocks.createBedAction,
  createResourceAction: mocks.createResourceAction,
  changeStructureStatusAction: vi.fn(),
}));

const UNIT_REF = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1";
const SECTOR_REF = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2";

function setActionState(
  state: { status: string; message?: string },
  isPending = false,
) {
  mocks.useActionState.mockReturnValue([state, vi.fn(), isPending]);
}

async function importForms() {
  return import(
    "@/app/(protected)/painel/admin/estrutura/structure-create-forms"
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setActionState({ status: "idle" });
});

describe("CreateUnitForm", () => {
  it("envia somente code e displayName", async () => {
    const { CreateUnitForm } = await importForms();
    const { container } = render(<CreateUnitForm />);

    const inputs = [...container.querySelectorAll("input, select")];
    const names = inputs.map((input) => input.getAttribute("name"));

    expect(names.sort()).toEqual(["code", "displayName"]);
    expect(
      screen.getByRole("button", { name: "Criar unidade" }),
    ).toBeInTheDocument();
  });

  it("exibe mensagem de resultado quando ha estado", async () => {
    setActionState({ status: "success", message: "Unidade criada com sucesso." });
    const { CreateUnitForm } = await importForms();
    render(<CreateUnitForm />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Unidade criada com sucesso.",
    );
  });

  it("desabilita os controles enquanto pendente", async () => {
    setActionState({ status: "idle" }, true);
    const { CreateUnitForm } = await importForms();
    render(<CreateUnitForm />);

    expect(screen.getByRole("button", { name: "Criar unidade" })).toBeDisabled();
  });
});

describe("CreateSectorForm", () => {
  it("sem unidade ativa orienta a sequencia e nao renderiza formulario", async () => {
    const { CreateSectorForm } = await importForms();
    const { container } = render(<CreateSectorForm unitOptions={[]} />);

    expect(
      screen.getByText("Crie uma unidade ativa antes de cadastrar setores."),
    ).toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
  });

  it("usa a referencia opaca da unidade como valor do select", async () => {
    const { CreateSectorForm } = await importForms();
    const { container } = render(
      <CreateSectorForm
        unitOptions={[{ label: "Unidade Adulto", managementRef: UNIT_REF }]}
      />,
    );

    const option = screen.getByRole("option", { name: "Unidade Adulto" });
    expect(option).toHaveAttribute("value", UNIT_REF);

    const names = [...container.querySelectorAll("input, select")].map(
      (input) => input.getAttribute("name"),
    );
    expect(names.sort()).toEqual(["code", "displayName", "unitRef"]);
    // Nenhum UUID no HTML do formulario.
    expect(container.innerHTML).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });
});

describe("CreateBedForm", () => {
  it("sem setor ativo orienta a sequencia", async () => {
    const { CreateBedForm } = await importForms();
    const { container } = render(<CreateBedForm sectorOptions={[]} />);

    expect(
      screen.getByText("Crie um setor ativo antes de cadastrar leitos."),
    ).toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
  });

  it("envia somente sectorRef, code e displayName", async () => {
    const { CreateBedForm } = await importForms();
    const { container } = render(
      <CreateBedForm
        sectorOptions={[
          {
            label: "Setor Observação (Unidade Adulto)",
            managementRef: SECTOR_REF,
          },
        ]}
      />,
    );

    const names = [...container.querySelectorAll("input, select")].map(
      (input) => input.getAttribute("name"),
    );
    expect(names.sort()).toEqual(["code", "displayName", "sectorRef"]);
  });
});

describe("CreateResourceForm", () => {
  it("envia somente code, displayName e description", async () => {
    const { CreateResourceForm } = await importForms();
    const { container } = render(<CreateResourceForm />);

    const names = [...container.querySelectorAll("input, select")].map(
      (input) => input.getAttribute("name"),
    );
    expect(names.sort()).toEqual(["code", "description", "displayName"]);
    expect(
      screen.getByRole("button", { name: "Criar recurso" }),
    ).toBeInTheDocument();
  });
});
