import {
  LayoutDashboard, FolderKanban, MapPin, Package,
  Building2, Briefcase, Shield, ScrollText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import type { LucideIcon } from "lucide-react";

interface NavItem { title: string; url: string; icon: LucideIcon }

const customerItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projekte", url: "/projects", icon: FolderKanban },
];

const studioItems: NavItem[] = [
  { title: "Dashboard", url: "/studio/dashboard", icon: LayoutDashboard },
  { title: "Kommunen", url: "/studio/municipalities", icon: MapPin },
  { title: "Regelpakete", url: "/studio/packs", icon: Package },
];

const adminItems: NavItem[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Organisationen", url: "/admin/organizations", icon: Building2 },
  { title: "Arbeitsbereiche", url: "/admin/workspaces", icon: Briefcase },
  { title: "Rollen", url: "/admin/roles", icon: Shield },
  { title: "Protokoll", url: "/admin/audit", icon: ScrollText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { visibleAreas } = useUserRole();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-3">
        {!collapsed ? (
          <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">
            Mobility Compliance
          </span>
        ) : (
          <span className="text-[13px] font-bold text-sidebar-foreground">MC</span>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavSection label="Projekt" items={customerItems} collapsed={collapsed} />
        {visibleAreas.includes("studio") && (
          <>
            <SidebarSeparator />
            <NavSection label="Pack Studio" items={studioItems} collapsed={collapsed} />
          </>
        )}
        {visibleAreas.includes("admin") && (
          <>
            <SidebarSeparator />
            <NavSection label="Verwaltung" items={adminItems} collapsed={collapsed} />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function NavSection({ label, items, collapsed }: { label: string; items: NavItem[]; collapsed: boolean }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 px-3">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
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
