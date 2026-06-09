import { apiClient } from "@/lib/api-client";
import type {
  AddCustodyInput,
  CreateOriginalInput,
  CustodyEvent,
  Original,
  OriginalListResponse,
} from "../types/vault-types";

export async function listOriginals(
  clientId: string,
): Promise<OriginalListResponse> {
  const response = await apiClient.get<OriginalListResponse>(
    `/clients/${clientId}/originals`,
  );
  return response.data;
}

export async function createOriginal(
  clientId: string,
  input: CreateOriginalInput,
): Promise<Original> {
  const form = new FormData();
  form.append("tender_type", input.tender_type);
  form.append("tender_number", input.tender_number);
  form.append("title", input.title);
  if (input.external_owner_id) {
    form.append("external_owner_id", input.external_owner_id);
  }
  if (input.contract_expiration_date) {
    form.append("contract_expiration_date", input.contract_expiration_date);
  }
  if (input.file) {
    form.append("file", input.file);
  }
  const response = await apiClient.post<Original>(
    `/clients/${clientId}/originals`,
    form,
  );
  return response.data;
}

export async function getOriginal(originalId: string): Promise<Original> {
  const response = await apiClient.get<Original>(`/originals/${originalId}`);
  return response.data;
}

export async function deleteOriginal(originalId: string): Promise<void> {
  await apiClient.delete(`/originals/${originalId}`);
}

export async function getBackupUrl(originalId: string): Promise<string> {
  const response = await apiClient.get<{ url: string }>(
    `/originals/${originalId}/download`,
  );
  return response.data.url;
}

export async function listCustody(originalId: string): Promise<CustodyEvent[]> {
  const response = await apiClient.get<CustodyEvent[]>(
    `/originals/${originalId}/custody`,
  );
  return response.data;
}

export async function addCustody(
  originalId: string,
  input: AddCustodyInput,
): Promise<CustodyEvent[]> {
  const response = await apiClient.post<CustodyEvent[]>(
    `/originals/${originalId}/custody`,
    input,
  );
  return response.data;
}
