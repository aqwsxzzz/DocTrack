import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
} from "./library-api";
import type {
  LibraryDocument,
  LibraryListResponse,
  UploadDocumentInput,
} from "../types/library-types";

export const libraryKeys = {
  list: (clientId: string) => ["library", clientId] as const,
};

export function useLibraryQuery(
  clientId: string,
): UseQueryResult<LibraryListResponse, Error> {
  return useQuery({
    queryKey: libraryKeys.list(clientId),
    queryFn: () => listDocuments(clientId),
  });
}

export function useUploadDocumentMutation(
  clientId: string,
): UseMutationResult<LibraryDocument, Error, UploadDocumentInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadDocumentInput) => uploadDocument(clientId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: libraryKeys.list(clientId) }),
  });
}

export function useDeleteDocumentMutation(
  clientId: string,
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: libraryKeys.list(clientId) }),
  });
}
