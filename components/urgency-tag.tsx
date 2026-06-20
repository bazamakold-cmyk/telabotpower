import { AlertTriangle, Flame, Info } from "lucide-react";
import { Tag } from "@/components/tag";
import { urgencyMeta, type Urgency } from "@/lib/tags";

const icons = { HIGH: Flame, MEDIUM: AlertTriangle, NORMAL: Info } as const;

export function UrgencyTag({ urgency }: { urgency: Urgency }) {
  const { label, token } = urgencyMeta(urgency);
  return <Tag token={token} icon={icons[urgency]} label={label} />;
}
