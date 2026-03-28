import { useState, useEffect } from "react";
import {
  LayoutDashboard, FolderKanban, MapPin, Package,
  Building2, Briefcase, Shield, ScrollText, LogOut, User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarSeparator, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
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
  { title: "Benutzer", url: "/admin/users", icon: Briefcase },
  { title: "Rollen", url: "/admin/roles", icon: Shield },
  { title: "Protokoll", url: "/admin/audit", icon: ScrollText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { visibleAreas } = useUserRole();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const displayName = profile?.full_name || profile?.email || "User";
  const initials = (profile?.full_name ?? profile?.email ?? "US").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

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
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {profileLoading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            {!collapsed && <Skeleton className="h-4 w-24" />}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-sidebar-foreground truncate">{displayName}</div>
                <button onClick={() => navigate("/profile")} className="text-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
                  Profil bearbeiten
                </button>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} title="Abmelden" className="h-6 w-6 inline-flex items-center justify-center rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </SidebarFooter>
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