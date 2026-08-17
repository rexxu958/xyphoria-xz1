import { JsonFileDatabase } from "./database";
import { SettingsData } from "../types";

const settingsDb = new JsonFileDatabase<SettingsData>("settings.json");

export async function readSettings(): Promise<SettingsData> {
  return settingsDb.read();
}

export async function writeSettings(data: SettingsData): Promise<void> {
  await settingsDb.write(data);
}
