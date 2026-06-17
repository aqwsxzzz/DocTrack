import { apiClient } from "@/lib/api-client";
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

function filterParams(filters: SeguroFilters): Record<string, string | undefined> {
  return {
    insurance_type: filters.insurance_type ?? undefined,
    estado: filters.estado ?? undefined,
    search: filters.search?.trim() || undefined,
  };
}

export async function listSeguros(
  clientId: string,
  filters: SeguroFilters,
): Promise<SeguroListResponse> {
  const response = await apiClient.get<SeguroListResponse>(
    `/clients/${clientId}/seguros`,
    { params: filterParams(filters) },
  );
  return response.data;
}

export async function listAllSeguros(
  filters: SeguroFilters,
): Promise<SeguroListResponse> {
  const response = await apiClient.get<SeguroListResponse>("/seguros", {
    params: { ...filterParams(filters), client_id: filters.client_id ?? undefined },
  });
  return response.data;
}

export async function updateSeguro(
  seguroId: string,
  input: SeguroUpdateInput,
): Promise<Seguro> {
  const response = await apiClient.patch<Seguro>(`/seguros/${seguroId}`, input);
  return response.data;
}

export async function createSeguro(
  clientId: string,
  input: CreateSeguroInput,
): Promise<Seguro> {
  const response = await apiClient.post<Seguro>(
    `/clients/${clientId}/seguros`,
    input,
  );
  return response.data;
}

export async function getSeguro(seguroId: string): Promise<Seguro> {
  const response = await apiClient.get<Seguro>(`/seguros/${seguroId}`);
  return response.data;
}

export async function deleteSeguro(seguroId: string): Promise<void> {
  await apiClient.delete(`/seguros/${seguroId}`);
}

export async function listSeguroDocuments(
  seguroId: string,
): Promise<SeguroDocumentListResponse> {
  const response = await apiClient.get<SeguroDocumentListResponse>(
    `/seguros/${seguroId}/documents`,
  );
  return response.data;
}

export async function uploadSeguroDocument(
  seguroId: string,
  input: UploadSeguroDocumentInput,
): Promise<SeguroDocument> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("doc_kind", input.doc_kind);
  form.append("file", input.file);
  const response = await apiClient.post<SeguroDocument>(
    `/seguros/${seguroId}/documents`,
    form,
  );
  return response.data;
}

export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<string> {
  const response = await apiClient.get<{ url: string }>(
    `/documents/${documentId}/download`,
  );
  return response.data.url;
}

export async function deleteSeguroDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/documents/${documentId}`);
}
