import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserArea = "customer" | "studio" | "admin";

interface UserRoleInfo {
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  isInternalUser: boolean;
  visibleAreas: UserArea[];
}

export function useUserRole(): UserRoleInfo {
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 60_000,
  });

  const userId = session?.user?.id;

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return data?.map((r) => r.role) ?? [];
    },
    enabled: !!userId,
    staleTime: 120_000,
  });

  const isLoading = sessionLoading || (!!userId && rolesLoading);
  const isAuthenticated = !!userId;
  const roleList = roles ?? [];

  const isPlatformAdmin = roleList.includes("platform_admin");
  const isInternalUser =
    isPlatformAdmin ||
    roleList.includes("internal_pack_editor") ||
    roleList.includes("internal_pack_reviewer");

  const visibleAreas: UserArea[] = ["customer"];
  if (isInternalUser) visibleAreas.push("studio");
  if (isPlatformAdmin) visibleAreas.push("admin");

  return {
    isLoading,
    isAuthenticated,
    isPlatformAdmin,
    isInternalUser,
    visibleAreas,
  };
}
