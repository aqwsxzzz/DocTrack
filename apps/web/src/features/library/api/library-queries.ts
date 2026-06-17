import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createSeguro,
  deleteSeguro,
  deleteSeguroDocument,
  getSeguro,
  listAllSeguros,
  listSeguroDocuments,
  listSeguros,
  updateSeguro,
  uploadSeguroDocument,
} from "./library-api";
import type {
  CreateSeguroInput,
  Seguro,
  SeguroDocument,
  SeguroDocumentListResponse,
  SeguroFilters,
  SeguroListResponse,
  SeguroUpdateInput,
  UploadSeguroDocumentInput,
} from "../types/library-types";

export const libraryKeys = {
  seguros: (clientId: string, filters: SeguroFilters) =>
    ["seguros", clientId, filters] as const,
  allSeguros: (filters: SeguroFilters) => ["seguros", "all", filters] as const,
  seguro: (seguroId: string) => ["seguro", seguroId] as const,
  documents: (seguroId: string) => ["seguro-documents", seguroId] as const,
};

export function useSegurosQuery(
  clientId: string,
  filters: SeguroFilters,
): UseQueryResult<SeguroListResponse, Error> {
  return useQuery({
    queryKey: libraryKeys.seguros(clientId, filters),
    queryFn: () => listSeguros(clientId, filters),
  });
}

export function useAllSegurosQuery(
  filters: SeguroFilters,
): UseQueryResult<SeguroListResponse, Error> {
  return useQuery({
    queryKey: libraryKeys.allSeguros(filters),
    queryFn: () => listAllSeguros(filters),
  });
}

export function useSeguroQuery(seguroId: string): UseQueryResult<Seguro, Error> {
  return useQuery({
    queryKey: libraryKeys.seguro(seguroId),
    queryFn: () => getSeguro(seguroId),
  });
}

interface CreateSeguroVars {
  clientId: string;
  input: CreateSeguroInput;
}

export function useCreateSeguroMutation(): UseMutationResult<
  Seguro,
  Error,
  CreateSeguroVars
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, input }: CreateSeguroVars) =>
      createSeguro(clientId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["seguros"] }),
  });
}

export function useUpdateSeguroMutation(
  seguroId: string,
): UseMutationResult<Seguro, Error, SeguroUpdateInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SeguroUpdateInput) => updateSeguro(seguroId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seguros"] });
      queryClient.invalidateQueries({ queryKey: libraryKeys.seguro(seguroId) });
    },
  });
}

export function useDeleteSeguroMutation(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSeguro,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seguros"] }),
  });
}

export function useSeguroDocumentsQuery(
  seguroId: string,
): UseQueryResult<SeguroDocumentListResponse, Error> {
  return useQuery({
    queryKey: libraryKeys.documents(seguroId),
    queryFn: () => listSeguroDocuments(seguroId),
  });
}

export function useUploadDocumentMutation(
  seguroId: string,
): UseMutationResult<SeguroDocument, Error, UploadSeguroDocumentInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadSeguroDocumentInput) =>
      uploadSeguroDocument(seguroId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.documents(seguroId) });
      queryClient.invalidateQueries({ queryKey: ["seguros"] });
    },
  });
}

export function useDeleteDocumentMutation(
  seguroId: string,
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSeguroDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.documents(seguroId) });
      queryClient.invalidateQueries({ queryKey: ["seguros"] });
    },
  });
}
