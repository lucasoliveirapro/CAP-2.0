import { useState } from "react";
import { useAuth } from "./context/AuthContext";

// Minimal login gate for running this repo standalone in development.
// The real login screen belongs to the wider Stellantis app (outside the
// scope of the CAP module reconstruction) - this only exists so the app
// can obtain a token from `mock/server.mjs` for local testing.
export const DevLogin = () => {
  const { login } = useAuth();
  const [matricula, setMatricula] = useState("98397");
  const [senha, setSenha] = useState("98397");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(matricula, senha);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#eff2f8" }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 32, borderRadius: 16, width: 320, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#243782" }}>CAP 2.0 (dev)</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Login local contra o mock em `npm run mock`.</p>
        <input value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="Matrícula" style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd2da" }} />
        <input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" placeholder="Senha" style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd2da" }} />
        {error && <span style={{ color: "#dc3545", fontSize: 13 }}>{error}</span>}
        <button type="submit" disabled={loading} style={{ padding: 10, borderRadius: 8, border: "none", background: "#243782", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};
