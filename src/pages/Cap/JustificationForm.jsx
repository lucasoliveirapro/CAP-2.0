import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/Button";
import { FilterComboBox } from "./CapValidacao";
import { formatMinutesToHHMMSS } from "../../utils/capUtils";
import { fetchAlarmesDisponiveisParaAlocacao, createJustificativa } from "../../services/cap.http";
import { useMantenedores } from "./useCapData";
import { RelatedLossModal } from "./RelatedLossModal";
import {
  CAUSAS_SEM_COMPONENTE,
  CAUSAS_RAIZ,
  COMPONENTES,
  MODOS_FALHA,
  CAUSA_RAIZ_TO_TIPO_PERDA,
} from "../../constants/capConstant";

const CAUSA_FALTA_ALIMENTACAO = "FALTA ALIMENTAÇÃO (FALTA CARREGAMENTO)";
const CAUSA_FALTA_ABSORCAO = "FALTA ABSORÇÃO (FALTA DESCARREGAMENTO)";
const CAUSA_FALHA_EQUIPAMENTO = "FALHA EQUIPAMENTO ( MICROPARADAS/ QUEBRA)";

const FormDivider = ({ label }) => (
  <div className="cd-divider">
    <span className="cd-divider__label">{label}</span>
  </div>
);

const Chip = ({ label, value }) => (
  <div className="cd-chip">
    <span className="cd-chip__label">{label}</span>
    <span className="cd-chip__value">{value}</span>
  </div>
);

const MantenedorField = ({ form, setForm, mantenedores, hasError }) => (
  <div className="cd-mantenedor">
    <label className="cd-checkbox">
      <input
        type="checkbox"
        checked={form.resolvidoPorMim}
        onChange={(event) => {
          const checked = event.target.checked;
          setForm((current) => ({
            ...current,
            resolvidoPorMim: checked,
            mantenedor: checked ? null : current.mantenedor,
            mantenedorLivre: checked ? "" : current.mantenedorLivre,
          }));
        }}
      />
      <span>Resolvido por mim</span>
    </label>
    {!form.resolvidoPorMim && (
      <div className="cd-mantenedor__search">
        <FilterComboBox
          id="mantenedor"
          label="Mantenedor responsável"
          value={form.mantenedor?.mantenedor ?? ""}
          onChange={(value) => {
            const found = mantenedores.find((item) => item.mantenedor === value);
            setForm((current) => ({ ...current, mantenedor: found ?? null, mantenedorLivre: "" }));
          }}
          options={mantenedores.map((item) => item.mantenedor)}
          hasError={hasError}
        />
        {!form.mantenedor && (
          <input
            type="text"
            className="cd-input-livre"
            placeholder="Não encontrou? Digite o nome manualmente"
            value={form.mantenedorLivre}
            onChange={(event) => setForm((current) => ({ ...current, mantenedorLivre: event.target.value }))}
          />
        )}
      </div>
    )}
  </div>
);

const EMPTY_FORM = {
  causaRaiz: "",
  tipoPerdaCap: "",
  maquina: "",
  component: "",
  modoFalha: "",
  descricao: "",
  resolvidoPorMim: false,
  mantenedor: null,
  mantenedorLivre: "",
};

const EMPTY_RELATED_LOSS_SELECTION = { ids: [], naoEncontrado: false, comentario: "" };

const parseHHMMSSToMinutes = (text) => {
  const parts = String(text).trim().split(":");
  if (parts.length !== 3) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2]);
  const isValid =
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    Number.isInteger(seconds) &&
    hours >= 0 &&
    minutes >= 0 &&
    minutes <= 59 &&
    seconds >= 0 &&
    seconds <= 59;
  return isValid ? hours * 60 + minutes + seconds / 60 : null;
};

