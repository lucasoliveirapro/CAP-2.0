// Local mock of the CAP backend, for development and testing only.
// It never talks to the real Stellantis network - everything lives in memory
// and resets when the process restarts.
//
// Usage:
//   npm run mock
//   (in another terminal) VITE_API_BASE_URL=http://localhost:3001 npm run dev
//
// Login with matricula/senha "98397" / "98397" (or anything - the mock
// accepts any non-empty credentials).

import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = 3001;

const STATUS = {
  PENDENTE_VALIDACAO: { id: 1, nome: "PENDENTE_VALIDACAO", texto: "Pendente" },
  FINALIZADA: { id: 2, nome: "FINALIZADA", texto: "Finalizada" },
  EM_REVISAO: { id: 3, nome: "EM_REVISAO", texto: "Em revisão" },
};

const LINE = "SCC";
const TODAY = new Date().toISOString().split("T")[0];

// --- Production chart data (12 hourly buckets) -----------------------------
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 6).padStart(2, "0") + ":00");
const TURNOS = HOURS.map((_, i) => (i < 4 ? "TURNO 1" : i < 8 ? "TURNO 2" : "TURNO 3"));
const TS = HOURS.map((_, i) => {
  const start = new Date(`${TODAY}T00:00:00`);
  start.setHours(i + 6);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return [start.toISOString(), end.toISOString()];
});
const CHART_SERIES = [
  { name: "REALIZADO", data: HOURS.map(() => Math.round(Math.random() * 40 + 20)) },
  { name: "MANUTENÇÃO", data: HOURS.map(() => Math.round(Math.random() * 10)) },
  { name: "NÃO JUSTIFICADO", data: HOURS.map((_, i) => (i === 3 ? 15 : 0)) },
];

// --- Alarms (raw events feeding the events table) ---------------------------
const alarms = new Map(
  [
    {
      id: 1,
      line: LINE,
      station: "ST10",
      element: "ROBO_01",
      alarm: "FALHA NO SENSOR DE GIRO",
      priority: "Alta",
      losstime_min: 8.3,
      qtd_ocorrencias: 2,
      start_time: `${TODAY}T09:00:00Z`,
      end_time: `${TODAY}T09:08:00Z`,
      is_used: false,
    },
    {
      id: 2,
      line: LINE,
      station: "ST11",
      element: "ROBO_02",
      alarm: "MAU CONTATO",
      priority: "Média",
      losstime_min: 4.2,
      qtd_ocorrencias: 1,
      start_time: `${TODAY}T09:10:00Z`,
      end_time: `${TODAY}T09:14:00Z`,
      is_used: false,
    },
    {
      id: 3,
      line: LINE,
      station: "ST12",
      element: "ROBO_03",
      alarm: "FALTA APERTO / TORQUE",
      priority: "Baixa",
      losstime_min: 2.5,
      qtd_ocorrencias: 3,
      start_time: `${TODAY}T09:20:00Z`,
      end_time: `${TODAY}T09:23:00Z`,
      is_used: false,
    },
  ].map((a) => [a.id, a])
);

const maquinas = ["ROBO_01", "ROBO_02", "ROBO_03"];
const mantenedores = [
  { id: 1, mantenedor: "Carlos Souza" },
  { id: 2, mantenedor: "Ana Lima" },
];

// --- Justificativas (created through the app) -------------------------------
const justificativas = new Map();

const seed = () => {
  const id = randomUUID();
  const now = new Date().toISOString();
  justificativas.set(id, {
    id,
    linha: LINE,
    data: TODAY,
    hora: "09:00",
    duracao: 12.5,
    maquina: "ROBO_01",
    responsavel: "João Silva",
    status: STATUS.PENDENTE_VALIDACAO,
    validador: "-",
    interventor: null,
    alarms: [1],
    historico: [
      {
        id: randomUUID(),
        causaRaiz: "FALHA EQUIPAMENTO ( MICROPARADAS/ QUEBRA)",
        tipoPerdaCap: "TEMPO DE QUEBRA",
        maquina: "ROBO_01",
        componente: "SERVOMOTOR",
        descricao: "FALHA NO SENSOR DE GIRO",
        comentario: null,
        responsavel: "João Silva",
        criadoEm: now,
        criador: { nome: "João Silva" },
      },
    ],
    grafo: null,
    criadoEm: now,
  });
};
seed();

// --- HTTP plumbing -----------------------------------------------------------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS_HEADERS });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

