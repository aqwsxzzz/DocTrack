import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { getBackupUrl } from "@/features/vault/api/vault-api";
import {
  useCustodyQuery,
  useOriginalQuery,
} from "@/features/vault/api/vault-queries";
import { AddCustodyForm } from "@/features/vault/components/add-custody-form";
import { CustodyTimeline } from "@/features/vault/components/custody-timeline";

export const Route = createFileRoute("/_authenticated/boveda/$originalId")({
  component: OriginalDetailPage,
});

async function downloadBackup(originalId: string): Promise<void> {
  try {
    window.open(await getBackupUrl(originalId), "_blank", "noopener");
  } catch {
    toast.error("No se pudo descargar la copia de respaldo");
  }
}

function OriginalDetailPage() {
  const { originalId } = Route.useParams();
  const originalQuery = useOriginalQuery(originalId);
  const custodyQuery = useCustodyQuery(originalId);

  if (originalQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (originalQuery.isError) {
    return (
      <p className="text-sm text-destructive">No se pudo cargar el original.</p>
    );
  }

  const original = originalQuery.data;
  return (
    <div className="space-y-6">
      <Link to="/boveda" className="text-sm text-muted-foreground underline">
        ← Volver a Bóveda
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>N.º {original.tender_number}</CardTitle>
          <CardDescription>
            {original.client_name ?? "—"} · {original.tender_type}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="whitespace-pre-wrap">{original.description}</p>
          <p>
            <span className="text-muted-foreground">Propietario / devolución: </span>
            {original.external_owner_name ?? "Sin especificar"}
          </p>
          <p>
            <span className="text-muted-foreground">Vencimiento: </span>
            {original.contract_expiration_date
              ? formatDate(original.contract_expiration_date)
              : "No definido"}
          </p>
          {original.has_backup && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => downloadBackup(originalId)}
            >
              Descargar copia de respaldo
            </Button>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custodia</CardTitle>
          <CardDescription>
            Tenedor actual: {original.current_holder ?? "Sin registro"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddCustodyForm originalId={originalId} />
          {custodyQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : custodyQuery.isError ? (
            <p className="text-sm text-destructive">
              No se pudo cargar la custodia.
            </p>
          ) : (
            <CustodyTimeline events={custodyQuery.data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
