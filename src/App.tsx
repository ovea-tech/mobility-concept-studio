import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "./pages/NotFound";

import CustomerDashboard from "./pages/CustomerDashboard";
import StudioDashboard from "./pages/StudioDashboard";
import ProjectList from "./pages/projects/ProjectList";
import ProjectDetail from "./pages/projects/ProjectDetail";
import CreateProjectPage from "./pages/projects/CreateProjectPage";
import MunicipalityList from "./pages/studio/MunicipalityList";
import PackList from "./pages/studio/PackList";
import RuleList from "./pages/studio/RuleList";
import OrganizationList from "./pages/admin/OrganizationList";
import AuditLog from "./pages/admin/AuditLog";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/studio/dashboard" element={<StudioDashboard />} />

            {/* Customer Product */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/new" element={<CreateProjectPage />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />

            {/* Pack Studio */}
            <Route path="/studio/municipalities" element={<MunicipalityList />} />
            <Route path="/studio/municipalities/new" element={<PlaceholderPage title="Kommune anlegen" description="Formular wird über Dialog geöffnet" />} />
            <Route path="/studio/documents" element={<PlaceholderPage title="Quelldokumente" description="Verwaltung von Quellverordnungen und Satzungen" />} />
            <Route path="/studio/packs" element={<PackList />} />
            <Route path="/studio/packs/new" element={<PlaceholderPage title="Regelpaket anlegen" description="Formular wird über Dialog geöffnet" />} />
            <Route path="/studio/rules" element={<RuleList />} />
            <Route path="/studio/rule-sets" element={<PlaceholderPage title="Regelsets" description="Gruppierung von Regeln zu Sets" />} />
            <Route path="/studio/reviews" element={<PlaceholderPage title="Prüfungen" description="Pack-Prüfungen und Freigaben" />} />
            <Route path="/studio/tests" element={<PlaceholderPage title="Tests" description="Testfälle und Testläufe" />} />
            <Route path="/studio/releases" element={<PlaceholderPage title="Releases" description="Pack-Veröffentlichungen" />} />

            {/* Admin */}
            <Route path="/admin/organizations" element={<OrganizationList />} />
            <Route path="/admin/workspaces" element={<PlaceholderPage title="Arbeitsbereiche" description="Workspace-Verwaltung" />} />
            <Route path="/admin/roles" element={<PlaceholderPage title="Rollen" description="Plattform-Rollenverwaltung" />} />
            <Route path="/admin/audit" element={<AuditLog />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
