import {
  FolderKanban, MapPin, FileText, Package, Scale, Layers,
  CheckCircle, FlaskConical, Building2, Briefcase, Shield,
  ScrollText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const customerItems: NavItem[] = [
  { title: "Projekte", url: "/projects", icon: FolderKanban },
];

const studioItems: NavItem[] = [
  { title: "Kommunen", url: "/studio/municipalities", icon: MapPin },
  { title: "Quelldokumente", url: "/studio/documents", icon: FileText },
  { title: "Packs", url: "/studio/packs", icon: Package },
  { title: "Rules", url: "/studio/rules", icon: Scale },
  { title: "Rule Sets", url: "/studio/rule-sets", icon: Layers },
  { title: "Reviews", url: "/studio/reviews", icon: CheckCircle },
  { title: "Tests", url: "/studio/tests", icon: FlaskConical },
];

const adminItems: NavItem[] = [
  { title: "Organisationen", url: "/admin/organizations", icon: Building2 },
  { title: "Workspaces", url: "/admin/workspaces", icon: Briefcase },
  { title: "Rollen", url: "/admin/roles", icon: Shield },
  { title: "Audit", url: "/admin/audit", icon: ScrollText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        {!collapsed ? (
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Mobility Compliance
          </span>
        ) : (
          <span className="text-sm font-bold text-sidebar-foreground">MC</span>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavSection label="Projekte" items={customerItems} collapsed={collapsed} />
        <NavSection label="Pack Studio" items={studioItems} collapsed={collapsed} />
        <NavSection label="Admin" items={adminItems} collapsed={collapsed} />
      </SidebarContent>
    </Sidebar>
  );
}

function NavSection({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-sidebar-accent text-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
