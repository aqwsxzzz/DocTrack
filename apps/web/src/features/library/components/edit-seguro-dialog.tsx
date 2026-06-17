import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUpdateSeguroMutation } from "../api/library-queries";
import type { Seguro } from "../types/library-types";
import { formToInput, seguroToForm } from "./seguro-form";
import { SeguroFields } from "./seguro-form-fields";

export function EditSeguroDialog({
  seguro,
}: {
  seguro: Seguro;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => seguroToForm(seguro));
  const mutation = useUpdateSeguroMutation(seguro.id);

  function handleSubmit(): void {
    if (!form.numeroPoliza.trim() || !form.vigenciaDesde) {
      toast.error("Completá el número de póliza y la vigencia desde");
      return;
    }
    mutation.mutate(formToInput(form), {
      onSuccess: () => {
        toast.success("Seguro actualizado");
        setOpen(false);
      },
      onError: () => toast.error("No se pudo actualizar el seguro"),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setForm(seguroToForm(seguro));
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar seguro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <SeguroFields value={form} onChange={setForm} />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
