import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPublicConfig } from "@/config/public-config";

const plannedCapabilities = [
  "Gestao clinica",
  "Protocolos",
  "Exames e diagnostico",
  "Medicamentos e insumos",
  "Operacao hospitalar",
  "Indicadores e governanca",
];

const productPrinciples = [
  {
    title: "Decisao profissional preservada",
    text: "A plataforma organiza informacoes e orientacoes institucionais sem assumir condutas autonomas.",
  },
  {
    title: "Dados ficticios no desenvolvimento",
    text: "Esta fundacao tecnica nao utiliza dados reais de pacientes, profissionais ou instituicoes.",
  },
  {
    title: "Expansao planejada",
    text: "A estrutura inicial deve permitir crescimento futuro sem antecipar modulos hospitalares.",
  },
];

export default function HomePage() {
  const publicConfig = getPublicConfig();

  return (
    <>
      <section className="hero">
        <div className="site-container hero-grid">
          <div>
            <p className="eyebrow">Sprint 01: fundacao tecnica</p>
            <h1>{publicConfig.appName}</h1>
            <p className="hero-copy">
              Aplicacao local em construcao para sustentar, nas proximas
              sprints, uma plataforma institucional de inteligencia hospitalar.
            </p>
          </div>

          <aside className="foundation-panel" aria-labelledby="status-title">
            <StatusBadge>Fundacao tecnica</StatusBadge>
            <h2 id="status-title">Estado atual</h2>
            <p>
              A base local esta sendo preparada com Next.js, TypeScript,
              Tailwind CSS, validacao estrutural e testes automatizados.
            </p>
          </aside>
        </div>
      </section>

      <section className="section" id="sobre">
        <div className="site-container">
          <SectionHeading title="Finalidade geral">
            A plataforma devera apoiar a organizacao assistencial, operacional e
            gerencial de hospitais, respeitando a Visao Funcional Completa
            documentada na Sprint 00.
          </SectionHeading>

          <div className="principles-grid">
            {productPrinciples.map((principle) => (
              <article className="info-card" key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="planned-title">
        <div className="site-container">
          <SectionHeading id="planned-title" title="Capacidades planejadas">
            Os itens abaixo pertencem ao desenho funcional do produto, mas nao
            estao disponiveis nesta sprint.
          </SectionHeading>

          <ul className="planned-list" aria-labelledby="planned-title">
            {plannedCapabilities.map((capability) => (
              <li className="planned-item" key={capability}>
                {capability}
              </li>
            ))}
          </ul>

          <p className="notice">
            Nenhum modulo hospitalar foi implementado nesta etapa. Nao ha
            pacientes, episodios, protocolos, exames, estoque, banco de dados,
            APIs clinicas, autenticacao ou dados reais.
          </p>
        </div>
      </section>
    </>
  );
}
