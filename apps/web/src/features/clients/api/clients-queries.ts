import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  addMember,
  createClient,
  deleteClient,
  getClient,
  listClients,
  listMembers,
  listUsers,
  removeMember,
} from "./clients-api";
import type {
  AssignableUser,
  Client,
  ClientCreate,
  ClientListParams,
  ClientListResponse,
  ClientMember,
} from "../types/clients-types";

export const clientKeys = {
  all: ["clients"] as const,
  list: (params: ClientListParams) => ["clients", "list", params] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
  members: (id: string) => ["clients", id, "members"] as const,
  users: ["users"] as const,
};

export function useClientsQuery(
  params: ClientListParams,
): UseQueryResult<ClientListResponse, Error> {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => listClients(params),
  });
}

export function useClientQuery(id: string): UseQueryResult<Client, Error> {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => getClient(id),
  });
}

export function useUsersQuery(): UseQueryResult<AssignableUser[], Error> {
  return useQuery({ queryKey: clientKeys.users, queryFn: listUsers });
}

export function useMembersQuery(
  clientId: string,
): UseQueryResult<ClientMember[], Error> {
  return useQuery({
    queryKey: clientKeys.members(clientId),
    queryFn: () => listMembers(clientId),
  });
}

export function useCreateClientMutation(): UseMutationResult<
  Client,
  Error,
  ClientCreate
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

export function useDeleteClientMutation(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

export function useAddMemberMutation(
  clientId: string,
): UseMutationResult<ClientMember[], Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => addMember(clientId, userId),
    onSuccess: (members) =>
      queryClient.setQueryData(clientKeys.members(clientId), members),
  });
}

export function useRemoveMemberMutation(
  clientId: string,
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(clientId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clientKeys.members(clientId) }),
  });
}
