import { useCap } from "./CapProvider";
import { LINHAS, TURNOS } from "../../constants/capConstant";

const FilterLabel = ({ label, children }) => (
  <label className="cap__filter-label">
    {label}
    {children}
  </label>
);

const ShiftSelect = ({ value, onChange, onReset, shifts }) => (
  <div className="shift-select">
    <select value={value} onChange={(event) => onChange(event.target.value)} className="shift-select__input">
      {shifts.map((shift) => (
        <option key={shift.value} value={shift.value}>
          {shift.label}
        </option>
      ))}
    </select>
    {value !== "Todos" && (
      <button type="button" onClick={onReset} title="Resetar turno" className="shift-select__reset">
        ×
      </button>
    )}
  </div>
);

export const CapFilters = () => {
  const { filters, setDate, setLine, setShift, handleReload, isReloading } = useCap();

  return (
    <div className="cap__filters">
      <FilterLabel label="Data">
        <input type="date" value={filters.date} onChange={(event) => setDate(event.target.value)} />
      </FilterLabel>
      <FilterLabel label="Linha">
        <select value={filters.line} onChange={(event) => setLine(event.target.value)}>
          {LINHAS.map((linha) => (
            <option key={linha.value} value={linha.value}>
              {linha.label}
            </option>
          ))}
        </select>
      </FilterLabel>
      <FilterLabel label="Turno">
        <ShiftSelect value={filters.shift} onChange={setShift} onReset={() => setShift("Todos")} shifts={TURNOS} />
      </FilterLabel>
      <button type="button" className="cap__reload-btn" onClick={handleReload} disabled={isReloading} title="Atualizar dados">
        {isReloading ? "Atualizando..." : "🔄 Atualizar"}
      </button>
    </div>
  );
};
