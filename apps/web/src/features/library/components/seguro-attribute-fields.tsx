import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TYPE_ATTRIBUTE_FIELDS,
  type InsuranceType,
} from "../types/library-types";

interface SeguroAttributeFieldsProps {
  insuranceType: InsuranceType;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function SeguroAttributeFields({
  insuranceType,
  values,
  onChange,
}: SeguroAttributeFieldsProps): React.JSX.Element | null {
  const fields = TYPE_ATTRIBUTE_FIELDS[insuranceType];
  if (!fields) {
    return null;
  }
  return (
    <>
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={`attr-${field.key}`}>{field.label}</Label>
          <Input
            id={`attr-${field.key}`}
            value={values[field.key] ?? ""}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </div>
      ))}
    </>
  );
}
