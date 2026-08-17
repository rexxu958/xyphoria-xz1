import { randomUUID } from "crypto";
import { JsonFileDatabase } from "./database";
import { ActivityAction, ActivityData, ActivityRecord } from "../types";

const activityDb = new JsonFileDatabase<ActivityData>("activity.json");

export async function logActivity(
  action: ActivityAction,
  target: string,
  status: "SUCCESS" | "FAILED" = "SUCCESS"
): Promise<ActivityRecord> {
  const data = await activityDb.read();
  const record: ActivityRecord = {
    id: randomUUID(),
    action,
    target,
    status,
    timestamp: new Date().toISOString(),
  };
  data.activities.unshift(record);
  // Keep the log from growing unbounded forever.
  if (data.activities.length > 5000) {
    data.activities = data.activities.slice(0, 5000);
  }
  await activityDb.write(data);
  return record;
}

export async function listActivity(limit = 200): Promise<ActivityRecord[]> {
  const data = await activityDb.read();
  return data.activities.slice(0, limit);
}
