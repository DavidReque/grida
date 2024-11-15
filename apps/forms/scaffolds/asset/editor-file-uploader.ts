import { useCallback, useMemo } from "react";
import { createClientWorkspaceClient } from "@/lib/supabase/client";
import { useEditorState } from "../editor";
import { nanoid } from "nanoid";
import { v4 } from "uuid";
import * as k from "./k";
import { FileIO } from "@/lib/file";
import { StorageClient } from "@supabase/storage-js";

function useStorageClient() {
  return useMemo(() => createClientWorkspaceClient().storage, []);
}

function useUpload(
  bucket: string,
  path: string | ((file: File) => string | Promise<string>)
) {
  const storage = useStorageClient();

  return useCallback(
    async (file: File): Promise<FileIO.UploadResult> => {
      if (!file) throw new Error("No file provided");
      const _path = typeof path === "function" ? await path(file) : path;
      if (!_path) throw new Error("No path provided");
      return await storage
        .from(bucket)
        .upload(_path, file, {
          contentType: file.type,
        })
        .then(({ data, error }) => {
          if (error) {
            throw new Error("Failed to upload file");
          }
          const publicUrl = storage.from(bucket).getPublicUrl(_path)
            .data.publicUrl;

          const result = {
            object_id: data.id,
            bucket,
            path: data.path,
            fullPath: data.fullPath,
            publicUrl,
          } satisfies FileIO.UploadResult;

          return result;
        })
        .catch((e) => {
          console.error("upload error", e);
          throw e;
        });
    },
    [storage, bucket, path]
  );
}

function useCreateAsset() {
  const [state] = useEditorState();
  const { document_id } = state;

  const supabase = useMemo(() => createClientWorkspaceClient(), []);

  return useCallback(
    async ({ file, is_public }: { file: File; is_public: boolean }) => {
      const id = v4();

      return supabase
        .from("asset")
        .insert({
          id,
          is_public,
          document_id: document_id,
          name: file.name,
          type: file.type,
          size: file.size,
        })
        .select()
        .single();
    },
    [supabase, document_id]
  );
}

const __make_asset_uploader = ({
  createAsset,
  storage,
  is_public,
}: {
  createAsset: ReturnType<typeof useCreateAsset>;
  storage: StorageClient;
  is_public: boolean;
}): FileIO.GridaAssetUploaderFn => {
  return async (file: File): Promise<FileIO.GridaAsset> => {
    if (!file) throw new Error("No file provided");

    // create asset
    const { data: asset, error } = await createAsset({ file, is_public });
    if (error) throw error;

    const bucket = is_public ? k.BUCKET_ASSETS_PUBLIC : k.BUCKET_ASSETS;
    const path = asset.id;

    return await storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type,
      })
      .then(({ data, error }) => {
        if (error) {
          throw new Error("Failed to upload file");
        }
        const publicUrl = storage.from(bucket).getPublicUrl(path)
          .data.publicUrl;

        const result = {
          id: asset.id,
          object_id: data.id,
          bucket,
          path: data.path,
          fullPath: data.fullPath,
          publicUrl,
          name: asset.name,
          size: asset.size,
          type: asset.type,
          is_public: asset.is_public,
          document_id: asset.document_id,
        } satisfies FileIO.GridaAsset;

        return result;
      })
      .catch((e) => {
        console.error("upload error", e);
        throw e;
      });
  };
};

/**
 * upload file to document asset bucket
 *
 * id and file names are uuid generated - fire and forget
 */
export function useDocumentAssetUpload(): {
  uploadPublic: FileIO.GridaAssetUploaderFn;
  uploadPrivate: FileIO.GridaAssetUploaderFn;
} {
  const storage = useStorageClient();
  const createAsset = useCreateAsset();

  const uploadPrivate = useCallback(
    __make_asset_uploader({
      createAsset,
      storage,
      is_public: false,
    }),
    [storage, createAsset]
  );

  const uploadPublic = useCallback(
    __make_asset_uploader({
      createAsset,
      storage,
      is_public: true,
    }),
    [storage, createAsset]
  );

  return { uploadPrivate, uploadPublic };
}

/**
 * @deprecated use useDocumentAssetUpload instead
 */
export function useGridaFormsPublicUpload() {
  const [state] = useEditorState();
  return useUpload(
    k.BUCKET_GRIDA_FORMS,
    () => `${state.form.form_id}/${nanoid()}`
  );
}

/**
 * public, temporary file uploader to playground bucket
 * for internal dev or public tmp playgrounds
 */
export function useDummyPublicUpload() {
  return useUpload(k.BUCKET_DUMMY, () => {
    return `public/${v4()}`;
  });
}
