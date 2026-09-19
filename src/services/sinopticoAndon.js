import { socket } from "../lib/socket";

const EVENTS = {
  SINOPTICO_ANDON: "sinopticoAndon",
};

export function subscribeSinopticoAndon({ view, line }) {
  socket.emit(EVENTS.SINOPTICO_ANDON, { action: "subscribe", view, line });
}

export function unsubscribeSinopticoAndon({ view, line }) {
  socket.emit(EVENTS.SINOPTICO_ANDON, { action: "unsubscribe", view, line });
}

export function onSinopticoAndonUpdate(handler) {
  socket.on(`${EVENTS.SINOPTICO_ANDON}:update`, handler);
}

export function offSinopticoAndonUpdate(handler) {
  socket.off(`${EVENTS.SINOPTICO_ANDON}:update`, handler);
}
