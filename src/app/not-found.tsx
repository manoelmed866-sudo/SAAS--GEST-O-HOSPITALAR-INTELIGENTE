import { ErrorState } from "@/components/ui/ErrorState";

export default function NotFound() {
  return (
    <ErrorState
      title="Pagina nao encontrada"
      message="O endereco acessado nao corresponde a uma area disponivel nesta fundacao tecnica."
    />
  );
}
