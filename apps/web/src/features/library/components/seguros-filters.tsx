import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INSURANCE_TYPES,
  SEGURO_ESTADOS,
  type InsuranceType,
  type SeguroEstado,
  type SeguroFilters,
} from "../types/library-types";

const ALL = "__all__";

interface ClientOption {
  id: string;
  name: string;
}

interface SegurosFiltersProps {
  filters: SeguroFilters;
  onChange: (filters: SeguroFilters) => void;
  clients?: ClientOption[];
}

export function SegurosFilters({
  filters,
  onChange,
  clients,
}: SegurosFiltersProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Buscar (póliza, matrícula…)"
        value={filters.search ?? ""}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        className="max-w-xs"
      />
      {clients && (
        <Select
          value={filters.client_id ?? ALL}
          onValueChange={(value) =>
            onChange({ ...filters, client_id: value === ALL ? null : value })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los clientes</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select
        value={filters.insurance_type ?? ALL}
        onValueChange={(value) =>
          onChange({
            ...filters,
            insurance_type: value === ALL ? null : (value as InsuranceType),
          })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los tipos</SelectItem>
          {INSURANCE_TYPES.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.estado ?? ALL}
        onValueChange={(value) =>
          onChange({
            ...filters,
            estado: value === ALL ? null : (value as SeguroEstado),
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los estados</SelectItem>
          {SEGURO_ESTADOS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
