export type TenderType =
  | "Mantenimiento de oferta"
  | "Cumplimiento de contrato"
  | "Cumplimiento de ley"
  | "Otro";

export const TENDER_TYPES: readonly TenderType[] = [
  "Mantenimiento de oferta",
  "Cumplimiento de contrato",
  "Cumplimiento de ley",
  "Otro",
];

export interface OriginalFilters {
  client_id?: string | null;
}

export interface Original {
  id: string;
  client_id: string;
  client_name: string | null;
  external_owner_id: string | null;
  external_owner_name: string | null;
  tender_type: TenderType;
  tender_number: string;
  contract_expiration_date: string | null;
  description: string;
  has_backup: boolean;
  filename: string | null;
  current_holder: string | null;
  created_by: string;
  created_at: string;
}

export interface OriginalListResponse {
  items: Original[];
  total: number;
}

export type HolderSelection =
  | { holder_user_id: string }
  | { holder_label: string };

export interface CreateOriginalInput {
  tender_type: TenderType;
  tender_number: string;
  description: string;
  external_owner_id?: string | null;
  contract_expiration_date?: string | null;
  holder_user_id?: string | null;
  holder_label?: string | null;
  file?: File | null;
}

export interface CustodyEvent {
  id: string;
  holder_user_id: string | null;
  holder_label: string | null;
  holder_display: string;
  occurred_at: string;
  recorded_by: string;
  recorded_by_name: string | null;
  note: string | null;
  created_at: string;
}

export interface AddCustodyInput {
  holder_user_id?: string | null;
  holder_label?: string | null;
  occurred_at?: string | null;
  note?: string | null;
}
