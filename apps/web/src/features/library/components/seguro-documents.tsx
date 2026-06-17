import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { getDocumentDownloadUrl } from "../api/library-api";
import {
  useDeleteDocumentMutation,
  useSeguroDocumentsQuery,
} from "../api/library-queries";
import type { SeguroDocument } from "../types/library-types";
import { AddDocumentDialog } from "./add-document-dialog";
import { DocumentsTable } from "./documents-table";

export function SeguroDocuments({
  seguroId,
}: {
  seguroId: string;
}): React.JSX.Element {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const query = useSeguroDocumentsQuery(seguroId);
  const deleteMutation = useDeleteDocumentMutation(seguroId);

  async function handleDownload(doc: SeguroDocument): Promise<void> {
    try {
      window.open(await getDocumentDownloadUrl(doc.id), "_blank", "noopener");
    } catch {
      toast.error("No se pudo generar el enlace de descarga");
    }
  }

  function handleDelete(doc: SeguroDocument): void {
    deleteMutation.mutate(doc.id, {
      onSuccess: () => toast.success("Documento eliminado"),
      onError: () => toast.error("No se pudo eliminar el documento"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Documentos</h3>
        <AddDocumentDialog seguroId={seguroId} />
      </div>
      {query.isPending ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los documentos.
        </p>
      ) : (
        <DocumentsTable
          documents={query.data.items}
          onDownload={handleDownload}
          onDelete={isAdmin ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
