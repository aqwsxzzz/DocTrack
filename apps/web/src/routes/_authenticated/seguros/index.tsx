import { createFileRoute } from "@tanstack/react-router";
import { SegurosBrowser } from "@/features/library/components/seguros-browser";

export const Route = createFileRoute("/_authenticated/seguros/")({
  component: SegurosBrowser,
});
