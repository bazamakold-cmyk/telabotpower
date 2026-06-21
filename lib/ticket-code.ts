/**
 * Format a ticket sequence number into a human code.
 * 1 → TA00001 … 99999 → TA99999 … 100000 → TB00001 …
 */
export function formatTicketCode(seq: number): string {
  const n = Math.max(1, Math.floor(seq));
  const letterIndex = Math.floor((n - 1) / 99999); // 0 = A
  const within = ((n - 1) % 99999) + 1; // 1..99999
  const letter = String.fromCharCode(65 + letterIndex);
  return `T${letter}${String(within).padStart(5, "0")}`;
}
