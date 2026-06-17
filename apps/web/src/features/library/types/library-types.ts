export type InsuranceType =
  | "Vehículos"
  | "Incendio"
  | "Combinado"
  | "ADT"
  | "Fianzas"
  | "RC"
  | "RV";

export const INSURANCE_TYPES: readonly InsuranceType[] = [
  "Vehículos",
  "Incendio",
  "Combinado",
  "ADT",
  "Fianzas",
  "RC",
  "RV",
];

export type SeguroEstado = "Vigente" | "Anulada" | "Devuelta";

export const SEGURO_ESTADOS: readonly SeguroEstado[] = [
  "Vigente",
  "Anulada",
  "Devuelta",
];

export type DocKind = "Póliza" | "Recibo" | "Factura" | "Certificado" | "Otro";

export const DOC_KINDS: readonly DocKind[] = [
  "Póliza",
  "Recibo",
  "Factura",
  "Certificado",
  "Otro",
];

export interface AttributeField {
  key: string;
  label: string;
}

/** Per-type extra fields rendered in the create form and stored in `attributes`. */
export const TYPE_ATTRIBUTE_FIELDS: Partial<
  Record<InsuranceType, readonly AttributeField[]>
> = {
  Vehículos: [
    { key: "matricula", label: "Matrícula" },
    { key: "chasis", label: "Chasis" },
    { key: "motor", label: "Motor" },
    { key: "padron", label: "Padrón" },
  ],
  Fianzas: [
    { key: "numero_licitacion", label: "N° licitación" },
    { key: "tipo_licitacion", label: "Tipo de licitación" },
    { key: "duracion_contrato", label: "Duración del contrato" },
  ],
};

export interface Seguro {
  id: string;
  client_id: string;
  client_name: string | null;
  insurance_type: InsuranceType;
  numero_poliza: string;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  estado: SeguroEstado;
  attributes: Record<string, string>;
  document_count: number;
  created_by: string;
  created_at: string;
}

export interface SeguroListResponse {
  items: Seguro[];
  total: number;
}

export interface SeguroFilters {
  client_id?: string | null;
  insurance_type?: InsuranceType | null;
  estado?: SeguroEstado | null;
  search?: string;
}

export interface CreateSeguroInput {
  insurance_type: InsuranceType;
  numero_poliza: string;
  vigencia_desde: string;
  vigencia_hasta?: string | null;
  estado: SeguroEstado;
  attributes: Record<string, string>;
}

export type SeguroUpdateInput = CreateSeguroInput;

export interface SeguroDocument {
  id: string;
  seguro_id: string;
  doc_kind: DocKind;
  title: string;
  filename: string;
  content_type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface SeguroDocumentListResponse {
  items: SeguroDocument[];
  total: number;
}

export interface UploadSeguroDocumentInput {
  title: string;
  doc_kind: DocKind;
  file: File;
}
