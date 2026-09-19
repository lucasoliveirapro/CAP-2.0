import { io } from "socket.io-client";
import { API_BASE_URL } from "../config";

// Shared Socket.IO connection used by every realtime feature in the app
// (Andon synoptic, FMS, production data, tc data, ...).
export const socket = io(API_BASE_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
  forceNew: false,
  transports: ["websocket", "polling"],
});
