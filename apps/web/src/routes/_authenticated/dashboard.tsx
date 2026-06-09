import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useClientsQuery } from "@/features/clients/api/clients-queries";
import type { Client } from "@/features/clients/types/clients-types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const query = useClientsQuery({ limit: 100, offset: 0, search: "" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hola, {user?.full_name}</h1>
        <p className="text-muted-foreground">Tus clientes y documentos.</p>
      </div>
      <ClientCards query={query} />
    </div>
  );
}

function ClientCards({
  query,
}: {
  query: ReturnType<typeof useClientsQuery>;
}): React.JSX.Element {
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
  if (query.data.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tenés clientes asignados todavía.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {query.data.items.map((client: Client) => (
        <Link
          key={client.id}
          to="/clients/$clientId"
          params={{ clientId: client.id }}
          className="rounded-lg border p-4 hover:bg-accent"
        >
          <p className="font-medium">
            {client.first_name} {client.last_name}
          </p>
          {client.notes && (
            <p className="text-sm text-muted-foreground">{client.notes}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
