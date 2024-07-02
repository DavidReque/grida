import { GRIDA_FORMS_RESPONSE_BUCKET } from "@/k/env";
import { client } from "@/lib/supabase/server";
import { TemplateVariables } from "@/lib/templating";
import {
  FileStorage,
  SessionStagedFileStorage,
} from "@/services/form/session-storage";
import { createXSupabaseClient } from "@/services/x-supabase";
import {
  ConnectionSupabaseJoint,
  FormFieldDefinition,
  FormFieldStorageSchema,
} from "@/types";
import { CreateSignedUploadUrlRequest } from "@/types/private/api";
import assert from "assert";

export class FieldStorageService {
  constructor(
    readonly storage: FormFieldStorageSchema | null,
    readonly supabase_connection: ConnectionSupabaseJoint | null
  ) {
    //
  }

  private _m_fileStorage: FileStorage | null = null;
  private async getFileStorage() {
    if (this._m_fileStorage) {
      return this._m_fileStorage;
    }

    if (this.storage) {
      if (this.storage.type === "x-supabase") {
        assert(this.supabase_connection, "supabase_connection not found");
        const client = await createXSupabaseClient(
          this.supabase_connection.supabase_project_id,
          {
            service_role: true,
          }
        );

        this._m_fileStorage = new FileStorage(client, this.storage.bucket);
        return this._m_fileStorage;
      }

      throw new Error("storage type not supported");
    }

    this._m_fileStorage = new FileStorage(client, GRIDA_FORMS_RESPONSE_BUCKET);
    return this._m_fileStorage;
  }

  async createSignedUploadUrlFromFile(
    file: CreateSignedUploadUrlRequest["file"],
    context: TemplateVariables.Context
  ) {
    // /
  }

  async createSignedUpsertUrlFromPath(path: string) {
    return this.createSignedUploadUrl(path, { upsert: true });
  }

  private async createSignedUploadUrl(
    path: string,
    options?: { upsert: boolean }
  ) {
    const fs = await this.getFileStorage();
    return fs.createSignedUploadUrl(path, options);
  }
}

export namespace SessionStorageServices {
  export async function createSignedUploadUrl({
    session_id,
    field,
    file,
    config,
    connection,
  }: {
    session_id: string;
    field: Pick<FormFieldDefinition, "id" | "storage">;
    file: {
      name: string;
    };
    config?: {
      unique?: boolean;
    };
    connection: {
      supabase_connection: ConnectionSupabaseJoint | null;
    };
  }) {
    if (field.storage) {
      const { type, mode, bucket, path } =
        field.storage as any as FormFieldStorageSchema;

      switch (type) {
        case "x-supabase": {
          assert(
            connection.supabase_connection,
            "supabase_connection not found"
          );
          const client = await createXSupabaseClient(
            connection.supabase_connection.supabase_project_id,
            {
              service_role: true,
            }
          );
          switch (mode) {
            case "direct": {
              const storage = new FileStorage(client, bucket);
              return storage.createSignedUploadUrl(path);
              break;
            }
            case "staged": {
              const storage = new SessionStagedFileStorage(client, bucket);
              return storage.createStagedSignedUploadUrl(
                {
                  field_id: field.id,
                  session_id: session_id,
                },
                file.name,
                config?.unique
              );
            }
          }
          break;
        }
        case "grida":
        case "x-s3":
        default:
          throw new Error("storage type not supported");
      }
    } else {
      const storage = new SessionStagedFileStorage(
        client,
        GRIDA_FORMS_RESPONSE_BUCKET
      );

      return storage.createStagedSignedUploadUrl(
        {
          field_id: field.id,
          session_id: session_id,
        },
        file.name,
        config?.unique
      );
    }
  }

  export async function getPublicUrl({
    field,
    file,
    connection,
  }: {
    field: Pick<FormFieldDefinition, "id" | "storage">;
    file: {
      path: string;
    };
    connection: {
      supabase_connection: ConnectionSupabaseJoint | null;
    };
  }) {
    //
    if (field.storage) {
      const { type, bucket } = field.storage as any as FormFieldStorageSchema;

      switch (type) {
        case "x-supabase": {
          assert(
            connection.supabase_connection,
            "supabase_connection not found"
          );
          const client = await createXSupabaseClient(
            connection.supabase_connection.supabase_project_id,
            {
              // we don't need service role here - we are getting public url (does not require api request)
              service_role: false,
            }
          );

          const storage = new FileStorage(client, bucket);
          return storage.getPublicUrl(file.path);
        }
        case "grida":
        case "x-s3":
        default:
          throw new Error("storage type not supported");
      }
    } else {
      const storage = new FileStorage(client, GRIDA_FORMS_RESPONSE_BUCKET);

      return storage.getPublicUrl(file.path);
    }
  }
}
