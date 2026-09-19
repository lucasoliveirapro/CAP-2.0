import { useCallback, useRef, useState } from "react";

export const useRowSelection = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const selectedRowsRef = useRef([]);

  const handleSelectionChange = useCallback((rows) => {
    setSelectedRows(rows);
    selectedRowsRef.current = rows;
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
    selectedRowsRef.current = [];
  }, []);

  const hasSelection = useCallback(() => selectedRowsRef.current.length > 0, []);

  return { selectedRows, selectedRowsRef, hasSelection, handleSelectionChange, clearSelection };
};

export const useCapUiState = () => {
  const [activeTab, setActiveTab] = useState("lancamentos");
  const [showJustifyTab, setShowJustifyTab] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingHour, setPendingHour] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [selectedJustificativaId, setSelectedJustificativaId] = useState(null);

  const openJustifyTab = useCallback(() => {
    setActiveTab("justificar");
    setShowJustifyTab(true);
  }, []);

  const closeJustifyTab = useCallback(() => {
    setActiveTab("lancamentos");
    setShowJustifyTab(false);
  }, []);

  const openValidationModal = useCallback((id) => {
    setSelectedJustificativaId(id);
  }, []);

  const closeValidationModal = useCallback(() => {
    setSelectedJustificativaId(null);
  }, []);

  const requestHourChange = useCallback((hour, index) => {
    setPendingHour({ hour, index });
    setShowConfirmModal(true);
  }, []);

  const confirmHourChange = useCallback(
    (applyChange) => {
      if (pendingHour && applyChange) applyChange(pendingHour);
      setPendingHour(null);
      setShowConfirmModal(false);
    },
    [pendingHour]
  );

  const cancelHourChange = useCallback(() => {
    setPendingHour(null);
    setShowConfirmModal(false);
  }, []);

  return {
    activeTab,
    setActiveTab,
    showJustifyTab,
    hasPendingChanges,
    setHasPendingChanges,
    selectedJustificativaId,
    openJustifyTab,
    closeJustifyTab,
    openValidationModal,
    closeValidationModal,
    pendingHour,
    showConfirmModal,
    requestHourChange,
    confirmHourChange,
    cancelHourChange,
  };
};
