import { formatDateTime } from "@/lib/format";
import type { CustodyEvent } from "../types/vault-types";

export function CustodyTimeline({
  events,
}: {
  events: CustodyEvent[];
}): React.JSX.Element {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
    );
  }
  return (
    <ol className="space-y-4 border-l pl-4">
      {events.map((event) => (
        <li key={event.id} className="space-y-0.5">
          <p className="font-medium">{event.holder_display}</p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(event.occurred_at)} · registrado por{" "}
            {event.recorded_by_name ?? "—"}
          </p>
          {event.note && <p className="text-sm">{event.note}</p>}
        </li>
      ))}
    </ol>
  );
}
