import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProducaoPorHora, fetchAlarms, fetchMaquinas, fetchMantenedores, fetchJustificativasPorHora } from "../../services/cap.http";

export const useChartData = (line, date) => {
  const [state, setState] = useState({ hours: [], ts: [], chartSeries: [], turnos: [], isLoading: false, error: null });

  const refetch = useCallback(async () => {
    if (!line || !date) return;
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const data = await fetchProducaoPorHora(line, date);
      setState({ hours: data.hours, ts: data.ts, chartSeries: data.chartSeries, turnos: data.turnos, isLoading: false, error: null });
    } catch (error) {
      console.error("Erro ao carregar dados do gráfico:", error);
      setState((current) => ({ ...current, isLoading: false, error: error.message }));
    }
  }, [line, date]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
};

export const useHourSelection = (chartData, line, shift) => {
  const [selection, setSelection] = useState({ hour: null, filteredIndex: null, originalIndex: null });
  const [alarmData, setAlarmData] = useState([]);
  const [isLoadingAlarms, setIsLoadingAlarms] = useState(false);
  const { hours, ts, turnos } = chartData;

  const filteredData = useMemo(() => {
    if (!hours.length) return { hours: [], ts: [], turnos: [], indices: [] };
    if (shift === "Todos") {
      const indices = Array.from({ length: hours.length }, (_, index) => index);
      return { hours: [...hours], ts: [...ts], turnos: [...turnos], indices };
    }
    const indices = turnos.map((turno, index) => (turno === shift ? index : -1)).filter((index) => index !== -1);
    return {
      hours: indices.map((index) => hours[index]),
      ts: indices.map((index) => ts[index]),
      turnos: indices.map((index) => turnos[index]),
      indices,
    };
  }, [shift, hours, ts, turnos]);

  const filteredIndexToOriginal = useCallback(
    (filteredIndex) => {
      if (filteredIndex == null) return null;
      if (shift === "Todos") return filteredIndex;
      return filteredIndex >= 0 && filteredIndex < filteredData.indices.length ? filteredData.indices[filteredIndex] : null;
    },
    [shift, filteredData.indices]
  );

  const fetchAlarmsForIndex = useCallback(
    async (originalIndex) => {
      if (!line || originalIndex === null || !ts[originalIndex]) return;
      const [start, end] = ts[originalIndex];
      const TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000;
      const startAdjusted = new Date(new Date(start).getTime() - TIMEZONE_OFFSET_MS);
      const endAdjusted = new Date(new Date(end).getTime() - TIMEZONE_OFFSET_MS);
      setIsLoadingAlarms(true);
      try {
        const alarms = await fetchAlarms(line, [startAdjusted.toISOString(), endAdjusted.toISOString()]);
        console.log(alarms);
        setAlarmData(alarms);
      } catch (error) {
        console.error("Erro ao buscar alarmes:", error);
        setAlarmData([]);
      } finally {
        setIsLoadingAlarms(false);
      }
    },
    [line, ts]
  );

  useEffect(() => {
    if (selection.originalIndex !== null) fetchAlarmsForIndex(selection.originalIndex);
  }, [selection.originalIndex, fetchAlarmsForIndex]);

  const selectHour = useCallback(
    (hour, filteredIndex) => {
      const originalIndex = filteredIndexToOriginal(filteredIndex);
      setSelection({ hour, filteredIndex, originalIndex });
    },
    [filteredIndexToOriginal]
  );

  const clearSelection = useCallback(() => {
    setSelection({ hour: null, filteredIndex: null, originalIndex: null });
    setAlarmData([]);
  }, []);

  return { selection, alarmData, isLoadingAlarms, filteredData, selectHour, clearSelection };
};

export const useMaquinasByLine = (line) => {
  const [maquinas, setMaquinas] = useState([]);

  useEffect(() => {
    if (!line) {
      setMaquinas([]);
      return;
    }
    (async () => {
      try {
        const response = await fetchMaquinas({ linha: line });
        if (response && response.success && Array.isArray(response.data)) {
          setMaquinas(response.data.map((item) => item.maquina));
        } else {
          setMaquinas([]);
        }
      } catch (error) {
        console.error("Erro ao buscar máquinas:", error);
        setMaquinas([]);
      }
    })();
  }, [line]);

  return maquinas;
};

export const useMantenedores = () => {
  const [mantenedores, setMantenedores] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetchMantenedores();
        setMantenedores(response && response.success && Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erro ao buscar mantenedores:", error);
        setMantenedores([]);
      }
    })();
  }, []);

  return mantenedores;
};

export const useLancamentos = (date, line, hour) => {
  const [lancamentos, setLancamentos] = useState([]);

  const refetch = useCallback(async () => {
    try {
      const filters = { linha: line, dataSelecionada: date, ...(hour && { horaSelecionada: hour }) };
      const data = await fetchJustificativasPorHora(filters);
      console.log(data);
      setLancamentos(data);
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    }
  }, [date, line, hour]);

  useEffect(() => {
    if (date && line) refetch();
  }, [refetch, date, line]);

  return { lancamentos, refetch };
};
