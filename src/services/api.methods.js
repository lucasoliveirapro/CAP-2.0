import { getValidToken } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

async function handleResponse(response) {
  let data = null;
  try {
    data = await response.json();
    console.log("📦 Resposta da API:", { status: response.status, ok: response.ok, data });
  } catch (parseError) {
    console.error("❌ Erro ao parsear JSON da resposta:", parseError);
    try {
      const text = await response.text();
      console.log("Texto da resposta (não JSON):", text.substring(0, 500));
    } catch (textError) {
      console.error("Não foi possível ler o texto da resposta:", textError);
    }
  }

  if (response.status === 401) {
    console.error("🔒 Erro 401 - Não autenticado");
    window.dispatchEvent(new CustomEvent("token-expired"));
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/") window.location.href = "/";
    const error = new Error(data?.error || data?.message || "Sessão expirada. Faça login novamente.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (response.status === 403) {
    console.error("🚫 Erro 403 - Operação não autorizada");
    const error = new Error(data?.error || data?.message || "Sem permissão para realizar esta operação.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (!response.ok) {
    console.error(`❌ Requisição falhou com status ${response.status}`);
    const message = data?.error || data?.message || `Erro HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function post(path, payload) {
  const url = `${API_BASE_URL}${path}`;
  const token = await getValidToken();
  const isFormData = payload instanceof FormData;
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function get(path, params = {}, token = null) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== "")
  );
  const query = new URLSearchParams(cleanParams).toString();
  const url = `${API_BASE_URL}${path}${query ? `?${query}` : ""}`;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { method: "GET", headers });
  return handleResponse(response);
}
