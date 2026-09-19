import { useCap } from "./CapProvider";

export const CapTabs = () => {
  const { uiState } = useCap();
  const { activeTab, showJustifyTab, setActiveTab, openJustifyTab } = uiState;

  return (
    <div className="cap__tabs">
      <button className={`cap__tab ${activeTab === "lancamentos" ? "active" : ""}`} onClick={() => setActiveTab("lancamentos")}>
        Histórico de Lançamentos
      </button>
      {showJustifyTab && (
        <button className={`cap__tab ${activeTab === "justificar" ? "active" : ""}`} onClick={openJustifyTab}>
          Adicionar Justificativa
        </button>
      )}
    </div>
  );
};
