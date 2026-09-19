import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useChartData, useHourSelection, useMaquinasByLine, useLancamentos } from "./useCapData";
import { useRowSelection, useCapUiState } from "./useCapUi";

const CapContext = createContext(null);

const buildInitialFilters = (lineParam) => {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  return {
    date: oneHourAgo.toISOString().split("T")[0],
    line: (lineParam || "SCC").toUpperCase(),
    shift: "Todos",
  };
};

export const CapProvider = ({ lineParam, children }) => {
  const [filters, setFilters] = useState(() => buildInitialFilters(lineParam));

  const setDate = useCallback((dateString) => {
    if (!dateString) return;
    // Production data isn't tracked on Sundays - roll forward to Monday.
    const selectedDate = new Date(dateString + "T00:00:00");
    if (selectedDate.getDay() === 0) selectedDate.setDate(selectedDate.getDate() + 1);
    setFilters((current) => ({ ...current, date: selectedDate.toISOString().split("T")[0] }));
  }, []);

  const setLine = useCallback((line) => {
    setFilters((current) => ({ ...current, line: line.toUpperCase() }));
  }, []);

  const setShift = useCallback((shift) => {
    setFilters((current) => ({ ...current, shift }));
  }, []);

  const chartData = useChartData(filters.line, filters.date);
  const rowSelection = useRowSelection();
  const uiState = useCapUiState();
  const hourSelection = useHourSelection(chartData, filters.line, filters.shift);
  const maquinas = useMaquinasByLine(filters.line);
  const { lancamentos = [], refetch: refetchLancamentos } = useLancamentos(filters.date, filters.line, hourSelection.selection.hour);

  useEffect(() => {
    hourSelection.clearSelection();
    rowSelection.clearSelection();
    uiState.closeJustifyTab();
    // Reset transient selection state whenever the date or line filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.date, filters.line]);

  const [isReloading, setIsReloading] = useState(false);
  const handleReload = useCallback(async () => {
    setIsReloading(true);
    try {
      await Promise.all([chartData.refetch(), refetchLancamentos()]);
    } catch (error) {
      console.error("Erro ao recarregar dados:", error);
    } finally {
      setIsReloading(false);
    }
  }, [chartData, refetchLancamentos]);

  const handleSaved = useCallback(async () => {
    await refetchLancamentos();
    await chartData.refetch();
    rowSelection.clearSelection();
  }, [refetchLancamentos, chartData, rowSelection]);

  const filteredChartData = useMemo(() => {
    const { hours, indices } = hourSelection.filteredData;
    if (!hours.length) return { hours: [], chartSeries: [] };
    return {
      hours,
      chartSeries: chartData.chartSeries.map((series) => ({
        name: series.name,
        data: indices.map((index) => series.data[index] ?? 0),
      })),
    };
  }, [hourSelection.filteredData, chartData.chartSeries]);

  const filteredTableData = useMemo(() => {
    if (!hourSelection.selection.hour || !hourSelection.alarmData.length) return [];
    return hourSelection.alarmData.filter((alarm) => alarm.line === filters.line);
  }, [hourSelection.alarmData, hourSelection.selection.hour, filters.line]);

  const value = {
    filters,
    setDate,
    setLine,
    setShift,
    chartData,
    maquinas,
    lancamentos,
    refetchLancamentos,
    filteredChartData,
    filteredTableData,
    hourSelection,
    rowSelection,
    uiState,
    handleReload,
    handleSaved,
    isReloading,
  };

  return <CapContext.Provider value={value}>{children}</CapContext.Provider>;
};

export const useCap = () => {
  const context = useContext(CapContext);
  if (!context) throw new Error("useCap() deve ser usado dentro de <CapProvider>");
  return context;
};
