import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("mostra mensagem 404 e retorno seguro ao inicio", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: /pagina nao encontrada/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voltar ao inicio/i }),
    ).toHaveAttribute("href", "/");
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});
