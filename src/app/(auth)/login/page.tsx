import Link from "next/link";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNextPath = Array.isArray(params?.next) ? params.next[0] : params?.next;
  const nextPath = getSafeNextPath(rawNextPath);

  return (
    <section className="state-page" aria-labelledby="login-title">
      <div className="state-panel">
        <p className="eyebrow">Acesso restrito</p>
        <h1 id="login-title">Entrar na plataforma</h1>
        <p>
          Use uma conta institucional previamente autorizada para acessar o
          painel inicial.
        </p>

        <LoginForm nextPath={nextPath} />

        <div className="state-actions">
          <Link className="button button--secondary" href="/">
            Voltar ao inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
