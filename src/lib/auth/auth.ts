import { randomUUID } from "crypto";
import { usersRepo, findUserByUsername } from "../db/users";
import { UserRecord } from "../types";

export {
  signSession,
  verifySession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
  type SessionPayload,
} from "./session";

/**
 * Seeds a single owner account from environment variables on first run,
 * so the owner never has to hand-edit users.json.
 * OWNER_PASSWORD_HASH must already be a bcrypt hash (never plaintext).
 */
export async function ensureOwnerSeeded(): Promise<void> {
  const users = await usersRepo.read();
  if (users.length > 0) return;

  const username = process.env.OWNER_USERNAME;
  const passwordHash = process.env.OWNER_PASSWORD_HASH;
  if (!username || !passwordHash) return;

  const now = new Date().toISOString();
  const owner: UserRecord = {
    id: randomUUID(),
    username,
    passwordHash,
    role: "owner",
    createdAt: now,
    updatedAt: now,
  };
  await usersRepo.create(owner);
}

export async function getUserByUsername(username: string) {
  return findUserByUsername(username);
}
