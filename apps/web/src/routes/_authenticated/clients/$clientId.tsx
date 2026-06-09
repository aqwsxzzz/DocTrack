import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useClientQuery } from "@/features/clients/api/clients-queries";
import { ClientLibrary } from "@/features/library/components/client-library";
import { ClientVault } from "@/features/vault/components/client-vault";

export const Route = createFileRoute("/_authenticated/clients/$clientId")({
  component: ClientDocumentsPage,
});

function ClientDocumentsPage() {
  const { clientId } = Route.useParams();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
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
      <Link to="/dashboard" className="text-sm text-muted-foreground underline">
        ← Volver al inicio
      </Link>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {client.first_name} {client.last_name}
          </CardTitle>
          {isAdmin && (
            <Link
              to="/admin/clients/$clientId"
              params={{ clientId }}
              className="text-sm text-muted-foreground underline"
            >
              Gestionar miembros
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          <ClientLibrary clientId={clientId} />
          <ClientVault clientId={clientId} />
        </CardContent>
      </Card>
    </div>
  );
}
