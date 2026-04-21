import { createHash } from "node:crypto";

export function hashAdminPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}
