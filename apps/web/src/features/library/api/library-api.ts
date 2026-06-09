import { apiClient } from "@/lib/api-client";
import type {
  LibraryDocument,
  LibraryListResponse,
  UploadDocumentInput,
} from "../types/library-types";

export async function listDocuments(
  clientId: string,
): Promise<LibraryListResponse> {
  const response = await apiClient.get<LibraryListResponse>(
    `/clients/${clientId}/library`,
  );
  return response.data;
}

export async function uploadDocument(
  clientId: string,
  input: UploadDocumentInput,
): Promise<LibraryDocument> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("category", input.category);
  form.append("file", input.file);
  const response = await apiClient.post<LibraryDocument>(
    `/clients/${clientId}/library`,
    form,
  );
  return response.data;
}

export async function getDownloadUrl(documentId: string): Promise<string> {
  const response = await apiClient.get<{ url: string }>(
    `/library/${documentId}/download`,
  );
  return response.data.url;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/library/${documentId}`);
}
