import { cacheFilesFor, fileIdOf, listFileCache } from '../../lib/masa-files';

/**
 * Tracks the file a scenario uploaded. Masa names cache files after a generated
 * file ID, so the ID is found by diffing the cache directory around the upload.
 */
export class UploadedFiles {
  private before = new Set<string>();
  fileId?: string;
  extension?: string;
  originalPath?: string;

  snapshot() {
    this.before = new Set(listFileCache());
  }

  detect(originalPath: string) {
    const added = listFileCache().filter((name) => !this.before.has(name));
    // The stored original is named {fileID}.{ext}, without a variant suffix.
    const original = added.find((name) => /^[0-9A-F-]{34,}\.[a-z0-9]+$/i.test(name));
    if (!original) throw new Error(`No new file appeared in the file cache. New files: ${added.join(', ') || 'none'}`);
    this.fileId = fileIdOf(original);
    this.extension = original.split('.').pop();
    this.originalPath = originalPath;
  }

  get id(): string {
    if (!this.fileId) throw new Error('No file was uploaded in this scenario');
    return this.fileId;
  }

  get cacheFiles(): string[] {
    return cacheFilesFor(this.id);
  }

  variant(suffix: string): string {
    return `${this.id}_${suffix}.${this.extension}`;
  }
}
