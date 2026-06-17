import type {
  CreateSeguroInput,
  InsuranceType,
  Seguro,
  SeguroEstado,
} from "../types/library-types";

export interface SeguroFormState {
  insuranceType: InsuranceType;
  numeroPoliza: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  estado: SeguroEstado;
  attributes: Record<string, string>;
}

export const emptySeguroForm: SeguroFormState = {
  insuranceType: "Vehículos",
  numeroPoliza: "",
  vigenciaDesde: "",
  vigenciaHasta: "",
  estado: "Vigente",
  attributes: {},
};

export function seguroToForm(seguro: Seguro): SeguroFormState {
  return {
    insuranceType: seguro.insurance_type,
    numeroPoliza: seguro.numero_poliza,
    vigenciaDesde: seguro.vigencia_desde,
    vigenciaHasta: seguro.vigencia_hasta ?? "",
    estado: seguro.estado,
    attributes: { ...seguro.attributes },
  };
}

export function formToInput(state: SeguroFormState): CreateSeguroInput {
  const attributes = Object.fromEntries(
    Object.entries(state.attributes).filter(([, value]) => value.trim() !== ""),
  );
  return {
    insurance_type: state.insuranceType,
    numero_poliza: state.numeroPoliza.trim(),
    vigencia_desde: state.vigenciaDesde,
    vigencia_hasta: state.vigenciaHasta || null,
    estado: state.estado,
    attributes,
  };
}
