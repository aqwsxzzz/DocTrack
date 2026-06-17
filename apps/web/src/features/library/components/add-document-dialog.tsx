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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUploadDocumentMutation } from "../api/library-queries";
import { DOC_KINDS, type DocKind } from "../types/library-types";

export function AddDocumentDialog({
  seguroId,
}: {
  seguroId: string;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [docKind, setDocKind] = useState<DocKind>("Póliza");
  const [file, setFile] = useState<File | null>(null);
  const mutation = useUploadDocumentMutation(seguroId);

  function handleSubmit(): void {
    if (!title.trim() || !file) {
      toast.error("Completá el título y elegí un archivo");
      return;
    }
    mutation.mutate(
      { title: title.trim(), doc_kind: docKind, file },
      {
        onSuccess: () => {
          toast.success("Documento subido");
          setOpen(false);
          setTitle("");
          setFile(null);
        },
        onError: () => toast.error("No se pudo subir el documento"),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Subir documento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Título</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de documento</Label>
            <Select
              value={docKind}
              onValueChange={(value) => setDocKind(value as DocKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_KINDS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-file">Archivo</Label>
            <Input
              id="doc-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Subiendo…" : "Subir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
