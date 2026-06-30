// Retry prisma migrate deploy up to 3 times to handle Neon DB cold start (P1002).
import { execSync } from "child_process";

const MAX = 3;
for (let i = 1; i <= MAX; i++) {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    process.exit(0);
  } catch {
    if (i === MAX) { console.error("migrate deploy failed after", MAX, "attempts"); process.exit(1); }
    console.log(`migrate deploy attempt ${i} failed — retrying in 5s...`);
    await new Promise(r => setTimeout(r, 5000));
  }
}
