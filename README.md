# CAP 2.0

Reconstrução em código-fonte legível do módulo **CAP** (Controle de Apontamento de Perdas) a
partir do build minificado (`assets/*.js`, `assets/*.css`) capturado do app em produção para a
rota `/cap/justificar/:linha`.

## Escopo

Este repositório cobre apenas o módulo CAP:

- `src/pages/Cap` — página de justificativa de eventos (gráfico de produção por hora, tabela de
  eventos, formulário de justificativa, modal de perda relacionada, tabela de lançamentos).
- `src/pages/Cap/CapValidacao` — página de validação/aprovação de justificativas (aprovar,
  propor alteração, histórico, grafo de causa e efeito).
- `src/services`, `src/context`, `src/hooks`, `src/constants`, `src/utils`, `src/components` —
  infraestrutura compartilhada usada pelo módulo (HTTP client, autenticação, toasts, Socket.IO,
  constantes de domínio).

O bundle original também carregava chunks de outras páginas do app maior (dashboard, Andon,
tempo de ciclo, etc. — visível em `Main-*.js` e nas rotas do chunk vendor). Esses chunks não
fazem parte do módulo CAP e não foram reconstruídos aqui; `src/App.jsx` monta apenas a rota do
CAP para fins de desenvolvimento/preview.

`AuthContext` e `ToastContext` foram reconstruídos a partir do chunk vendor compartilhado
(`index-*.js`) na medida em que o CAP depende deles (`getValidToken`, `useToast`). O ícone de
"limpar filtros" e demais imagens (`icon_pcm`, `icon_weld`, `stellantis-icon*`, `ok-icon`)
referenciados em `/assets/...` não foram fornecidos como binários — só os nomes de arquivo;
copie-os do build original para `public/assets/` se for rodar a aplicação de fato.

## Rodando contra o backend real

```bash
npm install
npm run dev
```

A API é esperada em `http://172.29.141.101:3001` por padrão (mesmo host do bundle original,
só acessível de dentro da rede interna). Isso é configurável por `VITE_API_BASE_URL` (veja
`.env.example`).

## Rodando com mock (sem rede interna)

Sem acesso à rede da Stellantis, use o backend fake em `mock/server.mjs` (dados em memória,
resetam a cada restart):

```bash
cp .env.example .env.local        # aponta VITE_API_BASE_URL pro mock
npm run mock                      # terminal 1 — sobe o mock na porta 3001
npm run dev                       # terminal 2 — sobe o app
```

Faça login com qualquer matrícula/senha (ex.: `98397` / `98397`) — o mock aceita qualquer
credencial não vazia. A tela de login (`src/DevLogin.jsx`) é um scaffold só para rodar este
repositório isoladamente; a tela de login de verdade pertence ao app maior, fora do escopo do
módulo CAP.
