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
import type { Client } from "../types/clients-types";

interface ClientsTableProps {
  clients: Client[];
  onDelete: (client: Client) => void;
}

export function ClientsTable({
  clients,
  onDelete,
}: ClientsTableProps): React.JSX.Element {
  if (clients.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay clientes.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Notas</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              <Link
                to="/admin/clients/$clientId"
                params={{ clientId: client.id }}
                className="font-medium underline"
              >
                {client.first_name} {client.last_name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.notes ?? "—"}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => onDelete(client)}>
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
