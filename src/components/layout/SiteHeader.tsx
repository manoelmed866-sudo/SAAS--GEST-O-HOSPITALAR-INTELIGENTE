import Link from "next/link";

type SiteHeaderProps = {
  appName: string;
};

export function SiteHeader({ appName }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-container site-header__content">
        <Link className="brand" href="/">
          <span className="brand__mark" aria-hidden="true">
            PI
          </span>
          <span>{appName}</span>
        </Link>

        <nav aria-label="Navegacao principal">
          <ul className="nav-list">
            <li>
              <Link className="nav-link" href="/">
                Inicio
              </Link>
            </li>
            <li>
              <a className="nav-link" href="#sobre">
                Sobre
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
