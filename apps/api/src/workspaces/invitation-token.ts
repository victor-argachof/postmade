import { createHash } from "node:crypto";

export const hashInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
