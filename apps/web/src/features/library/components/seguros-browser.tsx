import { useState } from "react";
import { toast } from "sonner";
import { SectionTabs } from "@/components/section-tabs";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useClientsQuery } from "@/features/clients/api/clients-queries";
import { useAllSegurosQuery, useDeleteSeguroMutation } from "../api/library-queries";
import type { Seguro, SeguroFilters } from "../types/library-types";
import { CreateSeguroDialog } from "./create-seguro-dialog";
import { SegurosFilters } from "./seguros-filters";
import { SegurosTable } from "./seguros-table";

export function SegurosBrowser(): React.JSX.Element {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [filters, setFilters] = useState<SeguroFilters>({});
  const query = useAllSegurosQuery(filters);
  const deleteMutation = useDeleteSeguroMutation();
  const clientsQuery = useClientsQuery({ limit: 100, offset: 0, search: "" });

  function handleDelete(seguro: Seguro): void {
    deleteMutation.mutate(seguro.id, {
      onSuccess: () => toast.success("Seguro eliminado"),
      onError: () => toast.error("No se pudo eliminar el seguro"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTabs />
        <CreateSeguroDialog />
      </div>
      <SegurosFilters
        filters={filters}
        onChange={setFilters}
        clients={clientsQuery.data?.items}
      />
      {query.isPending ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los seguros.
        </p>
      ) : (
        <SegurosTable
          seguros={query.data.items}
          showClient
          onDelete={isAdmin ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
