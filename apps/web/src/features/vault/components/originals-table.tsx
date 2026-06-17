import { Link, useNavigate } from "@tanstack/react-router";
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
  showClient?: boolean;
  onDelete?: (original: Original) => void;
}

export function OriginalsTable({
  originals,
  showClient = false,
  onDelete,
}: OriginalsTableProps): React.JSX.Element {
  const navigate = useNavigate();
  if (originals.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay originales.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showClient && <TableHead>Cliente</TableHead>}
          <TableHead>N.º</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Tenedor actual</TableHead>
          {onDelete && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {originals.map((original) => (
          <TableRow
            key={original.id}
            className="cursor-pointer"
            onClick={() =>
              navigate({
                to: "/boveda/$originalId",
                params: { originalId: original.id },
              })
            }
          >
            {showClient && (
              <TableCell className="font-medium">
                {original.client_name ?? "—"}
              </TableCell>
            )}
            <TableCell>
              <Link
                to="/boveda/$originalId"
                params={{ originalId: original.id }}
                className="font-medium underline"
              >
                {original.tender_number}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {original.tender_type}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {original.current_holder ?? "Sin registro"}
            </TableCell>
            {onDelete && (
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(original);
                  }}
                >
                  Eliminar
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
