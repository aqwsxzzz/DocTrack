export type LibraryCategory = "Póliza" | "Factura" | "Certificado" | "Otro";

export const LIBRARY_CATEGORIES: readonly LibraryCategory[] = [
  "Póliza",
  "Factura",
  "Certificado",
  "Otro",
];

export interface LibraryDocument {
  id: string;
  client_id: string;
  category: LibraryCategory;
  title: string;
  filename: string;
  content_type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface LibraryListResponse {
  items: LibraryDocument[];
  total: number;
}

export interface UploadDocumentInput {
  title: string;
  category: LibraryCategory;
  file: File;
}
