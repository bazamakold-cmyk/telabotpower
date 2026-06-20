export type Urgency = "HIGH" | "MEDIUM" | "NORMAL";
export type TicketStatus = "WORKING" | "DONE";
export type Token = "danger" | "warn" | "info" | "working" | "success";

export type TagMeta = { label: string; token: Token };

export function urgencyMeta(u: Urgency): TagMeta {
  switch (u) {
    case "HIGH":
      return { label: "เร่งด่วนมาก", token: "danger" };
    case "MEDIUM":
      return { label: "ปานกลาง", token: "warn" };
    case "NORMAL":
      return { label: "ปกติ", token: "info" };
  }
}

export function statusMeta(s: TicketStatus): TagMeta {
  return s === "WORKING"
    ? { label: "กำลังทำ", token: "working" }
    : { label: "ทำเสร็จแล้ว", token: "success" };
}
