export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const delay = (ms = 0) => new Promise<void>((resolve) => setTimeout(resolve, ms));
