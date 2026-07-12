import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import { ErrorState } from "@/components/ui/ErrorState";

describe("ErrorPage", () => {
  it("mostra mensagem generica e executa reset", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();

    render(<ErrorPage error={new Error("falha interna")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: /nao foi possivel carregar esta area/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/falha interna/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("ErrorState nao renderiza landmark main", () => {
    render(
      <ErrorState
        title="Estado neutro"
        message="Mensagem estrutural sem landmark principal."
      />,
    );

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /estado neutro/i }),
    ).toBeInTheDocument();
  });

  it("global-error possui exatamente um landmark main", () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error("falha global")} reset={vi.fn()} />,
    );
    const document = new DOMParser().parseFromString(markup, "text/html");

    expect(document.documentElement.lang).toBe("pt-BR");
    expect(document.body).not.toBeNull();
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(
      document.body.textContent,
    ).toContain("A aplicacao encontrou uma instabilidade");
    expect(document.body.textContent).not.toContain("falha global");
  });
});
