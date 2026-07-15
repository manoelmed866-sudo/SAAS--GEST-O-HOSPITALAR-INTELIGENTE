import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  changeMembershipRoleAction: vi.fn(),
}));

// Sprint 04 (fechamento) - controles cliente de papeis hospitalares. Mock
// apenas de useActionState (mesmo padrao dos demais componentes cliente); a
// action e mockada para nao importar dependencias de servidor.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return { ...actual, useActionState: mocks.useActionState };
});

vi.mock("@/app/(protected)/painel/admin/equipe/actions", () => ({
  changeMembershipStatusAction: vi.fn(),
  changeMembershipRoleAction: mocks.changeMembershipRoleAction,
}));

const MEMBERSHIP_REF = "0123456789abcdef0123456789abcdef";
const ROLE_REF_MEMBER = "bbbb0000000000000000000000000001";
const ROLE_REF_AUDITOR = "bbbb0000000000000000000000000002";
const ROLE_REF_ADMIN = "bbbb0000000000000000000000000003";

const ASSIGNABLE = [
  { label: "Administrador hospitalar", roleRef: ROLE_REF_ADMIN },
  { label: "Auditor hospitalar", roleRef: ROLE_REF_AUDITOR },
  { label: "Membro hospitalar", roleRef: ROLE_REF_MEMBER },
];

function setActionState(
  state: { status: string; message?: string },
  isPending = false,
) {
  mocks.useActionState.mockReturnValue([state, vi.fn(), isPending]);
}

async function importControls() {
  const mod = await import(
    "@/app/(protected)/painel/admin/equipe/team-role-controls"
  );

  return mod.TeamRoleControls;
}

describe("TeamRoleControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActionState({ status: "idle" });
  });

  it("revogacao apenas para papeis com canRevoke; catalogo exclui papeis ja ativos", async () => {
    const TeamRoleControls = await importControls();

    render(
      <TeamRoleControls
        assignableRoles={ASSIGNABLE}
        assignedRoles={[
          { label: "Membro hospitalar", roleRef: ROLE_REF_MEMBER, canRevoke: true },
          {
            label: "Administrador hospitalar",
            roleRef: ROLE_REF_ADMIN,
            canRevoke: false,
          },
        ]}
        membershipRef={MEMBERSHIP_REF}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Revogar papel: Membro hospitalar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Revogar papel: Administrador hospitalar",
      }),
    ).not.toBeInTheDocument();
    // O select oferece somente papeis ainda nao ativos (Auditor hospitalar).
    const options = screen
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toContain("Auditor hospitalar");
    expect(options).not.toContain("Membro hospitalar");
    expect(options).not.toContain("Administrador hospitalar");
    // Nenhum formulario antes da confirmacao explicita.
    expect(document.querySelector("form")).toBeNull();
    // Nenhuma referencia opaca visivel como texto.
    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toContain(MEMBERSHIP_REF);
    expect(bodyText).not.toContain(ROLE_REF_MEMBER);
  });

  it("atribuir exige selecao e confirmacao; o form envia somente refs e acao", async () => {
    const user = userEvent.setup();
    const TeamRoleControls = await importControls();

    render(
      <TeamRoleControls
        assignableRoles={ASSIGNABLE}
        assignedRoles={[]}
        membershipRef={MEMBERSHIP_REF}
      />,
    );

    // Sem selecao, o botao de atribuir fica desabilitado.
    const assignButton = screen.getByRole("button", { name: "Atribuir papel" });
    expect(assignButton).toBeDisabled();

    await user.selectOptions(screen.getByRole("combobox"), ROLE_REF_AUDITOR);
    expect(assignButton).toBeEnabled();
    await user.click(assignButton);

    // Confirmacao explicita antes do envio.
    expect(
      screen.getByRole("button", {
        name: "Confirmar atribuição: Auditor hospitalar",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();

    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    const formData = new FormData(form as HTMLFormElement);
    expect([...formData.keys()].sort()).toEqual([
      "membershipRef",
      "requestedAction",
      "roleRef",
    ]);
    expect(formData.get("membershipRef")).toBe(MEMBERSHIP_REF);
    expect(formData.get("roleRef")).toBe(ROLE_REF_AUDITOR);
    expect(formData.get("requestedAction")).toBe("assign");
    expect(formData.get("hospitalId")).toBeNull();
    expect(formData.get("organizationId")).toBeNull();
  });

  it("revogar abre confirmacao com requestedAction=revoke", async () => {
    const user = userEvent.setup();
    const TeamRoleControls = await importControls();

    render(
      <TeamRoleControls
        assignableRoles={ASSIGNABLE}
        assignedRoles={[
          { label: "Membro hospitalar", roleRef: ROLE_REF_MEMBER, canRevoke: true },
        ]}
        membershipRef={MEMBERSHIP_REF}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Revogar papel: Membro hospitalar" }),
    );

    expect(
      screen.getByRole("button", {
        name: "Confirmar revogação: Membro hospitalar",
      }),
    ).toBeInTheDocument();
    const formData = new FormData(
      document.querySelector("form") as HTMLFormElement,
    );
    expect(formData.get("roleRef")).toBe(ROLE_REF_MEMBER);
    expect(formData.get("requestedAction")).toBe("revoke");
  });

  it("cancelar fecha a confirmacao sem submeter", async () => {
    const user = userEvent.setup();
    const TeamRoleControls = await importControls();

    render(
      <TeamRoleControls
        assignableRoles={ASSIGNABLE}
        assignedRoles={[
          { label: "Membro hospitalar", roleRef: ROLE_REF_MEMBER, canRevoke: true },
        ]}
        membershipRef={MEMBERSHIP_REF}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Revogar papel: Membro hospitalar" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(document.querySelector("form")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Revogar papel: Membro hospitalar" }),
    ).toBeInTheDocument();
  });

  it("exibe mensagem de resultado com aria-live e desabilita durante pendencia", async () => {
    setActionState({ status: "success", message: "Papel atribuído com sucesso." }, true);
    const TeamRoleControls = await importControls();

    render(
      <TeamRoleControls
        assignableRoles={ASSIGNABLE}
        assignedRoles={[
          { label: "Membro hospitalar", roleRef: ROLE_REF_MEMBER, canRevoke: true },
        ]}
        membershipRef={MEMBERSHIP_REF}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Papel atribuído com sucesso.",
    );
    expect(
      screen.getByRole("button", { name: "Revogar papel: Membro hospitalar" }),
    ).toBeDisabled();
  });

  it("sem papeis revogaveis e sem catalogo disponivel, nenhum controle aparece", async () => {
    const TeamRoleControls = await importControls();

    render(
      <TeamRoleControls
        assignableRoles={[
          { label: "Membro hospitalar", roleRef: ROLE_REF_MEMBER },
        ]}
        assignedRoles={[
          { label: "Membro hospitalar", roleRef: ROLE_REF_MEMBER, canRevoke: false },
        ]}
        membershipRef={MEMBERSHIP_REF}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
