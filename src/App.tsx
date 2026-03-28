import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";

import CustomerDashboard from "./pages/CustomerDashboard";
import StudioDashboard from "./pages/StudioDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProjectList from "./pages/projects/ProjectList";
import NewProject from "./pages/projects/NewProject";
import ProjectDetail from "./pages/projects/ProjectDetail";
import MunicipalityList from "./pages/studio/MunicipalityList";
import PackList from "./pages/studio/PackList";
import PackDetail from "./pages/studio/PackDetail";
import OrganizationList from "./pages/admin/OrganizationList";
import AuditLog from "./pages/admin/AuditLog";
import PlaceholderPage from "./pages/PlaceholderPage";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/auth/login" element={<Login />} />

          {/* Protected */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />

            {/* Customer */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />

            {/* Pack Studio */}
            <Route path="/studio/dashboard" element={<StudioDashboard />} />
            <Route path="/studio/municipalities" element={<MunicipalityList />} />
            <Route path="/studio/packs" element={<PackList />} />
            <Route path="/studio/packs/:id" element={<PackDetail />} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/organizations" element={<OrganizationList />} />
            <Route path="/admin/users" element={<PlaceholderPage title="Benutzer" description="Benutzerverwaltung" />} />
            <Route path="/admin/roles" element={<PlaceholderPage title="Rollen" description="Plattform-Rollenverwaltung" />} />
            <Route path="/admin/audit" element={<AuditLog />} />

            {/* Profile */}
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
