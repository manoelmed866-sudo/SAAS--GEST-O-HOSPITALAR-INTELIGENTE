import { render, screen, within } from "@testing-library/react";
import { SiteHeader } from "@/components/layout/SiteHeader";

describe("SiteHeader", () => {
  it("exibe a identificacao da plataforma", () => {
    render(<SiteHeader appName="Plataforma de Inteligencia Hospitalar" />);

    expect(
      screen.getByText("Plataforma de Inteligencia Hospitalar"),
    ).toBeInTheDocument();
  });

  it("usa navegacao semantica com links acessiveis", () => {
    render(<SiteHeader appName="Plataforma de Inteligencia Hospitalar" />);

    const nav = screen.getByRole("navigation", {
      name: /navegacao principal/i,
    });

    expect(
      within(nav).getByRole("link", { name: /^inicio$/i }),
    ).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: /^sobre$/i })).toHaveAttribute(
      "href",
      "#sobre",
    );
  });
});
