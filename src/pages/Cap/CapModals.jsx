import { useCap } from "./CapProvider";
import { ValidationPage } from "./CapValidacao";

export const ConfirmHourChangeModal = () => {
  const { uiState, hourSelection } = useCap();
  if (!uiState.showConfirmModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-alert">
          <div className="modal-alert-icon">⚠️</div>
          <div className="modal-alert-text">
            <h3>Atenção!</h3>
            <p>
              Você tem justificativas não salvas.
              <br />
              Se alterar a hora selecionada, elas serão perdidas.
            </p>
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={() => uiState.confirmHourChange(({ hour, index }) => hourSelection.selectHour(hour, index))}>
            OK, mudar hora
          </button>
          <button onClick={uiState.cancelHourChange}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export const ValidationModal = () => {
  const { uiState, refetchLancamentos } = useCap();
  if (!uiState.selectedJustificativaId) return null;

  return (
    <div className="validation-modal-overlay" onMouseDown={uiState.closeValidationModal}>
      <div className="validation-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="validation-modal__close" onClick={uiState.closeValidationModal}>
          ×
        </button>
        <ValidationPage id={uiState.selectedJustificativaId} onUpdated={refetchLancamentos} />
      </div>
    </div>
  );
};
