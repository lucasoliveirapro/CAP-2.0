import { useJustificativaValidation } from "./useJustificativaValidation";
import { JustificativaInfoBox } from "./JustificativaInfoBox";
import { CurrentVersionForm } from "./CurrentVersionForm";
import { HistoryTable } from "./HistoryTable";
import { CauseEffectGraph } from "./CauseEffectGraph";
import "./CapValidacao.css";

export { StatusBadge } from "./StatusBadge";
export { FilterComboBox } from "./FilterComboBox";
export const clearFilterIconUrl = "/assets/clear-filter-Cilhv_XL.png";

const LoadingMessage = () => (
  <div className="message-container message-loading">
    <div className="loading-spinner" />
    <p>Carregando justificativa...</p>
  </div>
);

const STATUS_FINALIZADA_ID = 2;

export const ValidationPage = ({ id, onUpdated }) => {
  const validation = useJustificativaValidation(id, onUpdated);

  if (validation.pageLoading) return <LoadingMessage />;

  const latestHistory = validation.justificativa.historico?.[0] ?? {};
  const isFinalized = validation.justificativa.status?.id == STATUS_FINALIZADA_ID;

  return (
    <div className="validation-container">
      <h2 className="validation-title">Validação da Justificativa</h2>
      <JustificativaInfoBox
        justificativa={validation.justificativa}
        latestHistory={latestHistory}
        editableData={validation.editableData}
        handleChange={validation.handleChange}
        isFinalized={isFinalized}
      />
      <div className="validation-content">
        <div className="validation-content-left">
          <CurrentVersionForm
            justificativa={validation.justificativa}
            maquinasOptions={validation.maquinasOptions}
            validated={validation.validated}
            setValidated={validation.setValidated}
            editableData={validation.editableData}
            handleChange={validation.handleChange}
            handleSubmit={validation.handleSubmit}
            isFormValid={validation.isFormValid}
            loading={validation.actionLoading}
            error={validation.error}
            isFinalized={isFinalized}
          />
        </div>
        <div className="validation-content-right">
          <CauseEffectGraph justificativa={validation.justificativa} />
        </div>
      </div>
      <HistoryTable historico={validation.justificativa.historico ?? []} />
    </div>
  );
};

export default ValidationPage;
