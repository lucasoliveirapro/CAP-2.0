import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatMinutesToHHMMSS } from "../../utils/capUtils";
import { clearFilterIconUrl } from "./CapValidacao";

const RowTooltip = ({ text, children, disabled }) => {
  const [visible, setVisible] = useState(false);
  if (!disabled) return children;
  return (
    <div
      style={{ position: "relative", display: "contents" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && <div className="custom-tooltip">{text}</div>}
    </div>
  );
};

const TableLoadingState = () => (
  <div className="cap-table__loading">
    <span>Carregando dados...</span>
  </div>
);

const FILTERABLE_COLUMNS = [
  { key: "line", label: "Linha", filter: true },
  { key: "station", label: "Estação", filter: true },
  { key: "element", label: "Máquina", filter: true },
  { key: "alarm", label: "Alarme", filter: true },
  { key: "priority", label: "Tipo", filter: true },
  { key: "losstime_min", label: "Duração (horas)", filter: true },
  { key: "qtd_ocorrencias", label: "Qtd. Ocorrências", filter: true },
];

const DATE_COLUMNS = [
  { key: "start_time", label: "Início" },
  { key: "end_time", label: "Fim" },
];

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
};

export const EventsTable = ({
  hour,
  data = [],
  onSelectionChange,
  selectedRows = [],
  onClearSelections,
  onPendingChange,
  isLoading = false,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isRangeSelecting, setIsRangeSelecting] = useState(false);
  const [anchorIndex, setAnchorIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "losstime_min", direction: "desc" });
  const tableRef = useRef(null);

  useEffect(() => {
    if (selectedRows && selectedRows.length > 0) {
      setSelectedIds(selectedRows.map((row) => row.id || row));
    } else {
      setSelectedIds([]);
    }
  }, [selectedRows]);

  useEffect(() => {
    onPendingChange && onPendingChange(selectedIds.length > 0);
  }, [selectedIds, onPendingChange]);

  const filteredSortedData = useMemo(() => {
    let rows = Array.isArray(data) ? data : [];

    Object.keys(columnFilters).forEach((key) => {
      const filterValue = columnFilters[key];
      if (!filterValue) return;
      rows = rows.filter((row) => {
        if (!row || row[key] === undefined || row[key] === null) return false;
        return String(row[key]).toLowerCase().includes(filterValue.toLowerCase());
      });
    });

    if (sortConfig.key) {
      rows = [...rows].sort((a, b) => {
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];
        if (valueA == null) return 1;
        if (valueB == null) return -1;
        if (typeof valueA === "number" && typeof valueB === "number") {
          return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
        }
        const strA = String(valueA).toLowerCase();
        const strB = String(valueB).toLowerCase();
        if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
        if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [data, columnFilters, sortConfig]);

  const selectRange = useCallback(
    (fromIndex, toIndex) => {
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const idsInRange = [];
      for (let i = start; i <= end; i++) {
        const row = filteredSortedData[i];
        if (row && !row.is_used) idsInRange.push(row.id);
      }
      setSelectedIds((current) => {
        const merged = Array.from(new Set([...current, ...idsInRange]));
        const selectedRowObjects = data.filter((row) => row && merged.includes(row.id));
        onSelectionChange?.(selectedRowObjects);
        return merged;
      });
    },
    [filteredSortedData, data, onSelectionChange]
  );

  const toggleRow = useCallback(
    (index, isShiftClick = false) => {
      const row = filteredSortedData[index];
      if (!row || row.is_used) return;

      if (isShiftClick && anchorIndex !== null) {
        selectRange(anchorIndex, index);
        return;
      }

      setSelectedIds((current) => {
        const updated = current.includes(row.id)
          ? current.filter((id) => id !== row.id)
          : [...current, row.id];
        const selectedRowObjects = data.filter((item) => item && updated.includes(item.id));
        onSelectionChange?.(selectedRowObjects);
        return updated;
      });
      setAnchorIndex(index);
    },
    [filteredSortedData, data, onSelectionChange, anchorIndex, selectRange]
  );

  const handleMouseDown = useCallback((index, event) => {
    if (event.shiftKey) return;
    setIsRangeSelecting(true);
    setAnchorIndex(index);
    setHoverIndex(index);
  }, []);

  const handleMouseEnterRow = useCallback(
    (index) => {
      if (isRangeSelecting && anchorIndex !== null) {
        setHoverIndex(index);
        selectRange(anchorIndex, index);
      }
    },
    [isRangeSelecting, anchorIndex, selectRange]
  );

  const stopRangeSelecting = useCallback(() => {
    setIsRangeSelecting(false);
    setAnchorIndex(null);
    setHoverIndex(null);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => isRangeSelecting && stopRangeSelecting();
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isRangeSelecting, stopRangeSelecting]);

  const selectionCount = selectedIds.length;

  if (isLoading) {
    return (
      <div className="cap-table__container">
        <header className="cap-table__header">
          <h3 className="cap__title">{hour ? `Eventos entre ${hour}` : "⚠️ Selecione uma hora no gráfico para justificar"}</h3>
        </header>
        <TableLoadingState />
      </div>
    );
  }

  return (
    <div className="cap-table__container">
      <button
        className="cap-table__clear-filters-btn"
        title="Limpar filtros"
        onClick={() => {
          setColumnFilters({});
          setSortConfig({ key: "", direction: "asc" });
        }}
      >
        <img src={clearFilterIconUrl} alt="Limpar filtros" />
      </button>

      <header className="cap-table__header">
        <h3 className="cap__title">{hour ? `Eventos entre ${hour}` : "⚠️ Selecione uma hora no gráfico para justificar"}</h3>
        <div className="cap-table__actions">
          {selectionCount > 0 && (
            <>
              <span className="cap-table__selection-count">{selectionCount} evento(s)</span>
              <button
                className="cap-table__clear-btn"
                onClick={() => {
                  setSelectedIds([]);
                  onClearSelections?.();
                }}
              >
                Limpar seleção
              </button>
            </>
          )}
        </div>
      </header>

      <div className={`cap-table__wrapper ${isRangeSelecting ? "cap-table__wrapper--selecting" : ""}`}>
        <table className="cap-table" ref={tableRef}>
          <thead>
            <tr>
              <th className="cap-table__cell--checkbox">✓</th>
              {FILTERABLE_COLUMNS.map((column) => (
                <th key={column.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {column.label}
                    <button
                      onClick={() =>
                        setSortConfig((current) => ({
                          key: column.key,
                          direction: current.key === column.key && current.direction === "asc" ? "desc" : "asc",
                        }))
                      }
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}
                    >
                      {sortConfig.key === column.key ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </button>
                  </div>
                  {column.filter && (
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      value={columnFilters[column.key] || ""}
                      onChange={(event) =>
                        setColumnFilters((current) => ({ ...current, [column.key]: event.target.value }))
                      }
                      style={{ width: "90%" }}
                    />
                  )}
                </th>
              ))}
              {DATE_COLUMNS.map((column) => (
                <th key={column.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {column.label}
                    <button
                      onClick={() =>
                        setSortConfig((current) => ({
                          key: column.key,
                          direction: current.key === column.key && current.direction === "asc" ? "desc" : "asc",
                        }))
                      }
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}
                    >
                      {sortConfig.key === column.key ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSortedData.map((row, index) => {
              if (!row) return null;
              const isSelected = selectedIds.includes(row.id);
              const isDisabled = row.is_used === true;
              const isInHoverRange =
                isRangeSelecting &&
                anchorIndex !== null &&
                hoverIndex !== null &&
                index >= Math.min(anchorIndex, hoverIndex) &&
                index <= Math.max(anchorIndex, hoverIndex);

              return (
                <RowTooltip key={row.id || index} text="Este alarme já foi justificado" disabled={isDisabled}>
                  <tr
                    className={[
                      isSelected ? "cap-table__row--selected" : "",
                      isInHoverRange ? "cap-table__row--selecting" : "",
                      isDisabled ? "cap-table__row--disabled" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(event) => {
                      if (isDisabled) return;
                      event.shiftKey ? toggleRow(index, true) : toggleRow(index);
                    }}
                    onMouseDown={(event) => {
                      if (!isDisabled) handleMouseDown(index, event);
                    }}
                    onMouseEnter={() => {
                      if (!isDisabled) handleMouseEnterRow(index);
                    }}
                    onMouseUp={() => {
                      if (!isDisabled) stopRangeSelecting();
                    }}
                  >
                    <td className="cap-table__cell--checkbox">
                      <div className="cap-table__checkbox">{isSelected ? "✔" : ""}</div>
                    </td>
                    <td>{row.line || "-"}</td>
                    <td>{row.station || "-"}</td>
                    <td>{row.element || "-"}</td>
                    <td>{row.alarm || "-"}</td>
                    <td>{row.priority || "-"}</td>
                    <td>{formatMinutesToHHMMSS(row.losstime_min)}</td>
                    <td>{row.qtd_ocorrencias || "0"}</td>
                    <td>{formatDateTime(row.start_time)}</td>
                    <td>{formatDateTime(row.end_time)}</td>
                  </tr>
                </RowTooltip>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
