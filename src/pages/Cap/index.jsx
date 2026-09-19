import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CapProvider, useCap } from "./CapProvider";
import { CapFilters } from "./CapFilters";
import { CapTabs } from "./CapTabs";
import { ProductionChart } from "./ProductionChart";
import { JustifyTabPanel } from "./JustifyTabPanel";
import { LancamentosTable } from "./LancamentosTable";
import { ConfirmHourChangeModal, ValidationModal } from "./CapModals";
import { SkeletonBox, SkeletonLine } from "../../components/Skeleton";
import "./Cap.css";

const CapPageContent = () => {
  const { chartData, uiState, hourSelection, lancamentos } = useCap();

  if (chartData.isLoading && !chartData.hours.length) {
    return (
      <div className="cap__loading">
        <SkeletonBox height={200} />
        <div style={{ marginTop: "70px" }}>
          <SkeletonLine width="60%" />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine width="80%" />
          <SkeletonLine />
          <SkeletonLine width="50%" />
          <SkeletonLine width="80%" />
          <SkeletonLine />
          <SkeletonLine width="80%" />
        </div>
      </div>
    );
  }

  if (chartData.error) {
    return <div className="cap__error">Erro: {chartData.error}</div>;
  }

  return (
    <div className="cap">
      <CapFilters />
      <ProductionChart />
      <div className="cap__content">
        <CapTabs />
        <div className="cap__tab-content">
          {uiState.activeTab === "justificar" && <JustifyTabPanel />}
          {uiState.activeTab === "lancamentos" && (
            <LancamentosTable
              lancamentos={lancamentos || []}
              onAddJustificativa={uiState.openJustifyTab}
              selectedHour={hourSelection.selection.hour}
              onRowClick={uiState.openValidationModal}
            />
          )}
        </div>
      </div>
      <ConfirmHourChangeModal />
      <ValidationModal />
    </div>
  );
};

const CapPage = () => {
  const { line } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (line) {
      const upperLine = line.toUpperCase();
      if (upperLine !== line) navigate(`/cap/justificar/${upperLine}`, { replace: true });
    }
  }, [line, navigate]);

  return (
    <CapProvider lineParam={line}>
      <CapPageContent />
    </CapProvider>
  );
};

export default CapPage;
