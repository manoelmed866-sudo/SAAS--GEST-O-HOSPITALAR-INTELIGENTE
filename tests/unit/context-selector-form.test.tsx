import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
}));

// Mock apenas useActionState de "react", preservando o restante (jsx-runtime,
// hooks e act continuam vindos do modulo real). O escopo do vi.mock e por
// arquivo, portanto nao afeta outras suites.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return { ...actual, useActionState: mocks.useActionState };
});

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

function setActionState(
  state: { status: string; message?: string },
  isPending = false,
) {
  mocks.useActionState.mockReturnValue([state, vi.fn(), isPending]);
}

async function importForm() {
  const mod = await import(
    "@/app/(protected)/painel/selecionar-contexto/context-selector-form"
  );

  return mod.ContextSelectorForm;
}

describe("ContextSelectorForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActionState({ status: "idle" });
  });

  it("um hospital: exibe nome e codigo, radio desmarcado e botao presente", async () => {
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm hospitals={[HOSPITAL_1]} organizations={[]} />,
    );

    expect(screen.getByText("Hospital Alfa")).toBeInTheDocument();
    expect(screen.getByText("HOSP-A")).toBeInTheDocument();
    expect(screen.getByRole("radio")).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: /confirmar seleção/i }),
    ).toBeInTheDocument();
  });

  it("varios hospitais: todos aparecem com name compartilhado e values corretos", async () => {
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm
        hospitals={[HOSPITAL_1, HOSPITAL_2, HOSPITAL_3]}
        organizations={[ORGANIZATION_1]}
      />,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("name", "contextSelection");
    });
    expect(radios[0]).toHaveAttribute("value", `${ORG_1}:${HOSP_1}`);
    expect(radios[1]).toHaveAttribute("value", `${ORG_1}:${HOSP_2}`);
    expect(radios[2]).toHaveAttribute("value", `${ORG_2}:${HOSP_3}`);
  });

  it("organizacao correspondente: nome da organizacao aparece", async () => {
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm
        hospitals={[HOSPITAL_1]}
        organizations={[ORGANIZATION_1]}
      />,
    );

    expect(screen.getByText("Instituicao Um")).toBeInTheDocument();
  });

  it("hospital-only com organizations vazio: hospital aparece e nenhum id vira texto", async () => {
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm hospitals={[HOSPITAL_1]} organizations={[]} />,
    );

    expect(screen.getByText("Hospital Alfa")).toBeInTheDocument();
    expect(screen.queryByText(ORG_1)).not.toBeInTheDocument();
    expect(screen.queryByText(/instituicao/i)).not.toBeInTheDocument();
  });

  it("organizacao sem correspondencia: hospital aparece e organizationId nao aparece", async () => {
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm
        hospitals={[HOSPITAL_3]}
        organizations={[ORGANIZATION_1]}
      />,
    );

    expect(screen.getByText("Hospital Gama")).toBeInTheDocument();
    expect(screen.queryByText(ORG_2)).not.toBeInTheDocument();
  });

  it("selecao explicita: usuario marca um radio e somente um fica selecionado", async () => {
    const user = userEvent.setup();
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm
        hospitals={[HOSPITAL_1, HOSPITAL_2]}
        organizations={[ORGANIZATION_1]}
      />,
    );

    const radios = screen.getAllByRole("radio");
    await user.click(radios[0]);
    expect(radios[0]).toBeChecked();

    await user.click(radios[1]);
    expect(radios[1]).toBeChecked();
    expect(radios[0]).not.toBeChecked();
  });

  it("nenhuma selecao automatica: com um unico hospital o radio comeca desmarcado", async () => {
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm hospitals={[HOSPITAL_1]} organizations={[]} />,
    );

    expect(screen.getByRole("radio")).not.toBeChecked();
  });

  it("estado invalid: mensagem da action aparece com role status", async () => {
    setActionState({
      status: "invalid",
      message: "Este hospital não está disponível para o seu acesso.",
    });
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm hospitals={[HOSPITAL_1]} organizations={[]} />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "Este hospital não está disponível para o seu acesso.",
    );
  });

  it("estado error: mensagem da action aparece sem modificacao", async () => {
    setActionState({
      status: "error",
      message: "Não foi possível concluir a seleção agora. Tente novamente.",
    });
    const ContextSelectorForm = await importForm();

    render(
      <ContextSelectorForm hospitals={[HOSPITAL_1]} organizations={[]} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Não foi possível concluir a seleção agora. Tente novamente.",
    );
  });

  it("estado pending: botao e fieldset desabilitados com texto Confirmando", async () => {
    setActionState({ status: "idle" }, true);
    const ContextSelectorForm = await importForm();

    const { container } = render(
      <ContextSelectorForm hospitals={[HOSPITAL_1]} organizations={[]} />,
    );

    const button = screen.getByRole("button", { name: /confirmando/i });
    expect(button).toBeDisabled();
    expect(container.querySelector("fieldset")).toBeDisabled();
  });

  it("seguranca estatica: sem Supabase, storage, fetch, redirect ou id como texto", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/app/(protected)/painel/selecionar-contexto/context-selector-form.tsx",
      ),
      "utf8",
    );
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    expect(code).not.toMatch(/@\/lib\/supabase/);
    expect(code).not.toMatch(/createClient/);
    expect(code).not.toMatch(/service[_-]?role/i);
    expect(code).not.toMatch(/localStorage/);
    expect(code).not.toMatch(/sessionStorage/);
    expect(code).not.toMatch(/\bfetch\b/);
    expect(code).not.toMatch(/redirect/);
    // organizationId nunca e usado como texto alternativo (fallback) nem como
    // filho JSX; so aparece dentro do value do radio.
    expect(code).not.toMatch(/organizationName\s*\?\?/);
    expect(code).not.toMatch(/\{[^}]*\.organizationId\s*\}\s*</);
  });
});