export const JustificationForm = ({ selectedRows = [], selectedHour, selectedDate, maquinas = [], onReset, onSaved }) => {
  const { showToast } = useToast();
  const mantenedores = useMantenedores();
  const diagnosticoRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showRelatedLossModal, setShowRelatedLossModal] = useState(false);
  const [relatedLossData, setRelatedLossData] = useState([]);
  const [isFetchingRelatedLoss, setIsFetchingRelatedLoss] = useState(false);
  const [relatedLossSelection, setRelatedLossSelection] = useState(EMPTY_RELATED_LOSS_SELECTION);

  const hasRelatedLossLinked = relatedLossSelection.ids.length > 0 || relatedLossSelection.naoEncontrado;
  const requiresRelatedLoss = [CAUSA_FALTA_ALIMENTACAO, CAUSA_FALTA_ABSORCAO].includes(form.causaRaiz);
  const requiresMantenedor = form.causaRaiz === CAUSA_FALHA_EQUIPAMENTO;

  const scrollToDiagnostico = () => {
    diagnosticoRef.current && diagnosticoRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isManualSingleRow = selectedRows.length === 1 && selectedRows[0]?.isManual;
  const totalDuration = useMemo(() => {
    if (isManualSingleRow) return Number(selectedRows[0]?.losstime_min || 0);
    const sum = selectedRows.reduce((acc, row) => acc + (Number(row?.losstime_min) || 0), 0);
    return Number(sum.toFixed(5));
  }, [selectedRows, isManualSingleRow]);

  const [durationText, setDurationText] = useState("");
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  useEffect(() => {
    setDurationText(formatMinutesToHHMMSS(totalDuration));
  }, [totalDuration]);

  const effectiveDuration = useMemo(() => parseHHMMSSToMinutes(durationText) ?? totalDuration, [durationText, totalDuration]);

  useEffect(() => {
    if (CAUSAS_SEM_COMPONENTE.includes(form.causaRaiz)) {
      setForm((current) => ({ ...current, component: "NÃO SE APLICA", modoFalha: "NÃO SE APLICA" }));
    }
  }, [form.causaRaiz]);

  const handleFieldChange = async (field, value) => {
    if (field === "causaRaiz") {
      const tipoPerda = CAUSA_RAIZ_TO_TIPO_PERDA[value] ?? "";
      setForm((current) => ({ ...current, causaRaiz: value, tipoPerdaCap: tipoPerda }));
    } else {
      setForm((current) => ({ ...current, [field]: value }));
    }

    const isRelatedLossCausa = field === "causaRaiz" && (value === CAUSA_FALTA_ALIMENTACAO || value === CAUSA_FALTA_ABSORCAO);
    if (isRelatedLossCausa) scrollToDiagnostico();
    if (isRelatedLossCausa) {
      try {
        setIsFetchingRelatedLoss(true);
        const causaKey = value === CAUSA_FALTA_ALIMENTACAO ? "FALTA_ALIMENTACAO" : "FALTA_ABSORCAO";
        const response = await fetchAlarmesDisponiveisParaAlocacao({
          linha: selectedRows[0]?.line,
          causa: causaKey,
          ts_inicio: selectedRows[0]?.ts_inicio,
        });
        if (response.data?.alarmes?.length) {
          setRelatedLossData(response.data);
          setShowRelatedLossModal(true);
        } else {
          showToast("Nenhum alarme disponível encontrado", "info");
        }
      } catch (error) {
        console.error("Erro ao buscar alarmes:", error);
        showToast("Erro ao buscar alarmes disponíveis", "error");
      } finally {
        setIsFetchingRelatedLoss(false);
      }
    }
  };

  const handleDiagnosticoAreaClick = () => scrollToDiagnostico();

  const validate = () => {
    const tipoPerda = CAUSA_RAIZ_TO_TIPO_PERDA[form.causaRaiz];
    const errors = {
      maquina: !maquinas.includes(form.maquina),
      causaRaiz: !CAUSAS_RAIZ.includes(form.causaRaiz) || !tipoPerda,
      modoFalha: !MODOS_FALHA.includes(form.modoFalha),
      component: !COMPONENTES.includes(form.component),
    };

    if (requiresRelatedLoss && !(relatedLossSelection.ids.length > 0 || (relatedLossSelection.naoEncontrado && relatedLossSelection.comentario.trim().length > 2))) {
      alert("Para 'FALTA DE ALIMENTAÇÃO' ou 'FALTA DE ABSORÇÃO', selecione alarmes relacionados ou marque 'Não Encontrado' com comentário.");
      return false;
    }

    if (requiresMantenedor) {
      if (form.component === "NÃO SE APLICA" || form.modoFalha === "NÃO SE APLICA") {
        alert("Para 'FALHA EQUIPAMENTO', Componente e Modo de Falha não podem ser 'NÃO SE APLICA'.");
        return false;
      }
      if (!(form.resolvidoPorMim || form.mantenedor?.id != null || form.mantenedorLivre.trim().length > 1)) {
        alert("Para 'FALHA EQUIPAMENTO', informe o mantenedor ou marque 'Resolvido por mim'.");
        errors.mantenedor = true;
        setFieldErrors(errors);
        return false;
      }
    }

    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const parsedDuration = parseHHMMSSToMinutes(durationText);
    if (parsedDuration === null || parsedDuration <= 0) {
      showToast("Informe uma duração válida no formato HH:MM:SS", "error");
      return;
    }

    const tipoPerda = CAUSA_RAIZ_TO_TIPO_PERDA[form.causaRaiz];
    if (!tipoPerda) {
      showToast("A Causa Raiz selecionada não possui Tipo de Perda configurado.", "error");
      return;
    }

    const payload = {
      linha: selectedRows[0]?.line || null,
      data: selectedDate,
      horaselecionada: selectedHour,
      alarms: isManualSingleRow ? [] : selectedRows.map((row) => row.id).filter((id) => id != null),
      relacionado: relatedLossSelection.ids,
      descricao: form.modoFalha,
      causa_raiz: form.causaRaiz,
      tipo_perda_cap: tipoPerda,
      dur_min: parsedDuration,
      maquina: form.maquina,
      componente: form.component,
      comentario: relatedLossSelection.naoEncontrado ? relatedLossSelection.comentario : form.descricao,
      resolvido_por_mim: form.resolvidoPorMim || false,
      mantenedor_id: form.resolvidoPorMim ? null : form.mantenedor?.id ?? null,
      mantenedor_nome_livre: form.resolvidoPorMim ? null : form.mantenedorLivre.trim() || null,
    };

    try {
      console.log("CAP - salvando justificativa:", payload);
      await createJustificativa(payload);
      showToast("Justificativa salva com sucesso ✅", "success");
      setRelatedLossSelection(EMPTY_RELATED_LOSS_SELECTION);
      setForm(EMPTY_FORM);
      onReset?.();
      onSaved?.();
    } catch (error) {
      console.error("CAP - erro ao salvar justificativa:", error);
      console.error("CAP - resposta backend:", error?.response?.data);
      showToast(error?.response?.data?.message || error?.response?.data?.error || "Erro ao salvar justificativa", "error");
    }
  };

  if (!selectedRows.length) {
    return (
      <div className="cap-details cap-details--empty">
        <span className="cap-details--empty__icon">📋</span>
        <p>Selecione eventos na tabela para justificar</p>
      </div>
    );
  }

  return (
    <div className="cap-details">
      <div className="cd-header">
        <h3 className="cd-header__title">Justificar Eventos</h3>
        <div className="cd-header__chips">
          <Chip label="Eventos" value={selectedRows.length} />
          <div
            className={`cd-chip cd-chip--duration ${isEditingDuration ? "cd-chip--editing" : ""}`}
            onClick={() => setIsEditingDuration(true)}
            title="Clique para editar a duração"
          >
            <span className="cd-chip__label">Duração</span>
            {isEditingDuration ? (
              <input
                type="text"
                className="cd-duration-input"
                value={durationText}
                autoFocus
                maxLength={8}
                placeholder="00:00:00"
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setDurationText(event.target.value.replace(/[^\d:]/g, ""))}
                onBlur={() => {
                  const parsed = parseHHMMSSToMinutes(durationText);
                  if (parsed === null || parsed <= 0) {
                    setDurationText(formatMinutesToHHMMSS(totalDuration));
                    showToast("Duração inválida. Use HH:MM:SS", "error");
                  }
                  setIsEditingDuration(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") {
                    setDurationText(formatMinutesToHHMMSS(totalDuration));
                    setIsEditingDuration(false);
                  }
                }}
              />
            ) : (
              <span className="cd-chip__value">{durationText}</span>
            )}
          </div>
        </div>
      </div>

      <div className="cd-form">
        <div className={`cd-field-row${requiresRelatedLoss ? " cd-field-row--with-btn" : ""}`}>
          <FilterComboBox
            id="causaRaiz"
            label="Causa Raiz"
            value={form.causaRaiz}
            onChange={(value) => handleFieldChange("causaRaiz", value)}
            options={CAUSAS_RAIZ}
            hasError={fieldErrors.causaRaiz}
          />
          {requiresRelatedLoss && (
            <button type="button" className={`cd-relacional-btn ${hasRelatedLossLinked ? "ok" : "pending"}`} onClick={() => setShowRelatedLossModal(true)}>
              {hasRelatedLossLinked ? "✔ Vinculado" : "Vincular perda"}
            </button>
          )}
        </div>

        {requiresMantenedor && (
          <MantenedorField form={form} setForm={setForm} mantenedores={mantenedores} hasError={fieldErrors.mantenedor} />
        )}

        <FilterComboBox
          id="maquina"
          label="Máquina"
          value={form.maquina}
          onChange={(value) => handleFieldChange("maquina", value)}
          options={maquinas}
          hasError={fieldErrors.maquina}
        />

        <FormDivider label="Diagnóstico" />

        <div ref={diagnosticoRef} className="cd-diagnostico-area" onClick={handleDiagnosticoAreaClick}>
          <div className="cd-row-2">
            <FilterComboBox
              id="component"
              label="Componente"
              value={form.component}
              onChange={(value) => {
                handleFieldChange("component", value);
                scrollToDiagnostico();
              }}
              options={COMPONENTES}
              hasError={fieldErrors.component}
            />
            <FilterComboBox
              id="modoFalha"
              label="Modo de Falha"
              value={form.modoFalha}
              onChange={(value) => {
                handleFieldChange("modoFalha", value);
                scrollToDiagnostico();
              }}
              options={MODOS_FALHA}
              hasError={fieldErrors.modoFalha}
            />
          </div>
          <div className="cd-field">
            <label className="cd-label" htmlFor="descricao">
              Comentário <span className="cd-label__optional">(opcional)</span>
            </label>
            <textarea
              id="descricao"
              className="cd-textarea"
              value={form.descricao}
              onChange={(event) => handleFieldChange("descricao", event.target.value)}
              onClick={scrollToDiagnostico}
              rows={2}
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        <div className="cd-actions">
          <Button variant="primary" onClick={handleSubmit}>
            Salvar justificativa
          </Button>
        </div>
      </div>

      <RelatedLossModal
        open={showRelatedLossModal}
        onClose={() => setShowRelatedLossModal(false)}
        initialState={relatedLossSelection}
        onSave={(selection) => {
          setRelatedLossSelection(selection);
          if (selection.naoEncontrado) setForm((current) => ({ ...current, descricao: selection.comentario }));
        }}
        data={relatedLossData.alarmes}
        linhas={relatedLossData.linhas}
        horas={relatedLossData.horas}
        loading={isFetchingRelatedLoss}
        duracaoTarget={effectiveDuration}
      />
    </div>
  );
};
