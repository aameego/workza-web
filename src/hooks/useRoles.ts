import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../services/roleService";

export const ROLES_QUERY_KEY = "roles" as const;

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: getRoles,
    enabled,
  });
}
