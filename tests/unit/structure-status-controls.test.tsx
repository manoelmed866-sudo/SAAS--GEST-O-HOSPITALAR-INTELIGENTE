import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  changeStructureStatusAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return { ...actual, useActionState: mocks.useActionState };
});

vi.mock("@/app/(protected)/painel/admin/estrutura/actions", () => ({
  changeStructureStatusAction: mocks.changeStructureStatusAction,
}));

const ITEM_REF = "ccccccccccccccccccccccccccccccc3";

function setActionState(
  state: { status: string; message?: string },
  isPending = false,
) {
  mocks.useActionState.mockReturnValue([state, vi.fn(), isPending]);
}

async function importControls() {
  const mod = await import(
    "@/app/(protected)/painel/admin/estrutura/structure-status-controls"
  );

  return mod.StructureStatusControls;
}

beforeEach(() => {
  vi.clearAllMocks();
  setActionState({ status: "idle" });
});

describe("StructureStatusControls", () => {
  it("item ativo mostra Desativar e exige confirmacao explicita", async () => {
    const user = userEvent.setup();
    const StructureStatusControls = await importControls();
    const { container } = render(
      <StructureStatusControls
        currentStatus="active"
        kind="unit"
        managementRef={ITEM_REF}
      />,
    );

    // Antes da confirmacao nao existe formulario nem campo oculto.
    expect(container.querySelector("form")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Desativar" }));

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    const hidden = [...(form?.querySelectorAll("input[type=hidden]") ?? [])];
    const fields = Object.fromEntries(
      hidden.map((input) => [
        input.getAttribute("name"),
        input.getAttribute("value"),
      ]),
    );
    // FormData minimo: somente o tipo, a referencia opaca e o status.
    expect(fields).toEqual({
      kind: "unit",
      managementRef: ITEM_REF,
      requestedStatus: "inactive",
    });
    expect(
      screen.getByRole("button", { name: "Confirmar desativação" }),
    ).toBeInTheDocument();
  });

  it("item inativo mostra Reativar com requestedStatus=active", async () => {
    const user = userEvent.setup();
    const StructureStatusControls = await importControls();
    const { container } = render(
      <StructureStatusControls
        currentStatus="inactive"
        kind="bed"
        managementRef={ITEM_REF}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reativar" }));

    const form = container.querySelector("form");
    const status = form?.querySelector("input[name=requestedStatus]");
    expect(status).toHaveAttribute("value", "active");
    expect(
      screen.getByRole("button", { name: "Confirmar reativação" }),
    ).toBeInTheDocument();
  });

  it("cancelar volta ao estado inicial sem submeter", async () => {
    const user = userEvent.setup();
    const StructureStatusControls = await importControls();
    const { container } = render(
      <StructureStatusControls
        currentStatus="active"
        kind="resource"
        managementRef={ITEM_REF}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Desativar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(container.querySelector("form")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Desativar" }),
    ).toBeInTheDocument();
  });

  it("exibe a mensagem devolvida pela action", async () => {
    setActionState({ status: "blocked", message: "O item não está mais disponível para esta ação." });
    const StructureStatusControls = await importControls();
    render(
      <StructureStatusControls
        currentStatus="active"
        kind="sector"
        managementRef={ITEM_REF}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "O item não está mais disponível para esta ação.",
    );
  });

  it("desabilita os botoes enquanto pendente", async () => {
    setActionState({ status: "idle" }, true);
    const StructureStatusControls = await importControls();
    render(
      <StructureStatusControls
        currentStatus="active"
        kind="unit"
        managementRef={ITEM_REF}
      />,
    );

    expect(screen.getByRole("button", { name: "Desativar" })).toBeDisabled();
  });
});
