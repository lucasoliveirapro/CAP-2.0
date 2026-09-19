import { createContext, useContext, useEffect, useRef, useState } from "react";

const API_HOST = "172.29.141.101";
const API_PORT = "3001";
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

const AuthContext = createContext();

// Module-level reference to the current session's `getValidToken`, so plain
// (non-hook) modules such as the HTTP client can obtain a fresh token
// without needing access to React context.
let tokenProvider = null;
const setTokenProvider = (provider) => {
  tokenProvider = provider;
};

// Standalone accessor mirroring `useAuth().getValidToken`, used by code that
// runs outside of React components (e.g. `api.methods.js`).
export const getValidToken = async () => {
  if (!tokenProvider) throw new Error("Token provider não definido");
  return await tokenProvider();
};

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const nowInSeconds = Date.now() / 1000;
    return payload.exp < nowInSeconds;
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken"));
  const isAuthenticated = !!accessToken;

  const accessTokenRef = useRef(accessToken);
  const refreshTokenRef = useRef(refreshToken);
  useEffect(() => {
    accessTokenRef.current = accessToken;
    refreshTokenRef.current = refreshToken;
  }, [accessToken, refreshToken]);

  const refreshAccessToken = async () => {
    const currentRefreshToken = refreshTokenRef.current;
    if (!currentRefreshToken) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/authentication/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      if (!response.ok) throw new Error("Refresh token inválido");
      const data = await response.json();
      setAccessToken(data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error("Falha ao renovar access token:", error.message);
      logout();
      return null;
    }
  };

  const getValidTokenInternal = async () => {
    const currentAccessToken = accessTokenRef.current;
    const currentRefreshToken = refreshTokenRef.current;
    if (!currentAccessToken) {
      if (!currentRefreshToken) {
        console.log("❌ Sem tokens, erro");
        throw new Error("Sessão expirada");
      }
      console.log("🔄 Sem accessToken, fazendo refresh");
      return await refreshAccessToken();
    }
    if (isTokenExpired(currentAccessToken)) {
      console.log("⏰ Token expirado, renovando...");
      return await refreshAccessToken();
    }
    return currentAccessToken;
  };

  const login = async (matricula, senha) => {
    if (!matricula || !senha) throw new Error("Matrícula e senha obrigatórios");
    const response = await fetch(`${API_BASE_URL}/authentication/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, senha }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao fazer login");
    }
    const data = await response.json();
    setUser(data.usuario);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.usuario));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setTokenProvider(getValidTokenInternal);
    console.log("✅ Token provider atualizado após login");
    return data;
  };

  const register = async ({ matricula, nome, sobrenome, area }) => {
    if (!matricula || !nome || !sobrenome || !area) throw new Error("Todos os campos são obrigatórios");
    const registerResponse = await fetch(`${API_BASE_URL}/authentication/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, nome, sobrenome, area }),
    });
    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      throw new Error(errorData.error || "Erro ao cadastrar usuário");
    }
    const loginResponse = await fetch(`${API_BASE_URL}/authentication/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, senha: matricula }),
    });
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(errorData.error || "Erro ao fazer login após cadastro");
    }
    const data = await loginResponse.json();
    setUser(data.usuario);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.usuario));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setTokenProvider(getValidTokenInternal);
    console.log("✅ Token provider atualizado após register");
    return data;
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    try {
      await fetch(`${API_BASE_URL}/authentication/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessTokenRef.current}` },
      });
    } catch (error) {
      console.warn("Logout no backend falhou:", error.message);
    }
  };

  useEffect(() => {
    console.log("Inicializando token provider");
    setTokenProvider(getValidTokenInternal);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        accessToken,
        login,
        logout,
        register,
        getValidToken: getValidTokenInternal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { API_BASE_URL };
