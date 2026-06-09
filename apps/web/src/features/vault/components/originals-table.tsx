import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Original } from "../types/vault-types";

interface OriginalsTableProps {
  originals: Original[];
  clientId: string;
  onDelete?: (original: Original) => void;
}

export function OriginalsTable({
  originals,
  clientId,
  onDelete,
}: OriginalsTableProps): React.JSX.Element {
  if (originals.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay originales.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>N.º</TableHead>
          <TableHead>Tenedor actual</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {originals.map((original) => (
          <TableRow key={original.id}>
            <TableCell>
              <Link
                to="/clients/$clientId/originals/$originalId"
                params={{ clientId, originalId: original.id }}
                className="font-medium underline"
              >
                {original.title}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {original.tender_type}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {original.tender_number}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {original.current_holder ?? "Sin registro"}
            </TableCell>
            <TableCell className="text-right">
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(original)}
                >
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
