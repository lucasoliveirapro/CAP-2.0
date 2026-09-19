import { useEffect, useState } from "react";
import { StatusBadge } from "./CapValidacao";
import { formatMinutesToHHMMSS } from "../../utils/capUtils";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const LineTab = ({ linha, active, onClick }) => (
  <button className={`capmodalrel-tab ${active ? "active" : ""}`} onClick={() => onClick(linha)}>
    {linha}
  </button>
);

const RelatedLossCard = ({ item, selected, onToggle, duracaoTarget }) => {
  const contribPercent = Math.round((item.tempo_disponivel / duracaoTarget) * 100);
  return (
    <div className={`capmodalrel-card ${selected ? "selected" : ""}`} onClick={() => onToggle(item.id)}>
      <div className="capmodalrel-card-check">
        {selected && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="capmodalrel-card-header">
        <div>
          <div className="capmodalrel-card-title">
            <strong>{item.maquina}</strong>
            <StatusBadge textstatus={item.status?.nome} status={item.status?.texto} />
          </div>
          <span className="capmodalrel-card-id">
            ID #{item.id} · Matrícula {item.matricula}
          </span>
        </div>
        <div className="capmodalrel-highlight">
          <span>Tempo Disponível</span>
          <strong>{formatMinutesToHHMMSS(item.tempo_disponivel)}</strong>
        </div>
      </div>
      <div className="capmodalrel-card-contrib">
        <div className="capmodalrel-card-contrib-bar">
          <div style={{ width: `${Math.min(contribPercent, 100)}%` }} />
        </div>
        <span>{contribPercent}% da meta</span>
      </div>
      <div className="capmodalrel-card-grid">
        <div>
          <span>Data</span>
          <p>{formatDate(item.data)}</p>
        </div>
        <div>
          <span>Horário</span>
          <p>{item.hora}</p>
        </div>
        <div>
          <span>Duração</span>
          <p>{formatMinutesToHHMMSS(item.duracao)}</p>
        </div>
        <div>
          <span>Causa Raiz</span>
          <p>{item.causa_raiz}</p>
        </div>
        <div>
          <span>Componente</span>
          <p>{item.componente}</p>
        </div>
        <div>
          <span>Modo de Falha</span>
          <p>{item.modo_falha}</p>
        </div>
        {item.comentario && (
          <div>
            <span>Comentário</span>
            <p>{item.comentario}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DEFAULT_INITIAL_STATE = { ids: [], naoEncontrado: false, comentario: "" };

export const RelatedLossModal = ({
  open = true,
  onClose,
  onSave,
  data = [],
  linhas = [],
  horas = [],
  loading = false,
  duracaoTarget = 0,
  initialState = DEFAULT_INITIAL_STATE,
}) => {
  const [activeLinha, setActiveLinha] = useState("");
  useEffect(() => {
    if (open && linhas.length) {
      setActiveLinha(linhas[0]);
      setSelectedMap({});
    }
  }, [open, linhas]);

  const [horaFilter, setHoraFilter] = useState("");
  const [selectedMap, setSelectedMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    if (!open) return;
    setNaoEncontrado(initialState.naoEncontrado);
    setComentario(initialState.comentario ?? "");
    if (initialState.ids.length > 0) {
      setSelectedMap(Object.fromEntries(initialState.ids.map((id) => [id, true])));
    } else {
      setSelectedMap({});
    }
  }, [open]);

  const visibleItems = data.filter((item) => {
    if (item.linha !== activeLinha) return false;
    return horaFilter ? item.hora === horaFilter : true;
  });

  const selectedTotal = Object.entries(selectedMap)
    .filter(([, isSelected]) => isSelected)
    // `id` here is always a string (object keys are stringified), while
    // `item.id` can be numeric - compare as strings so numeric-id backends
    // don't silently stall the goal/progress calculation below.
    .map(([id]) => data.find((item) => String(item.id) === id))
    .filter(Boolean)
    .reduce((total, item) => total + Number(item.tempo_disponivel || 0), 0);

  const progressPercent = Math.min((selectedTotal / duracaoTarget) * 100, 100);
  const goalReached = Math.ceil((selectedTotal + Number.EPSILON) * 100) / 100 >= duracaoTarget;
  const selectedCount = Object.values(selectedMap).filter(Boolean).length;

  const toggleSelected = (id) => {
    setSelectedMap((current) => ({ ...current, [id]: !current[id] }));
  };

  const toggleSelectAll = () => {
    const allSelected = visibleItems.every((item) => selectedMap[item.id]);
    const updated = { ...selectedMap };
    visibleItems.forEach((item) => {
      updated[item.id] = !allSelected;
    });
    setSelectedMap(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (naoEncontrado) {
      onSave?.({ ids: [], naoEncontrado: true, comentario: comentario.trim() });
    } else {
      const ids = Object.entries(selectedMap)
        .filter(([, isSelected]) => isSelected)
        .map(([id]) => Number(id));
      onSave?.({ ids, naoEncontrado: false, comentario: null });
    }
    setIsSaving(false);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="capmodalrel-overlay" onClick={onClose}>
      <div className="capmodalrel-modal" onClick={(event) => event.stopPropagation()}>
        <div className="capmodalrel-container">
          <div className="capmodalrel-header">
            <div className="capmodalrel-header-top">
              <div>
                <h2 className="capmodalrel-title">Selecionar Justificativas</h2>
                <p className="capmodalrel-subtitle">
                  Selecione a perda relacionada a FALTA ALIMENTAÇÃO ou FALTA ABSORÇÃO que você deseja justificar.
                </p>
              </div>
              <button className="capmodalrel-close" onClick={onClose}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="capmodalrel-progress-area">
              <div className="capmodalrel-progress-labels">
                <div>
                  <span className="capmodalrel-progress-small">Tempo selecionado</span>
                  <strong className="capmodalrel-progress-total">{formatMinutesToHHMMSS(selectedTotal)}</strong>
                  <span className={`capmodalrel-chip ${goalReached ? "done" : ""}`}>
                    {goalReached ? "✓ meta atingida" : `faltam ${formatMinutesToHHMMSS(duracaoTarget - selectedTotal)}`}
                  </span>
                </div>
                <div className="capmodalrel-progress-target">
                  Meta
                  <strong>{formatMinutesToHHMMSS(duracaoTarget)}</strong>
                </div>
              </div>
              <div className="capmodalrel-track">
                <div className={`capmodalrel-fill ${goalReached ? "complete" : ""}`} style={{ width: `${progressPercent}%` }} />
              </div>
              <p className={`capmodalrel-progress-hint ${goalReached ? "ok" : selectedTotal > 0 ? "error" : ""}`}>
                {goalReached
                  ? "✓ Tempo suficiente selecionado, pode salvar!"
                  : selectedTotal > 0
                  ? `Ainda faltam ${formatMinutesToHHMMSS(duracaoTarget - selectedTotal)} para atingir a meta`
                  : "Selecione registros até atingir o tempo da perda"}
              </p>
            </div>

            <select className="capmodalrel-filter" value={horaFilter} onChange={(event) => setHoraFilter(event.target.value)}>
              <option value="">Todos horários</option>
              {horas.map((hora) => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>

            <div className="capmodalrel-tabs">
              {linhas.map((linha) => (
                <LineTab key={linha} linha={linha} active={activeLinha === linha} onClick={setActiveLinha} />
              ))}
            </div>
          </div>

          <div className="capmodalrel-list-header">
            <span>
              {visibleItems.length} registro{visibleItems.length !== 1 ? "s" : ""} em <strong>{activeLinha}</strong>
            </span>
            <button className="capmodalrel-select-all" onClick={toggleSelectAll}>
              {visibleItems.every((item) => selectedMap[item.id]) ? "Desmarcar todos" : "Selecionar todos"}
            </button>
          </div>

          <div className="capmodalrel-list">
            {visibleItems.length === 0 ? (
              <div className="capmodalrel-empty">Nenhum registro encontrado para esta linha.</div>
            ) : (
              visibleItems.map((item) => (
                <RelatedLossCard
                  key={item.id}
                  item={item}
                  duracaoTarget={duracaoTarget}
                  selected={!!selectedMap[item.id]}
                  onToggle={toggleSelected}
                />
              ))
            )}
          </div>

          <div className="capmodalrel-footer">
            {naoEncontrado && (
              <div className="capmodalrel-nao-encontrado-panel">
                <label className="capmodalrel-nao-encontrado-label">
                  Motivo <span>*obrigatório</span>
                </label>
                <textarea
                  className="capmodalrel-nao-encontrado-textarea"
                  placeholder="Descreva o motivo da sua perda, exemplo: 'Falta alimentação AUE'"
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  rows={2}
                />
              </div>
            )}
            <div className="capmodalrel-footer-row">
              {selectedCount === 0 && (
                <div className="capmodalrel-footer-left">
                  <button
                    className={`capmodalrel-btn nao-encontrado ${naoEncontrado ? "active" : ""}`}
                    onClick={() => {
                      setNaoEncontrado((current) => !current);
                      setComentario("");
                    }}
                  >
                    {naoEncontrado ? "✕ Cancelar" : "Não encontrei a justificativa relacionada"}
                  </button>
                </div>
              )}
              <span className="capmodalrel-footer-count">
                {selectedCount > 0 ? (
                  <>
                    <strong>
                      {selectedCount} item{selectedCount !== 1 ? "s" : ""}
                    </strong>{" "}
                    selecionado{selectedCount !== 1 ? "s" : ""}
                  </>
                ) : (
                  "Nenhum item selecionado"
                )}
              </span>
              <div className="capmodalrel-footer-actions">
                <button className="capmodalrel-btn secondary" onClick={onClose}>
                  Cancelar
                </button>
                {naoEncontrado ? (
                  <button
                    className="capmodalrel-btn nao-encontrado-save"
                    disabled={comentario.length < 3 || isSaving}
                    onClick={handleSave}
                  >
                    {isSaving ? (
                      <>
                        <span className="capmodalrel-spinner" /> Salvando...
                      </>
                    ) : (
                      "Salvar sem perda relacionada"
                    )}
                  </button>
                ) : (
                  <button className="capmodalrel-btn primary" disabled={selectedCount === 0 || isSaving || !goalReached} onClick={handleSave}>
                    {isSaving ? (
                      <>
                        <span className="capmodalrel-spinner" /> Salvando...
                      </>
                    ) : (
                      "Salvar seleção"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
