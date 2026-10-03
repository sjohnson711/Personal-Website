import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { email, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "4rem",
          color: "var(--color-slate)",
        }}
      >
        Loading…
      </div>
    );
  }

  return email ? <Outlet /> : <Navigate to="/gateway" replace />;
}
