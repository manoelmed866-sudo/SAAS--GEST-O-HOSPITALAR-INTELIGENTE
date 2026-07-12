import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { requirePortalAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const access = await requirePortalAccess();

  return (
    <section className="section" aria-labelledby="panel-title">
      <div className="site-container">
        <div className="foundation-panel">
          <p className="eyebrow">Area protegida</p>
          <h1 id="panel-title">Painel inicial</h1>
          <p>
            Bem-vindo, {access.displayName}. Seu acesso institucional ativo foi
            validado para entrada no painel.
          </p>
          <p>
            Esta sprint ainda nao cria contexto ativo de hospital, modulos
            clinicos, APIs de dominio ou dados assistenciais.
          </p>

          <div className="state-actions">
            <Link
              className="button button--secondary"
              href="/painel/selecionar-contexto"
            >
              Selecionar hospital
            </Link>
            <form action={logoutAction}>
              <button className="button" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
