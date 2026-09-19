import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { DevLogin } from "./DevLogin";
import CapPage from "./pages/Cap";

// This app was reconstructed starting from the `/cap/justificar/:line` route.
// The full Stellantis SPA has many other lazily-loaded routes (dashboards,
// Andon synoptic, cycle time, etc.) that live outside the scope of the CAP
// module and were not part of this reconstruction. The real login screen is
// part of that wider app too - `DevLogin` below is local-only scaffolding.
const AuthGate = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <DevLogin />;
};

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route path="/cap/justificar/:line?" element={<CapPage />} />
            <Route path="*" element={<Navigate to="/cap/justificar/SCC" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </ToastProvider>
  </AuthProvider>
);

export default App;
