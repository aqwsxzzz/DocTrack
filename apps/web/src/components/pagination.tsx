import { Button } from "@/components/ui/button";

interface PaginationProps {
  offset: number;
  pageSize: number;
  total: number;
  onChange: (offset: number) => void;
}

export function Pagination({
  offset,
  pageSize,
  total,
  onChange,
}: PaginationProps): React.JSX.Element | null {
  if (total <= pageSize) {
    return null;
  }
  const page = Math.floor(offset / pageSize) + 1;
  const pageCount = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">
        Página {page} de {pageCount}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={offset === 0}
        onClick={() => onChange(offset - pageSize)}
      >
        Anterior
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={offset + pageSize >= total}
        onClick={() => onChange(offset + pageSize)}
      >
        Siguiente
      </Button>
    </div>
  );
}
