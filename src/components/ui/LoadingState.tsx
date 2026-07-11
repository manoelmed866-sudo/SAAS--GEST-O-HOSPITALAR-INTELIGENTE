export function LoadingState() {
  return (
    <div className="state-page" role="status" aria-live="polite">
      <div className="state-panel">
        <div className="loading-indicator">
          <span className="loading-dot" aria-hidden="true" />
          <span>Carregando a fundacao tecnica da plataforma.</span>
        </div>
      </div>
    </div>
  );
}
