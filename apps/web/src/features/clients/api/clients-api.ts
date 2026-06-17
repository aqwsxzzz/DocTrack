import { apiClient } from "@/lib/api-client";
import type {
  AssignableUser,
  Client,
  ClientCreate,
  ClientListParams,
  ClientListResponse,
  ClientMember,
} from "../types/clients-types";

export async function listClients(
  params: ClientListParams,
): Promise<ClientListResponse> {
  const response = await apiClient.get<ClientListResponse>("/clients", {
    params: {
      limit: params.limit,
      offset: params.offset,
      search: params.search || undefined,
    },
  });
  return response.data;
}

export async function createClient(data: ClientCreate): Promise<Client> {
  const response = await apiClient.post<Client>("/clients", data);
  return response.data;
}

export async function getClient(clientId: string): Promise<Client> {
  const response = await apiClient.get<Client>(`/clients/${clientId}`);
  return response.data;
}

export async function deleteClient(clientId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}`);
}

export async function listMembers(clientId: string): Promise<ClientMember[]> {
  const response = await apiClient.get<ClientMember[]>(
    `/clients/${clientId}/members`,
  );
  return response.data;
}

export async function addMember(
  clientId: string,
  userId: string,
): Promise<ClientMember[]> {
  const response = await apiClient.post<ClientMember[]>(
    `/clients/${clientId}/members`,
    { user_id: userId },
  );
  return response.data;
}

export async function removeMember(
  clientId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/clients/${clientId}/members/${userId}`);
}

export async function listUsers(): Promise<AssignableUser[]> {
  const response = await apiClient.get<AssignableUser[]>("/auth/users");
  return response.data;
}
