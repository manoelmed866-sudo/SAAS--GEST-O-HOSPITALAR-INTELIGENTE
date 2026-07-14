import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  changeMembershipStatusAction: vi.fn(),
}));

// Mock apenas useActionState de "react", preservando o restante (jsx-runtime,
// hooks e act continuam vindos do modulo real), no mesmo padrao do
// context-selector-form. A action e mockada para nao importar dependencias de
// servidor.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return { ...actual, useActionState: mocks.useActionState };
});

vi.mock("@/app/(protected)/painel/admin/equipe/actions", () => ({
  changeMembershipStatusAction: mocks.changeMembershipStatusAction,
}));

const MANAGEMENT_REF = "0123456789abcdef0123456789abcdef";

function setActionState(
  state: { status: string; message?: string },
  isPending = false,
) {
  mocks.useActionState.mockReturnValue([state, vi.fn(), isPending]);
}

async function importControls() {
  const mod = await import(
    "@/app/(protected)/painel/admin/equipe/team-member-controls"
  );

  return mod.TeamMemberControls;
}

describe("TeamMemberControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActionState({ status: "idle" });
  });

  it("canSuspend: mostra somente Suspender vinculo, sem controles proibidos", async () => {
    const TeamMemberControls = await importControls();

    render(
      <TeamMemberControls
        canReactivate={false}
        canSuspend={true}
        managementRef={MANAGEMENT_REF}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Suspender vínculo" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reativar vínculo" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /excluir|remover|revogar|papel|convidar/i }),
    ).not.toBeInTheDocument();
    // Nenhum formulario e enviado antes da confirmacao explicita.
    expect(document.querySelector("form")).toBeNull();
  });

  it("canReactivate: mostra somente Reativar vinculo", async () => {
    const TeamMemberControls = await importControls();

    render(
      <TeamMemberControls
        canReactivate={true}
        canSuspend={false}
        managementRef={MANAGEMENT_REF}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Reativar vínculo" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Suspender vínculo" }),
    ).not.toBeInTheDocument();
  });

  it("exige confirmacao explicita: o form so aparece apos o clique inicial", async () => {
    const user = userEvent.setup();
    const TeamMemberControls = await importControls();

    render(
      <TeamMemberControls
        canReactivate={false}
        canSuspend={true}
        managementRef={MANAGEMENT_REF}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Suspender vínculo" }));

    expect(
      screen.getByRole("button", { name: "Confirmar suspensão" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();

    // O formulario transporta somente a referencia opaca e o estado pedido.
    const hidden = Array.from(
      document.querySelectorAll('input[type="hidden"]'),
    ).map((el) => [el.getAttribute("name"), el.getAttribute("value")]);
    expect(hidden).toEqual([
      ["managementRef", MANAGEMENT_REF],
      ["requestedStatus", "suspended"],
    ]);
    expect(document.querySelector('input[name="hospitalId"]')).toBeNull();
    expect(document.querySelector('input[name="organizationId"]')).toBeNull();
  });

  it("cancelar volta ao estado inicial sem enviar", async () => {
    const user = userEvent.setup();
    const TeamMemberControls = await importControls();

    render(
      <TeamMemberControls
        canReactivate={true}
        canSuspend={false}
        managementRef={MANAGEMENT_REF}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reativar vínculo" }));
    expect(
      screen.getByRole("button", { name: "Confirmar reativação" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.getByRole("button", { name: "Reativar vínculo" }),
    ).toBeInTheDocument();
    expect(document.querySelector("form")).toBeNull();
  });

  it("confirmacao de reativacao envia requestedStatus active", async () => {
    const user = userEvent.setup();
    const TeamMemberControls = await importControls();

    render(
      <TeamMemberControls
        canReactivate={true}
        canSuspend={false}
        managementRef={MANAGEMENT_REF}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reativar vínculo" }));

    expect(
      document.querySelector('input[name="requestedStatus"]'),
    ).toHaveAttribute("value", "active");
  });

  it("exibe mensagem de sucesso e de bloqueio vindas do estado da action", async () => {
    setActionState({
      status: "success",
      message: "Vínculo suspenso com sucesso.",
    });
    const TeamMemberControls = await importControls();

    const { unmount } = render(
      <TeamMemberControls
        canReactivate={false}
        canSuspend={true}
        managementRef={MANAGEMENT_REF}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Vínculo suspenso com sucesso.",
    );
    unmount();

    setActionState({
      status: "blocked",
      message:
        "Não é possível suspender o último administrador ativo do hospital.",
    });
    render(
      <TeamMemberControls
        canReactivate={false}
        canSuspend={true}
        managementRef={MANAGEMENT_REF}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      /último administrador ativo/,
    );
  });

  it("botoes ficam desabilitados enquanto a mutacao esta pendente", async () => {
    setActionState({ status: "idle" }, true);
    const TeamMemberControls = await importControls();

    render(
      <TeamMemberControls
        canReactivate={false}
        canSuspend={true}
        managementRef={MANAGEMENT_REF}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Suspender vínculo" }),
    ).toBeDisabled();
  });
});
