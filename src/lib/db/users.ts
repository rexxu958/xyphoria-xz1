import { CollectionRepository } from "./database";
import { UserRecord } from "../types";

export const usersRepo = new CollectionRepository<UserRecord, "users">("users.json", "users");

export async function findUserByUsername(username: string): Promise<UserRecord | undefined> {
  return usersRepo.findOne((u) => u.username.toLowerCase() === username.toLowerCase());
}
