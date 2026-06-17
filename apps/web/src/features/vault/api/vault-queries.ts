import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  addCustody,
  createOriginal,
  deleteOriginal,
  getOriginal,
  listAllOriginals,
  listCustody,
  listOriginals,
} from "./vault-api";
import type {
  AddCustodyInput,
  CreateOriginalInput,
  CustodyEvent,
  Original,
  OriginalFilters,
  OriginalListResponse,
} from "../types/vault-types";

export const vaultKeys = {
  originals: (clientId: string) => ["originals", clientId] as const,
  allOriginals: (filters: OriginalFilters) => ["originals", "all", filters] as const,
  original: (originalId: string) => ["original", originalId] as const,
  custody: (originalId: string) => ["custody", originalId] as const,
};

export function useOriginalsQuery(
  clientId: string,
): UseQueryResult<OriginalListResponse, Error> {
  return useQuery({
    queryKey: vaultKeys.originals(clientId),
    queryFn: () => listOriginals(clientId),
  });
}

export function useAllOriginalsQuery(
  filters: OriginalFilters,
): UseQueryResult<OriginalListResponse, Error> {
  return useQuery({
    queryKey: vaultKeys.allOriginals(filters),
    queryFn: () => listAllOriginals(filters),
  });
}

export function useOriginalQuery(
  originalId: string,
): UseQueryResult<Original, Error> {
  return useQuery({
    queryKey: vaultKeys.original(originalId),
    queryFn: () => getOriginal(originalId),
  });
}

export function useCustodyQuery(
  originalId: string,
): UseQueryResult<CustodyEvent[], Error> {
  return useQuery({
    queryKey: vaultKeys.custody(originalId),
    queryFn: () => listCustody(originalId),
  });
}

interface CreateOriginalVars {
  clientId: string;
  input: CreateOriginalInput;
}

export function useCreateOriginalMutation(): UseMutationResult<
  Original,
  Error,
  CreateOriginalVars
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, input }: CreateOriginalVars) =>
      createOriginal(clientId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["originals"] }),
  });
}

export function useDeleteOriginalMutation(): UseMutationResult<
  void,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOriginal,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["originals"] }),
  });
}

export function useAddCustodyMutation(
  originalId: string,
): UseMutationResult<CustodyEvent[], Error, AddCustodyInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCustodyInput) => addCustody(originalId, input),
    onSuccess: (events) => {
      queryClient.setQueryData(vaultKeys.custody(originalId), events);
      queryClient.invalidateQueries({ queryKey: vaultKeys.original(originalId) });
    },
  });
}
