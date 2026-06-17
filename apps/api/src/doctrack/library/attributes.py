"""Per-type field schemas for a Seguro's `attributes` JSONB bag.

Only some insurance types carry extra fields; the rest validate to `{}`.
Adding a type means a new enum value + (optionally) a schema here — no migration.
"""

from pydantic import BaseModel, ConfigDict

from .models import InsuranceType


class _Attributes(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class VehiculosAttributes(_Attributes):
    matricula: str | None = None
    chasis: str | None = None
    motor: str | None = None
    padron: str | None = None


class FianzaAttributes(_Attributes):
    numero_licitacion: str | None = None
    tipo_licitacion: str | None = None
    duracion_contrato: str | None = None


class EmptyAttributes(_Attributes):
    pass


_SCHEMAS: dict[InsuranceType, type[_Attributes]] = {
    InsuranceType.vehiculos: VehiculosAttributes,
    InsuranceType.fianzas: FianzaAttributes,
}


def validate_attributes(insurance_type: InsuranceType, raw: dict) -> dict:
    """Validate the raw bag against the type's schema; drop empty values."""
    schema = _SCHEMAS.get(insurance_type, EmptyAttributes)
    return schema.model_validate(raw or {}).model_dump(exclude_none=True)
