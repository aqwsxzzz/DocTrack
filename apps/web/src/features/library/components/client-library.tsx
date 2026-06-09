import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { getDownloadUrl } from "../api/library-api";
import {
  useDeleteDocumentMutation,
  useLibraryQuery,
} from "../api/library-queries";
import type { LibraryDocument } from "../types/library-types";
import { DocumentsTable } from "./documents-table";
import { UploadDocumentDialog } from "./upload-document-dialog";

export function ClientLibrary({
  clientId,
}: {
  clientId: string;
}): React.JSX.Element {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const query = useLibraryQuery(clientId);
  const deleteMutation = useDeleteDocumentMutation(clientId);

  async function handleDownload(doc: LibraryDocument): Promise<void> {
    try {
      window.open(await getDownloadUrl(doc.id), "_blank", "noopener");
    } catch {
      toast.error("No se pudo generar el enlace de descarga");
    }
  }

  function handleDelete(doc: LibraryDocument): void {
    deleteMutation.mutate(doc.id, {
      onSuccess: () => toast.success("Documento eliminado"),
      onError: () => toast.error("No se pudo eliminar el documento"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Documentos</h2>
        <UploadDocumentDialog clientId={clientId} />
      </div>
      <LibraryBody
        query={query}
        onDownload={handleDownload}
        onDelete={isAdmin ? handleDelete : undefined}
      />
    </div>
  );
}

interface LibraryBodyProps {
  query: ReturnType<typeof useLibraryQuery>;
  onDownload: (doc: LibraryDocument) => void;
  onDelete?: (doc: LibraryDocument) => void;
}

function LibraryBody({
  query,
  onDownload,
  onDelete,
}: LibraryBodyProps): React.JSX.Element {
  if (query.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudieron cargar los documentos.
      </p>
    );
  }
  return (
    <DocumentsTable
      documents={query.data.items}
      onDownload={onDownload}
      onDelete={onDelete}
    />
  );
}
