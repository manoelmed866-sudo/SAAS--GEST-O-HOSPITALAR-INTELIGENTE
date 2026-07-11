import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    render(<GlobalError error={new Error("falha global")} reset={vi.fn()} />);

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        name: /a aplicacao encontrou uma instabilidade/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/falha global/i)).not.toBeInTheDocument();
  });
});
