// The production backend lives on the Stellantis internal network and is
// only reachable from inside it. For local development against a mock
// server, override it with a `.env.local` file:
//
//   VITE_API_BASE_URL=http://localhost:3001
//
const DEFAULT_API_BASE_URL = "http://172.29.141.101:3001";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