const toLancamento = (j) => {
  const latest = j.historico[j.historico.length - 1];
  return {
    id: j.id,
    data: j.data,
    hora: j.hora,
    descricao: latest.descricao,
    maquina: j.maquina,
    duracao: j.duracao,
    causaRaiz: latest.causaRaiz,
    tipoPerdaCap: latest.tipoPerdaCap,
    responsavel: j.responsavel,
    status: j.status,
    validador: j.validador,
    alarms: j.alarms,
    criadoEm: j.criadoEm,
  };
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  console.log(req.method, url.pathname + url.search);

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  // --- auth ---
  if (url.pathname === "/authentication/login" && req.method === "POST") {
    const { matricula, senha } = await readBody(req);
    if (!matricula || !senha) return send(res, 401, { error: "Credenciais inválidas" });
    return send(res, 200, {
      usuario: { nome: `Usuário ${matricula}`, matricula },
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
    });
  }
  if (url.pathname === "/authentication/refresh-token" && req.method === "POST") {
    return send(res, 200, { accessToken: `mock-access-${Date.now()}` });
  }
  if (url.pathname === "/authentication/logout" && req.method === "POST") {
    return send(res, 200, {});
  }

  // --- CAP: read endpoints ---
  if (url.pathname === "/cap/producao") {
    return send(res, 200, { data: { hours: HOURS, ts: TS, chartSeries: CHART_SERIES, turnos: TURNOS } });
  }
  if (url.pathname === "/cap/alarms") {
    return send(res, 200, { data: [...alarms.values()] });
  }
  if (url.pathname === "/cap/justificativas") {
    return send(res, 200, { data: [...justificativas.values()].map(toLancamento) });
  }
  if (url.pathname === "/cap/maquinas") {
    return send(res, 200, { success: true, data: maquinas.map((maquina) => ({ maquina })) });
  }
  if (url.pathname === "/cap/mantenedores") {
    return send(res, 200, { success: true, data: mantenedores });
  }
  if (url.pathname === "/cap/alarmes/disponiveis-para-alocacao") {
    const relatedAlarmes = [
      {
        id: 101,
        maquina: "ROBO_02",
        matricula: "12345",
        status: { nome: "PENDENTE_VALIDACAO", texto: "Pendente" },
        tempo_disponivel: 6,
        data: TODAY,
        hora: "08:00",
        duracao: 6,
        causa_raiz: "FALTA PEÇA LADO LINHA (LOGISTICA INTERNA)",
        componente: "RACK",
        modo_falha: "FALTANTE",
        comentario: null,
        linha: LINE,
      },
    ];
    return send(res, 200, { data: { alarmes: relatedAlarmes, linhas: [LINE], horas: ["08:00", "09:00"] } });
  }
  const byId = url.pathname.match(/^\/cap\/justificativa\/([^/]+)$/);
  if (byId && req.method === "GET") {
    const justificativa = justificativas.get(byId[1]);
    if (!justificativa) return send(res, 404, { error: "Justificativa não encontrada" });
    return send(res, 200, { data: justificativa });
  }

  // --- CAP: write endpoints ---
  if (url.pathname === "/cap/justificativa" && req.method === "POST") {
    const payload = await readBody(req);
    console.log("payload recebido:", payload);
    const id = randomUUID();
    const now = new Date().toISOString();
    payload.alarms?.forEach((alarmId) => {
      const alarm = alarms.get(alarmId);
      if (alarm) alarm.is_used = true;
    });
    justificativas.set(id, {
      id,
      linha: payload.linha || LINE,
      data: payload.data || TODAY,
      hora: payload.horaselecionada || "09:00",
      duracao: payload.dur_min || 0,
      maquina: payload.maquina || "",
      responsavel: "Usuário Mock",
      status: STATUS.PENDENTE_VALIDACAO,
      validador: "-",
      interventor: null,
      alarms: payload.alarms || [],
      historico: [
        {
          id: randomUUID(),
          causaRaiz: payload.causa_raiz,
          tipoPerdaCap: payload.tipo_perda_cap,
          maquina: payload.maquina,
          componente: payload.componente,
          descricao: payload.descricao,
          comentario: payload.comentario,
          responsavel: "Usuário Mock",
          criadoEm: now,
          criador: { nome: "Usuário Mock" },
        },
      ],
      grafo: null,
      criadoEm: now,
    });
    return send(res, 200, { success: true, id });
  }
  const approveMatch = url.pathname.match(/^\/cap\/justificativa\/([^/]+)\/aprovacao$/);
  if (approveMatch && req.method === "POST") {
    const justificativa = justificativas.get(approveMatch[1]);
    if (!justificativa) return send(res, 404, { error: "Justificativa não encontrada" });
    justificativa.status = STATUS.FINALIZADA;
    justificativa.validador = "Usuário Mock";
    return send(res, 200, { success: true });
  }
  const changesMatch = url.pathname.match(/^\/cap\/justificativa\/([^/]+)\/alteracao$/);
  if (changesMatch && req.method === "POST") {
    const justificativa = justificativas.get(changesMatch[1]);
    if (!justificativa) return send(res, 404, { error: "Justificativa não encontrada" });
    const changes = await readBody(req);
    const latest = justificativa.historico[justificativa.historico.length - 1];
    justificativa.historico.push({
      id: randomUUID(),
      causaRaiz: changes.causa_raiz ?? latest.causaRaiz,
      tipoPerdaCap: changes.tipo_perda_cap ?? latest.tipoPerdaCap,
      maquina: changes.maquina ?? latest.maquina,
      componente: changes.componente ?? latest.componente,
      descricao: changes.modo_falha ?? latest.descricao,
      comentario: changes.comentario ?? "",
      responsavel: "Usuário Mock (validador)",
      criadoEm: new Date().toISOString(),
      criador: { nome: "Usuário Mock (validador)" },
    });
    if (changes.dur_min != null) justificativa.duracao = changes.dur_min;
    justificativa.status = STATUS.EM_REVISAO;
    justificativa.validador = "Usuário Mock";
    return send(res, 200, { success: true });
  }

  return send(res, 404, { error: `mock: sem rota para ${req.method} ${url.pathname}` });
});

server.listen(PORT, () => console.log(`Mock CAP backend rodando em http://localhost:${PORT}`));
