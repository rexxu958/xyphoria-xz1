export type ToolStatus = "PUBLIC" | "DRAFT" | "HIDDEN";

export interface ToolRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  version: string;
  author: string;
  filename: string;
  filepath: string; // relative path under data/files, never exposed raw to frontend
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  status: ToolStatus;
  featured: boolean;
  tags: string[];
  downloadCount: number;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: "owner" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface StatisticsData {
  downloads: { toolId: string; slug: string; timestamp: string }[];
  uploads: { toolId: string; slug: string; timestamp: string }[];
  views: { toolId: string; slug: string; timestamp: string }[];
}

export interface SettingsData {
  siteName: string;
  description: string;
  logo: string;
  favicon: string;
  footerText: string;
  socialLinks: Record<string, string>;
  maintenance: boolean;
}

export type ActivityAction =
  | "LOGIN"
  | "LOGOUT"
  | "UPLOAD"
  | "UPDATE"
  | "DELETE"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_DELETED"
  | "FILE_UPLOADED"
  | "FILE_DELETED"
  | "SETTINGS_CHANGED"
  | "BACKUP_CREATED"
  | "BACKUP_RESTORED";

export interface ActivityRecord {
  id: string;
  action: ActivityAction;
  target: string;
  status: "SUCCESS" | "FAILED";
  timestamp: string;
}

export interface ActivityData {
  activities: ActivityRecord[];
}

export interface ToolsData {
  tools: ToolRecord[];
}

export interface CategoriesData {
  categories: CategoryRecord[];
}

export interface UsersData {
  users: UserRecord[];
}
