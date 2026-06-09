import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth-store";
import {
  useDeleteOriginalMutation,
  useOriginalsQuery,
} from "../api/vault-queries";
import type { Original } from "../types/vault-types";
import { CreateOriginalDialog } from "./create-original-dialog";
import { OriginalsTable } from "./originals-table";

export function ClientVault({
  clientId,
}: {
  clientId: string;
}): React.JSX.Element {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const query = useOriginalsQuery(clientId);
  const deleteMutation = useDeleteOriginalMutation(clientId);

  function handleDelete(original: Original): void {
    deleteMutation.mutate(original.id, {
      onSuccess: () => toast.success("Original eliminado"),
      onError: () => toast.error("No se pudo eliminar el original"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Originales (bóveda)</h2>
        <CreateOriginalDialog clientId={clientId} />
      </div>
      <VaultBody
        query={query}
        clientId={clientId}
        onDelete={isAdmin ? handleDelete : undefined}
      />
    </div>
  );
}

interface VaultBodyProps {
  query: ReturnType<typeof useOriginalsQuery>;
  clientId: string;
  onDelete?: (original: Original) => void;
}

function VaultBody({
  query,
  clientId,
  onDelete,
}: VaultBodyProps): React.JSX.Element {
  if (query.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudieron cargar los originales.
      </p>
    );
  }
  return (
    <OriginalsTable
      originals={query.data.items}
      clientId={clientId}
      onDelete={onDelete}
    />
  );
}
