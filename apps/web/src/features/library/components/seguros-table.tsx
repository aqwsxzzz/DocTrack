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
import { formatDate } from "@/lib/format";
import type { Seguro } from "../types/library-types";

function vigenciaLabel(seguro: Seguro): string {
  const desde = formatDate(seguro.vigencia_desde);
  return seguro.vigencia_hasta
    ? `${desde} – ${formatDate(seguro.vigencia_hasta)}`
    : `${desde} – Abierta`;
}

interface SegurosTableProps {
  seguros: Seguro[];
  showClient?: boolean;
  onDelete?: (seguro: Seguro) => void;
}

export function SegurosTable({
  seguros,
  showClient = false,
  onDelete,
}: SegurosTableProps): React.JSX.Element {
  if (seguros.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay seguros.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showClient && <TableHead>Cliente</TableHead>}
          <TableHead>Tipo</TableHead>
          <TableHead>N° póliza</TableHead>
          <TableHead>Vigencia</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Docs</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {seguros.map((seguro) => (
          <TableRow key={seguro.id}>
            {showClient && (
              <TableCell className="font-medium">
                {seguro.client_name ?? "—"}
              </TableCell>
            )}
            <TableCell className={showClient ? "text-muted-foreground" : "font-medium"}>
              {seguro.insurance_type}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {seguro.numero_poliza}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {vigenciaLabel(seguro)}
            </TableCell>
            <TableCell className="text-muted-foreground">{seguro.estado}</TableCell>
            <TableCell className="text-muted-foreground">
              {seguro.document_count}
            </TableCell>
            <TableCell className="space-x-2 text-right">
              <Button asChild variant="outline" size="sm">
                <Link to="/seguros/$seguroId" params={{ seguroId: seguro.id }}>
                  Ver
                </Link>
              </Button>
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(seguro)}
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
