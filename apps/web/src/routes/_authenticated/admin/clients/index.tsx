import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/pagination";
import {
  useClientsQuery,
  useDeleteClientMutation,
} from "@/features/clients/api/clients-queries";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { CreateClientDialog } from "@/features/clients/components/create-client-dialog";
import type { Client } from "@/features/clients/types/clients-types";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/_authenticated/admin/clients/")({
  component: ClientsListPage,
});

function ClientsListPage() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useClientsQuery({ limit: PAGE_SIZE, offset, search });
  const deleteMutation = useDeleteClientMutation();

  function handleSearch(value: string): void {
    setSearch(value);
    setOffset(0);
  }

  function handleDelete(client: Client): void {
    deleteMutation.mutate(client.id, {
      onSuccess: () => toast.success("Cliente eliminado"),
      onError: () => toast.error("No se pudo eliminar el cliente"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <CreateClientDialog />
      </div>
      <Input
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(event) => handleSearch(event.target.value)}
        className="max-w-xs"
      />
      <ClientsListBody query={query} onDelete={handleDelete} />
      <Pagination
        offset={offset}
        pageSize={PAGE_SIZE}
        total={query.data?.total ?? 0}
        onChange={setOffset}
      />
    </div>
  );
}

interface ClientsListBodyProps {
  query: ReturnType<typeof useClientsQuery>;
  onDelete: (client: Client) => void;
}

function ClientsListBody({
  query,
  onDelete,
}: ClientsListBodyProps): React.JSX.Element {
  if (query.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudieron cargar los clientes.
      </p>
    );
  }
  return <ClientsTable clients={query.data.items} onDelete={onDelete} />;
}
