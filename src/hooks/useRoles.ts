import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRole, getRoles, updateRole, type RoleInput } from "../services/roleService";

export const ROLES_QUERY_KEY = "roles" as const;

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: getRoles,
    enabled,
  });
}

/** Create (no id) or update a role, then refresh the role list. */
export function useSaveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: RoleInput }) =>
      id ? updateRole(id, input) : createRole(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] }),
  });
}
