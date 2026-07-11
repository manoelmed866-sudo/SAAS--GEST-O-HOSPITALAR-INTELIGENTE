"use client";

import { ErrorState } from "@/components/ui/ErrorState";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <ErrorState
      title="Nao foi possivel carregar esta area"
      message="Tente novamente ou retorne ao inicio da plataforma."
      onRetry={reset}
    />
  );
}
