import { CheckCircle2, Loader } from "lucide-react";
import { Tag } from "@/components/tag";
import { statusMeta, type TicketStatus } from "@/lib/tags";

const icons = { WORKING: Loader, DONE: CheckCircle2 } as const;

export function StatusTag({ status }: { status: TicketStatus }) {
  const { label, token } = statusMeta(status);
  return <Tag token={token} icon={icons[status]} label={label} />;
}
