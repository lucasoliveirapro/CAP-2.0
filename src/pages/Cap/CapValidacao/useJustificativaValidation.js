import { useEffect, useState } from "react";
import { useJustificativaActions } from "./useJustificativaActions";
import { fetchJustificativaById, fetchMaquinas } from "../../../services/cap.http";
import { formatMinutesToHHMMSS } from "../../../utils/capUtils";

const EMPTY_EDITABLE_DATA = {
  causaRaiz: "",
  tipoPerdaCap: "",
  maquina: "",
  descricao: "",
  comentario: "",
  componente: "",
  duracao: "",
};

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

export function useJustificativaValidation(id, onUpdated) {
  const { approve, requestChanges, loading: actionLoading, error } = useJustificativaActions();
  const [justificativa, setJustificativa] = useState(null);
  const [maquinasOptions, setMaquinasOptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [validated, setValidated] = useState(null);
  const [editableData, setEditableData] = useState(EMPTY_EDITABLE_DATA);
  const [originalData, setOriginalData] = useState(EMPTY_EDITABLE_DATA);

  useEffect(() => {
    if (id) loadJustificativa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadJustificativa() {
    try {
      setPageLoading(true);
      const response = await fetchJustificativaById(id);
      const data = response?.data;
      if (!data) return;

      const latestHistory = data.historico?.[0] ?? {};
      setJustificativa(data);

      const initialData = {
        causaRaiz: latestHistory.causaRaiz ?? "",
        tipoPerdaCap: latestHistory.tipoPerdaCap ?? latestHistory.tipo_perda_cap ?? "",
        maquina: data.maquina ?? "",
        descricao: latestHistory.descricao ?? "",
        componente: latestHistory.componente ?? "",
        comentario: "",
        duracao: formatMinutesToHHMMSS(data.duracao),
      };
      setEditableData(initialData);
      setOriginalData(initialData);
      await loadMaquinas(data.linha);
    } catch (err) {
      console.error("Error fetching justification:", err);
    } finally {
      setPageLoading(false);
    }
  }

  async function loadMaquinas(linha) {
    try {
      const response = await fetchMaquinas({ linha });
      setMaquinasOptions(response?.data ?? []);
    } catch (err) {
      console.error("Error fetching machines:", err);
      setMaquinasOptions([]);
    }
  }

  function handleChange(field, value) {
    setEditableData((current) => ({ ...current, [field]: value }));
  }

  function buildChangesPayload() {
    const changes = { comentario: editableData.comentario };
    if (editableData.causaRaiz !== originalData.causaRaiz) changes.causa_raiz = editableData.causaRaiz;
    if (editableData.tipoPerdaCap !== originalData.tipoPerdaCap) changes.tipo_perda_cap = editableData.tipoPerdaCap;
    if (editableData.maquina !== originalData.maquina) changes.maquina = editableData.maquina;
    if (editableData.componente !== originalData.componente) changes.componente = editableData.componente;
    if (editableData.descricao !== originalData.descricao) changes.modo_falha = editableData.descricao;
    if (editableData.duracao !== originalData.duracao) {
      const parsedDuration = parseHHMMSSToMinutes(editableData.duracao);
      if (parsedDuration === null) throw new Error("Duração inválida. Use o formato HH:MM:SS");
      changes.dur_min = parsedDuration;
    }
    return changes;
  }

  async function handleSubmit() {
    try {
      let result;
      if (validated === true) {
        result = await approve(justificativa.id);
      } else {
        const changes = buildChangesPayload();
        result = await requestChanges(justificativa.id, changes);
        // Preserved from the original: submitting a change request flips the
        // radio selection back to "Aprovar" for the next render.
        setValidated(true);
      }
      if (result?.error) return;

      setPageLoading(true);
      await loadJustificativa();
      setPageLoading(false);
      onUpdated?.();
    } catch (err) {
      console.error("Erro ao processar justificativa:", err);
    }
  }

  function isFormValid() {
    if (validated === null || !editableData.tipoPerdaCap?.trim() || parseHHMMSSToMinutes(editableData.duracao) === null) {
      return false;
    }
    return validated === true ? true : editableData.comentario.trim() !== "";
  }

  return {
    justificativa,
    maquinasOptions,
    pageLoading,
    actionLoading,
    validated,
    setValidated,
    editableData,
    handleChange,
    handleSubmit,
    isFormValid: isFormValid(),
    error,
  };
}
