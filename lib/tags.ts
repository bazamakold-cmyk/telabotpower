export type Urgency = "HIGH" | "MEDIUM" | "NORMAL";
export type TicketStatus = "RECEIVED" | "WORKING" | "DONE";
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
  switch (s) {
    case "RECEIVED":
      return { label: "รับเรื่อง", token: "info" };
    case "WORKING":
      return { label: "กำลังทำ", token: "working" };
    case "DONE":
      return { label: "ทำเสร็จแล้ว", token: "success" };
  }
}
