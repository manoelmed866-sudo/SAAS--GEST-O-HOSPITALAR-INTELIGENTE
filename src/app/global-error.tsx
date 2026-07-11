"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="pt-BR">
      <body>
        <main id="conteudo-principal">
          <ErrorState
            title="A aplicacao encontrou uma instabilidade"
            message="A mensagem foi mantida generica para nao expor detalhes tecnicos."
            onRetry={reset}
          />
        </main>
      </body>
    </html>
  );
}
