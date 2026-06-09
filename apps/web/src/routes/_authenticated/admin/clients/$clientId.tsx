import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClientQuery } from "@/features/clients/api/clients-queries";
import { ClientMembers } from "@/features/clients/components/client-members";

export const Route = createFileRoute("/_authenticated/admin/clients/$clientId")({
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const query = useClientQuery(clientId);

  if (query.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">No se pudo cargar el cliente.</p>
    );
  }

  const client = query.data;
  return (
    <div className="space-y-6">
      <Link to="/admin/clients" className="text-sm text-muted-foreground underline">
        ← Volver a clientes
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            {client.first_name} {client.last_name}
          </CardTitle>
          <CardDescription>{client.notes ?? "Sin notas"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <h2 className="text-sm font-semibold">Miembros con acceso</h2>
          <ClientMembers clientId={clientId} />
        </CardContent>
      </Card>
    </div>
  );
}
