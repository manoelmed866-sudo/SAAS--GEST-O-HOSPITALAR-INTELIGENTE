import { render, screen, within } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renderiza o titulo principal e o conteudo institucional", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /plataforma de inteligencia hospitalar/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sprint 01: fundacao tecnica/i)).toBeInTheDocument();
    expect(screen.getByText(/visao funcional completa/i)).toBeInTheDocument();
  });

  it("mantem landmarks e conteudo de fundacao tecnica", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("complementary", { name: /estado atual/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/next\.js/i)).toBeInTheDocument();
    expect(screen.getByText(/testes automatizados/i)).toBeInTheDocument();
  });

  it("apresenta capacidades planejadas sem simular funcionalidades disponiveis", () => {
    render(<HomePage />);

    const plannedList = screen.getByRole("list", {
      name: /capacidades planejadas/i,
    });

    expect(within(plannedList).getByText("Gestao clinica")).toBeInTheDocument();
    expect(within(plannedList).getByText("Protocolos")).toBeInTheDocument();
    expect(
      screen.getByText(/nao estao disponiveis nesta sprint/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/pacientes ativos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/taxa de ocupacao/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/alertas criticos/i)).not.toBeInTheDocument();
  });

  it("mantem somente um h1 na pagina inicial", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
