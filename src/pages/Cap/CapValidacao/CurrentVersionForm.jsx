import { Button } from "../../../components/Button";
import { FilterComboBox } from "./FilterComboBox";
import { CAUSAS_RAIZ, TIPOS_PERDA_CAP, COMPONENTES, MODOS_FALHA, CAUSA_RAIZ_TO_TIPO_PERDA } from "../../../constants/capConstant";

const computeFieldErrors = (editableData, maquinasOptions) => ({
  causaRaiz: !CAUSAS_RAIZ.includes(editableData.causaRaiz),
  tipoPerdaCap: !TIPOS_PERDA_CAP.includes(editableData.tipoPerdaCap),
  maquina: !maquinasOptions.some((item) => item.maquina === editableData.maquina),
  componente: !COMPONENTES.includes(editableData.componente),
  descricao: !MODOS_FALHA.includes(editableData.descricao),
  comentario: editableData.comentario.trim() === "",
});

const formatCausaRaizComTipoPerda = (causaRaiz, fallbackTipoPerda) => {
  if (!causaRaiz) return "-";
  const tipoPerda = CAUSA_RAIZ_TO_TIPO_PERDA[causaRaiz] ?? fallbackTipoPerda;
  return tipoPerda ? `${causaRaiz} (${tipoPerda})` : causaRaiz;
};

const FormGroup = ({ label, required, children }) => (
  <div className="validation-form-group">
    <label className="validation-label">
      {label}
      {required && <span className="required-field">*</span>}
    </label>
    {children}
  </div>
);

const FinalizedMessage = () => (
  <div className="finalized-message">Esta justificativa já foi validada e não pode ser alterada.</div>
);

const ValidationActions = ({ validated, setValidated, isFormValid, handleSubmit, loading, error }) => (
  <>
    <div className="validation-radio-group">
      <label className="radio-label">
        <input type="radio" name="validation" checked={validated === true} onChange={() => setValidated(true)} />
        <span>Aprovar Justificativa</span>
      </label>
      <label className="radio-label">
        <input type="radio" name="validation" checked={validated === false} onChange={() => setValidated(false)} />
        <span>Propor Alteração</span>
      </label>
    </div>
    {validated !== null && (
      <>
        {error && <div className="validation-error-message">{error}</div>}
        <div className="validation-actions">
          <Button variant="primary" onClick={handleSubmit} disabled={!isFormValid} loading={loading}>
            Confirmar {validated ? "Aprovação" : "Alteração"}
          </Button>
        </div>
      </>
    )}
  </>
);

export const CurrentVersionForm = ({
  justificativa,
  maquinasOptions,
  validated,
  setValidated,
  editableData,
  handleChange,
  handleSubmit,
  isFormValid,
  loading,
  error,
  isFinalized,
}) => {
  const isEditingMode = validated === false && !isFinalized;
  const fieldErrors = isEditingMode ? computeFieldErrors(editableData, maquinasOptions) : {};

  return (
    <div className="validation-current">
      <h3 className="validation-section-title">Versão Atual</h3>
      <div className="validation-form">
        <FormGroup label="Causa Raiz">
          {isEditingMode ? (
            <FilterComboBox
              value={editableData.causaRaiz}
              onChange={(value) => handleChange("causaRaiz", value)}
              options={CAUSAS_RAIZ}
              hasError={fieldErrors.causaRaiz}
              placeholder="Selecione a causa raiz..."
            />
          ) : (
            <span className="validation-text">{formatCausaRaizComTipoPerda(editableData.causaRaiz, editableData.tipoPerdaCap)}</span>
          )}
        </FormGroup>

        <FormGroup label="Máquina">
          {isEditingMode ? (
            <FilterComboBox
              value={editableData.maquina}
              onChange={(value) => handleChange("maquina", value)}
              options={maquinasOptions.map((item) => item.maquina)}
              hasError={fieldErrors.maquina}
              placeholder="Digite para filtrar máquinas..."
            />
          ) : (
            <span className="validation-text">{editableData.maquina || "-"}</span>
          )}
        </FormGroup>

        <FormGroup label="Componente">
          {isEditingMode ? (
            <FilterComboBox
              value={editableData.componente}
              onChange={(value) => handleChange("componente", value)}
              options={COMPONENTES}
              hasError={fieldErrors.componente}
              placeholder="Digite para filtrar componentes..."
            />
          ) : (
            <span className="validation-text">{editableData.componente || "-"}</span>
          )}
        </FormGroup>

        <FormGroup label="Modo de Falha">
          {isEditingMode ? (
            <FilterComboBox
              value={editableData.descricao}
              onChange={(value) => handleChange("descricao", value)}
              options={MODOS_FALHA}
              hasError={fieldErrors.descricao}
              placeholder="Selecione o modo de falha..."
            />
          ) : (
            <span className="validation-text">{editableData.descricao || "-"}</span>
          )}
        </FormGroup>

        {isEditingMode && (
          <FormGroup label="Comentário da Alteração" required>
            <textarea
              className={`validation-textarea ${fieldErrors.comentario ? "input-error" : ""}`}
              value={editableData.comentario}
              placeholder="Descreva o motivo da alteração..."
              onChange={(event) => handleChange("comentario", event.target.value)}
              rows={3}
            />
          </FormGroup>
        )}

        {isFinalized && <FinalizedMessage />}
        {!isFinalized && (
          <ValidationActions
            validated={validated}
            setValidated={setValidated}
            isFormValid={isFormValid}
            handleSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};
