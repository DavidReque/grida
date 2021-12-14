import { openDB, IDBPDatabase } from "idb";
import { FileResponse } from "@design-sdk/figma-remote-api";

// #region global db initialization
const __db_pref = { name: "fimga-file-store", version: 1 };
const __pk = "key";
const __table = "files";
export type FileResponseRecord = FileResponse & {
  [__pk]: string;
};

const db: Promise<IDBPDatabase<StorableFileResponse>> = new Promise(
  (resolve) => {
    openDB<StorableFileResponse>(__db_pref.name, __db_pref.version, {
      upgrade(db) {
        db.createObjectStore(__table, {
          keyPath: __pk,
        });
      },
    }).then((_db) => {
      resolve(_db);
    });
  }
);
// #endregion

export class FigmaFilesStore {
  static of = (key: string): FigmaFileStore => {
    return new FigmaFileStore(key);
  };

  static async all() {
    const files = await (await db).getAll(__table);
    return files.map((file) => file as FileResponseRecord);
  }

  static async add(key: string, file: FileResponse) {
    return new FigmaFileStore(key).upsert(file);
  }
}

export class FigmaFileStore {
  constructor(readonly filekey: string) {}

  async upsert(file: FileResponse) {
    try {
      await (
        await db
      ).put(__table, <StorableFileResponse>{
        ...minimizeFileResponse(file),
        [__pk]: this.filekey,
      });
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error(e);
        throw e;
      }
    }
  }

  async get(options?: { nounwrap?: boolean }): Promise<FileResponseRecord> {
    const rec = await (await db).get(__table, this.filekey);
    if (options?.nounwrap) {
      return rec;
    }
    return unwrapStorableFileResponse(rec);
  }
}

type StorableFileResponse = {
  readonly components: JSONString;
  readonly styles: JSONString;
  readonly document: JSONString;
  readonly lastModified: string;
  readonly name: string;
  readonly role: string;
  readonly schemaVersion: number;
  readonly thumbnailUrl: string;
  readonly version: string;
};

type JSONString = string;
function minimizeFileResponse(file: FileResponse): StorableFileResponse {
  return {
    components: JSON.stringify(file.components),
    styles: JSON.stringify(file.styles),
    document: JSON.stringify(file.document),
    lastModified: file.lastModified,
    name: file.name,
    role: file.role,
    schemaVersion: file.schemaVersion,
    thumbnailUrl: file.thumbnailUrl,
    version: file.version,
  };
}

function unwrapStorableFileResponse(
  stored: StorableFileResponse | undefined | null
): FileResponseRecord {
  if (!stored) return;
  return {
    key: stored[__pk],
    components: JSON.parse(stored.components),
    styles: JSON.parse(stored.styles),
    document: JSON.parse(stored.document),
    lastModified: stored.lastModified,
    name: stored.name,
    role: stored.role as any,
    schemaVersion: stored.schemaVersion,
    thumbnailUrl: stored.thumbnailUrl,
    version: stored.version,
  };
}
