import { useEffect, useRef } from "react";
import ReactApexChart from "react-apexcharts";
import { useCap } from "./CapProvider";
import { CHART_SERIES_COLORS } from "../../constants/capConstant";

const OK_ICON_URL = "/assets/ok-icon-lS0O9rkc.png";

export const ProductionChart = () => {
  const { filteredChartData, hourSelection, uiState, rowSelection } = useCap();
  const containerRef = useRef(null);

  useEffect(() => {
    if (hourSelection.selection.hour && uiState.activeTab === "justificar" && containerRef.current) {
      requestAnimationFrame(() => {
        containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [uiState.activeTab, hourSelection.selection.hour]);

  const handleBarClick = (hour, index) => {
    if (hour === hourSelection.selection.hour) {
      hourSelection.clearSelection();
      uiState.setHasPendingChanges(false);
      return;
    }
    if (rowSelection.hasSelection()) {
      uiState.requestHourChange(hour, index);
      return;
    }
    hourSelection.selectHour(hour, index);
  };

  const maxStackedValue = Math.max(
    ...filteredChartData.hours.map((_, index) =>
      filteredChartData.chartSeries.reduce((sum, series) => sum + (series.data[index] || 0), 0)
    )
  );

  const chartOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      animations: { enabled: false },
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          handleBarClick(filteredChartData.hours[config.dataPointIndex], config.dataPointIndex);
        },
      },
    },
    colors: filteredChartData.chartSeries.map((series) => CHART_SERIES_COLORS[series.name] || "#999"),
    xaxis: {
      categories: filteredChartData.hours,
      labels: { hideOverlappingLabels: true, trim: true, maxHeight: 120, style: { fontSize: "10px" } },
    },
    yaxis: { min: 0, max: maxStackedValue },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "40%" } },
    legend: { position: "bottom", fontSize: "10px", labels: { colors: "#333", useSeriesColors: false } },
    tooltip: { shared: true, intersect: false },
    annotations: {
      points: filteredChartData.hours
        .map((hour, index) => {
          const hasUnjustified = filteredChartData.chartSeries.some(
            (series) => series.name === "NÃO JUSTIFICADO" && (series.data[index] || 0) > 0
          );
          if (hasUnjustified) return null;
          return {
            x: hour,
            y: filteredChartData.chartSeries.reduce((sum, series) => sum + (series.data[index] || 0), 0),
            marker: { size: 0 },
            image: { path: OK_ICON_URL, width: 15, height: 15, offsetY: -10 },
          };
        })
        .filter(Boolean),
    },
  };

  return (
    <div className="cap__chart-container" ref={containerRef}>
      <h2 className="cap__title">Produção por Hora</h2>
      {filteredChartData.hours.length ? (
        <ReactApexChart options={chartOptions} series={filteredChartData.chartSeries} type="bar" height={170} width="100%" style={{ marginTop: "25px" }} />
      ) : (
        <div className="cap__chart-empty">Nenhum dado disponível</div>
      )}
    </div>
  );
};
