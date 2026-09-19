import { useCallback, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { approveJustificativa, requestJustificativaChanges } from "../../../services/cap.http";

export function useJustificativaActions() {
  const { getValidToken } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approve = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);
        await getValidToken(); // ensures the session token is fresh before mutating
        const result = await approveJustificativa(id);
        showToast("Justificativa aprovada com sucesso ✅", "success");
        return result;
      } catch (err) {
        const message = err?.response?.data?.error || err?.message || "Erro ao aprovar";
        setError(message);
        showToast(message, "error");
        return { error: true, message, status: err?.response?.status };
      } finally {
        setLoading(false);
      }
    },
    [getValidToken, showToast]
  );

  const requestChanges = useCallback(
    async (id, changes) => {
      try {
        setLoading(true);
        setError(null);
        await getValidToken();
        const result = await requestJustificativaChanges(id, changes);
        showToast("Alteração solicitada com sucesso ✏️", "info");
        return result;
      } catch (err) {
        const message = err?.response?.data?.error || err?.message || "Erro ao solicitar alteração";
        setError(message);
        showToast(message, "error");
        return { error: true, message, status: err?.response?.status };
      } finally {
        setLoading(false);
      }
    },
    [getValidToken, showToast]
  );

  return { approve, requestChanges, loading, error };
}
