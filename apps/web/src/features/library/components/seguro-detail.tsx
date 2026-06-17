import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { useSeguroQuery } from "../api/library-queries";
import {
  TYPE_ATTRIBUTE_FIELDS,
  type Seguro,
} from "../types/library-types";
import { EditSeguroDialog } from "./edit-seguro-dialog";
import { SeguroDocuments } from "./seguro-documents";

export function SeguroDetail({
  seguroId,
}: {
  seguroId: string;
}): React.JSX.Element {
  const query = useSeguroQuery(seguroId);

  if (query.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">No se pudo cargar el seguro.</p>
    );
  }

  const seguro = query.data;
  return (
    <div className="space-y-6">
      <Link to="/seguros" className="text-sm text-muted-foreground underline">
        ← Volver a Documentación
      </Link>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {seguro.insurance_type} · {seguro.numero_poliza}
          </CardTitle>
          <EditSeguroDialog seguro={seguro} />
        </CardHeader>
        <CardContent className="space-y-8">
          <SeguroFacts seguro={seguro} />
          <SeguroDocuments seguroId={seguroId} />
        </CardContent>
      </Card>
    </div>
  );
}

function SeguroFacts({ seguro }: { seguro: Seguro }): React.JSX.Element {
  const vigencia = seguro.vigencia_hasta
    ? `${formatDate(seguro.vigencia_desde)} – ${formatDate(seguro.vigencia_hasta)}`
    : `${formatDate(seguro.vigencia_desde)} – Abierta`;
  const extraFields = TYPE_ATTRIBUTE_FIELDS[seguro.insurance_type] ?? [];
  return (
    <dl className="grid grid-cols-2 gap-4 text-sm">
      <Fact label="Cliente" value={seguro.client_name ?? "—"} />
      <Fact label="Estado" value={seguro.estado} />
      <Fact label="Vigencia" value={vigencia} />
      {extraFields.map((field) => (
        <Fact
          key={field.key}
          label={field.label}
          value={seguro.attributes[field.key] ?? "—"}
        />
      ))}
    </dl>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
