// Strip the -100 supergroup prefix so basic and supergroup IDs compare equal.
export function bareId(chatId: string): string {
  return chatId.replace(/^-100/, "-");
}

export function groupIdsMatch(a: string, b: string): boolean {
  return a === b || bareId(a) === bareId(b);
}
