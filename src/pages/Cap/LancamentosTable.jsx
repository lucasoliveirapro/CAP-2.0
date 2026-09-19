import { memo, useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge, clearFilterIconUrl } from "./CapValidacao";
import { formatMinutesToHHMM } from "../../utils/capUtils";

const FILTER_COLUMNS = {
  causaRaiz: "Causa Raiz",
  tipoPerdaCap: "Tipo de Perda",
  responsavel: "Responsável",
  status: "Status",
  validador: "Validador",
};

const EMPTY_FILTERS = { causaRaiz: "", tipoPerdaCap: "", responsavel: "", status: "", validador: "" };
const CLOSED_FILTERS = { causaRaiz: false, tipoPerdaCap: false, responsavel: false, status: false, validador: false };

const LancamentosTableComponent = ({ lancamentos, onAddJustificativa, selectedHour, onRowClick }) => {
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [openFilters, setOpenFilters] = useState(CLOSED_FILTERS);
  const headerRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideAHeader = Object.values(headerRefs.current).some(
        (headerEl) => headerEl && headerEl.contains(event.target)
      );
      if (!clickedInsideAHeader) setOpenFilters(CLOSED_FILTERS);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const uniqueValuesPerColumn = useMemo(() => {
    const sets = { causaRaiz: new Set(), tipoPerdaCap: new Set(), responsavel: new Set(), status: new Set(), validador: new Set() };
    for (const row of lancamentos) {
      if (row.causaRaiz) sets.causaRaiz.add(row.causaRaiz);
      if (row.tipoPerdaCap) sets.tipoPerdaCap.add(row.tipoPerdaCap);
      if (row.responsavel) sets.responsavel.add(row.responsavel);
      if (row.status?.nome) sets.status.add(row.status.nome);
      if (row.validador) sets.validador.add(row.validador);
    }
    return Object.fromEntries(Object.entries(sets).map(([key, set]) => [key, [...set]]));
  }, [lancamentos]);

  const filteredLancamentos = useMemo(
    () =>
      lancamentos.filter((row) =>
        Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          return key === "status" ? row.status?.nome === value : row[key] === value;
        })
      ),
    [lancamentos, filters]
  );

  const toggleFilterDropdown = (key) => {
    setOpenFilters((current) => ({ ...CLOSED_FILTERS, [key]: !current[key] }));
  };

  const setFilterValue = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setOpenFilters(CLOSED_FILTERS);
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="cap-lancamentos">
      {filteredLancamentos.length === 0 ? (
        <div className="cap-lancamentos__no-data">Nenhuma Justificativa Registrada Para o Intervalo {selectedHour}</div>
      ) : (
        <div className="cap-lancamentos__table-container cap-lancamentos__table-wrapper">
          <button className="cap-lancamentos__clear-filters-btn" title="Limpar filtros" onClick={clearFilters}>
            <img src={clearFilterIconUrl} alt="Limpar filtros" />
          </button>
          <table className="cap-lancamentos__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Modo de Falha</th>
                <th>Máquina</th>
                <th>Duração Total (min)</th>
                {Object.entries(FILTER_COLUMNS).map(([key, label]) => (
                  <th key={key} ref={(el) => (headerRefs.current[key] = el)} className="filter-header">
                    <span>{label}</span>
                    <span className={`filter-arrow ${filters[key] ? "filtered" : ""}`} onClick={() => toggleFilterDropdown(key)}>
                      ▼
                    </span>
                    {openFilters[key] && (
                      <div className="filter-dropdown">
                        <div className="filter-option" onClick={() => setFilterValue(key, "")}>
                          Todos
                        </div>
                        {uniqueValuesPerColumn[key].map((value) => (
                          <div key={value} className="filter-option" onClick={() => setFilterValue(key, value)}>
                            {value}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                ))}
                <th>Qtd. Eventos</th>
                <th>Salvo em</th>
              </tr>
            </thead>
            <tbody>
              {filteredLancamentos.map((row) => (
                <tr
                  key={row.id}
                  className={selectedRowId === row.id ? "cap-lancamentos__row-selected" : ""}
                  onClick={() => {
                    setSelectedRowId(row.id);
                    onRowClick(row.id);
                  }}
                >
                  <td>{row.id.slice(0, 6)}</td>
                  <td>{row.data ? new Date(row.data).toLocaleDateString("pt-BR") : "-"}</td>
                  <td>{row.hora}</td>
                  <td className="cap-lancamentos__descricao">{row.descricao}</td>
                  <td>{row.maquina}</td>
                  <td>{formatMinutesToHHMM(row.duracao)}</td>
                  <td>{row.causaRaiz || "-"}</td>
                  <td>{row.tipoPerdaCap || "-"}</td>
                  <td>{row.responsavel}</td>
                  <td>
                    <StatusBadge textstatus={row.status?.texto} status={row.status?.nome || "-"} />
                  </td>
                  <td>{row.validador}</td>
                  <td>{row.alarms?.length ?? 0}</td>
                  <td>{row.criadoEm ? new Date(row.criadoEm).toLocaleString("pt-BR") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {onAddJustificativa && (
        <button className="cap-lancamentos__btn-add" onClick={onAddJustificativa}>
          Adicionar Justificativa
        </button>
      )}
    </div>
  );
};

export const LancamentosTable = memo(LancamentosTableComponent);
