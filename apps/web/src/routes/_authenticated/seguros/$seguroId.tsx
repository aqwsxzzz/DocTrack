import { createFileRoute } from "@tanstack/react-router";
import { SeguroDetail } from "@/features/library/components/seguro-detail";

export const Route = createFileRoute("/_authenticated/seguros/$seguroId")({
  component: SeguroDetailPage,
});

function SeguroDetailPage() {
  const { seguroId } = Route.useParams();
  return <SeguroDetail seguroId={seguroId} />;
}
