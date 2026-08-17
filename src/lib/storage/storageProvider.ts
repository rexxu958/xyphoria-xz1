/**
 * StorageProvider abstraction. Today: LocalFileStorage (server disk).
 * Future: swap in S3/R2/etc without touching callers.
 */
export interface StorageProvider {
  save(buffer: Buffer, internalName: string, category: string): Promise<string>; // returns relative filepath
  delete(relativePath: string): Promise<void>;
  getAbsolutePath(relativePath: string): string;
  exists(relativePath: string): Promise<boolean>;
}
