import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

export default function AccessDeniedPage() {
  return (
    <section className="state-page" aria-labelledby="access-denied-title">
      <div className="state-panel">
        <p className="eyebrow">Acesso nao autorizado</p>
        <h1 id="access-denied-title">Acesso negado</h1>
        <p>
          Sua conta foi autenticada, mas ainda nao possui um vinculo ativo
          autorizado para acessar esta area.
        </p>

        <div className="state-actions">
          <Link className="button button--secondary" href="/">
            Voltar ao inicio
          </Link>
          <form action={logoutAction}>
            <button className="button" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
