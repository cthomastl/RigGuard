import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { EquipmentDetailPage } from "./pages/EquipmentDetailPage";
import { AlertsPage } from "./pages/AlertsPage";
import { InspectionsPage } from "./pages/InspectionsPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";
import { PredictionsPage } from "./pages/PredictionsPage";
import { UsersPage } from "./pages/UsersPage";
import { useAuthStore } from "./services/store";
import { authApi } from "./services/api";

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      authApi.me().then(r => setAuth(r.data, token)).catch(() => logout());
    }
  }, [token, user, setAuth, logout]);

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="equipment/:id" element={<EquipmentDetailPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="inspections" element={<InspectionsPage />} />
            <Route path="work-orders" element={<WorkOrdersPage />} />
            <Route path="predictions" element={<PredictionsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
