import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes, formatDate } from "@/lib/format";
import type { LibraryDocument } from "../types/library-types";

interface DocumentsTableProps {
  documents: LibraryDocument[];
  onDownload: (doc: LibraryDocument) => void;
  onDelete?: (doc: LibraryDocument) => void;
}

export function DocumentsTable({
  documents,
  onDownload,
  onDelete,
}: DocumentsTableProps): React.JSX.Element {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay documentos.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Tamaño</TableHead>
          <TableHead>Subido</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">{doc.title}</TableCell>
            <TableCell className="text-muted-foreground">{doc.category}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatBytes(doc.size)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(doc.uploaded_at)}
            </TableCell>
            <TableCell className="space-x-2 text-right">
              <Button variant="outline" size="sm" onClick={() => onDownload(doc)}>
                Descargar
              </Button>
              {onDelete && (
                <Button variant="outline" size="sm" onClick={() => onDelete(doc)}>
                  Eliminar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
