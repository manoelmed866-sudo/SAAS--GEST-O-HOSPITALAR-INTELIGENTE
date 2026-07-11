import { render, screen } from "@testing-library/react";
import Loading from "@/app/loading";

describe("Loading", () => {
  it("mostra mensagem acessivel de carregamento", () => {
    render(<Loading />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /carregando a fundacao tecnica da plataforma/i,
    );
  });
});
