import { useCap } from "./CapProvider";
import { EventsTable } from "./EventsTable";
import { JustificationForm } from "./JustificationForm";

export const JustifyTabPanel = () => {
  const { hourSelection, filteredTableData, rowSelection, filters, maquinas, handleSaved, uiState } = useCap();

  return (
    <div className="cap__tab-panel" style={{ display: "flex" }}>
      <div className="cap-table-section" style={{ flex: 1 }}>
        <EventsTable
          hour={hourSelection.selection.hour}
          data={filteredTableData}
          onSelectionChange={rowSelection.handleSelectionChange}
          selectedRows={rowSelection.selectedRows}
          onClearSelections={rowSelection.clearSelection}
          onPendingChange={uiState.setHasPendingChanges}
          isLoading={hourSelection.isLoadingAlarms}
        />
      </div>
      {rowSelection.selectedRows.length > 0 && (
        <div className="cap-details-section" style={{ flex: 1 }}>
          <JustificationForm
            selectedRows={rowSelection.selectedRows}
            selectedHour={hourSelection.selection.hour}
            selectedDate={filters.date}
            maquinas={maquinas}
            onReset={() => {
              rowSelection.clearSelection();
              uiState.closeJustifyTab();
            }}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
};
