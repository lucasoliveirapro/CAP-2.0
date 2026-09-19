import { get, post } from "./api.methods";
import { API_BASE_URL } from "../config";

// The three fetchers below talk to the API with a bare `fetch` (no auth
// header, no shared error shaping) instead of the `api.methods` helpers -
// mirroring how they were originally colocated with the app's vendor/shared
// chunk rather than with the rest of the CAP-specific endpoints above.
export async function fetchProducaoPorHora(line, date) {
  if (!line || !date) throw new Error("Parâmetros line e date são obrigatórios");
  const url = `${API_BASE_URL}/cap/producao?line=${line}&date=${date}`;
  const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
  if (!response.ok) throw new Error("Erro ao buscar produção");
  const data = await response.json();
  console.log("Resposta da API de produção:", data);
  return data.data;
}

export async function fetchAlarms(line, [start, end]) {
  const url = `${API_BASE_URL}/cap/alarms?line=${line}&start=${start}&end=${end}`;
  console.log("ENDPOINT: ", url);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erro ao consultar CAP ALARMS");
  const data = await response.json();
  console.log("Resposta da API de alarms:", data);
  return data.data;
}

export async function fetchJustificativasPorHora(filters = {}) {
  console.log("buscando justificativas...");
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value != null && value !== "")
  );
  const query = new URLSearchParams(cleanFilters).toString();
  const url = `${API_BASE_URL}/cap/justificativas${query ? `?${query}` : ""}`;
  console.log(url);
  const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
  if (!response.ok) throw new Error("Erro ao buscar justificativas");
  return (await response.json()).data;
}

export function fetchHistory({ startDate, endDate }) {
  if (!startDate || !endDate) throw new Error("startDate e endDate são obrigatórios");
  return get("/cap/history", { startDate, endDate });
}

export async function createJustificativa(payload) {
  if (!payload) throw new Error("Payload da justificativa não fornecido");
  console.log("payload criação: ", payload);
  return post("/cap/justificativa", payload);
}

export async function approveJustificativa(id) {
  if (!id) throw new Error("ID da justificativa não fornecido");
  console.log("Aprovando justificativa com ID:", id);
  return post(`/cap/justificativa/${id}/aprovacao`, {});
}

export async function requestJustificativaChanges(id, changes) {
  if (!id) throw new Error("ID da justificativa não fornecido");
  return post(`/cap/justificativa/${id}/alteracao`, changes);
}

export async function fetchJustificativasPendentes(filters = {}) {
  console.log("Buscando justificativas pendentes...");
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value != null && value !== "")
  );
  const response = await get("/cap/justificativas/pendencias", cleanFilters);
  return response?.data ?? {};
}

export async function fetchValidacoesPendentes(filters = {}) {
  console.log("Buscando validações pendentes...");
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value != null && value !== "")
  );
  const response = await get("/cap/validacao/pendencias", cleanFilters);
  return response?.data ?? {};
}

export async function fetchAlarmesDisponiveisParaAlocacao({ linha, causa, ts_inicio, horas = 3 }) {
  return get("/cap/alarmes/disponiveis-para-alocacao", { linha, causa, ts_inicio, horas });
}

export function fetchMaquinas(filters = {}) {
  console.log("buscando máquinas...");
  return get("/cap/maquinas", filters);
}

export function fetchMantenedores() {
  console.log("buscando mantenedores...");
  return get("/cap/mantenedores");
}

export async function fetchJustificativaById(id) {
  if (!id) throw new Error("ID da justificativa não fornecido");
  try {
    return await get(`/cap/justificativa/${id}`);
  } catch (error) {
    throw error?.status === 404
      ? new Error("Justificativa não encontrada")
      : new Error("Erro ao buscar justificativa");
  }
}
