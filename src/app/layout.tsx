import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPublicConfig } from "@/config/public-config";
import "./globals.css";

const publicConfig = getPublicConfig();

export const metadata: Metadata = {
  title: publicConfig.appName,
  description:
    "Fundacao tecnica local da Plataforma de Inteligencia Hospitalar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo-principal">
          Pular para o conteudo principal
        </a>
        <div className="site-shell">
          <SiteHeader appName={publicConfig.appName} />
          <main className="main-content" id="conteudo-principal">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
