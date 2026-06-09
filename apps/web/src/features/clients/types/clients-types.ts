export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  notes: string | null;
  created_at: string;
}

export interface ClientListResponse {
  items: Client[];
  total: number;
}

export interface ClientCreate {
  first_name: string;
  last_name: string;
  notes?: string | null;
}

export interface ClientMember {
  id: string;
  email: string;
  full_name: string;
  granted_at: string;
}

export interface AssignableUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "member";
  created_at: string;
}

export interface ClientListParams {
  limit: number;
  offset: number;
  search: string;
}
