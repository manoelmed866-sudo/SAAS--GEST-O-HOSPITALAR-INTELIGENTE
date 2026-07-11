"use client";

import Link from "next/link";

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <section className="state-page" aria-labelledby="state-title">
      <section className="state-panel" aria-labelledby="state-title">
        <h1 id="state-title">{title}</h1>
        <p>{message}</p>
        <div className="state-actions">
          {onRetry ? (
            <button className="button" type="button" onClick={onRetry}>
              Tentar novamente
            </button>
          ) : null}
          <Link className="button button--secondary" href="/">
            Voltar ao inicio
          </Link>
        </div>
      </section>
    </section>
  );
}
