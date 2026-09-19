import { io } from "socket.io-client";

const API_HOST = "172.29.141.101";
const API_PORT = "3001";

// Shared Socket.IO connection used by every realtime feature in the app
// (Andon synoptic, FMS, production data, tc data, ...).
export const socket = io(`http://${API_HOST}:${API_PORT}`, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
  forceNew: false,
  transports: ["websocket", "polling"],
});
