import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "../types/library-types";
import { SeguroAttributeFields } from "./seguro-attribute-fields";
import type { SeguroFormState } from "./seguro-form";

interface SeguroFieldsProps {
  value: SeguroFormState;
  onChange: (next: SeguroFormState) => void;
}

export function SeguroFields({
  value,
  onChange,
}: SeguroFieldsProps): React.JSX.Element {
  return (
    <>
      <div className="space-y-2">
        <Label>Tipo de seguro</Label>
        <Select
          value={value.insuranceType}
          onValueChange={(type) =>
            onChange({ ...value, insuranceType: type as InsuranceType, attributes: {} })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INSURANCE_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="numero-poliza">N° de póliza</Label>
        <Input
          id="numero-poliza"
          value={value.numeroPoliza}
          onChange={(event) =>
            onChange({ ...value, numeroPoliza: event.target.value })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="vigencia-desde">Vigencia desde</Label>
          <Input
            id="vigencia-desde"
            type="date"
            value={value.vigenciaDesde}
            onChange={(event) =>
              onChange({ ...value, vigenciaDesde: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vigencia-hasta">Vigencia hasta (opcional)</Label>
          <Input
            id="vigencia-hasta"
            type="date"
            value={value.vigenciaHasta}
            onChange={(event) =>
              onChange({ ...value, vigenciaHasta: event.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={value.estado}
          onValueChange={(estado) =>
            onChange({ ...value, estado: estado as SeguroEstado })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEGURO_ESTADOS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SeguroAttributeFields
        insuranceType={value.insuranceType}
        values={value.attributes}
        onChange={(key, fieldValue) =>
          onChange({
            ...value,
            attributes: { ...value.attributes, [key]: fieldValue },
          })
        }
      />
    </>
  );
}
