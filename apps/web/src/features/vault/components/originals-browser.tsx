import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionTabs } from "@/components/section-tabs";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useClientsQuery } from "@/features/clients/api/clients-queries";
import {
  useAllOriginalsQuery,
  useDeleteOriginalMutation,
} from "../api/vault-queries";
import type { Original } from "../types/vault-types";
import { CreateOriginalDialog } from "./create-original-dialog";
import { OriginalsTable } from "./originals-table";

const ALL = "__all__";

export function OriginalsBrowser(): React.JSX.Element {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [clientId, setClientId] = useState<string | null>(null);
  const query = useAllOriginalsQuery({ client_id: clientId });
  const deleteMutation = useDeleteOriginalMutation();
  const clientsQuery = useClientsQuery({ limit: 100, offset: 0, search: "" });

  function handleDelete(original: Original): void {
    deleteMutation.mutate(original.id, {
      onSuccess: () => toast.success("Original eliminado"),
      onError: () => toast.error("No se pudo eliminar el original"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTabs />
        <CreateOriginalDialog />
      </div>
      <Select
        value={clientId ?? ALL}
        onValueChange={(value) => setClientId(value === ALL ? null : value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los clientes</SelectItem>
          {clientsQuery.data?.items.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {query.isPending ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los originales.
        </p>
      ) : (
        <OriginalsTable
          originals={query.data.items}
          showClient
          onDelete={isAdmin ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
