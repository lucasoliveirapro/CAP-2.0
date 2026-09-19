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

## Rodando

```bash
npm install
npm run dev
```

A API é esperada em `http://172.29.141.101:3001` (mesmo host hardcoded no bundle original).
