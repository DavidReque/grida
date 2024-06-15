import { createClientFormsClient } from "@/lib/supabase/client";
import {
  GRIDA_FORMS_RESPONSE_BUCKET,
  GRIDA_FORMS_RESPONSE_BUCKET_UPLOAD_LIMIT,
  GRIDA_FORMS_RESPONSE_MULTIPART_FILE_UOLOAD_LIMIT,
} from "@/k/env";
import type { FieldUploadStrategy } from "@/lib/forms";
import type {
  CreateSessionSignedUploadUrlRequest,
  FormsApiResponse,
  SessionSignedUploadUrlData,
} from "@/types/private/api";

export type FileUploaderFn = (file: File) => Promise<{ path?: string }>;

export function getMaxUploadSize(strategy?: FieldUploadStrategy["type"]) {
  switch (strategy) {
    case "requesturl":
    case "signedurl":
      return GRIDA_FORMS_RESPONSE_BUCKET_UPLOAD_LIMIT;
    case "multipart":
    default:
      return GRIDA_FORMS_RESPONSE_MULTIPART_FILE_UOLOAD_LIMIT;
  }
}

export function makeUploader(strategy?: FieldUploadStrategy) {
  switch (strategy?.type) {
    case "signedurl":
      // return makeSignedUrlUploader(strategy);
      throw new Error("Not implemented");
    case "requesturl":
      return makeRequestUrlUploader(strategy);
    case "multipart":
    default:
      return undefined;
  }
}

export async function makeSignedUrlUploader({
  signed_urls,
}: {
  signed_urls: { path: string; token: string }[];
}) {
  const supabase = createClientFormsClient();

  return async (file: File, i: number) => {
    const { path, token } = signed_urls[i];

    const { data: uploaded } = await supabase.storage
      .from(GRIDA_FORMS_RESPONSE_BUCKET)
      .uploadToSignedUrl(path, token, file, {
        upsert: true,
      });

    return { path: uploaded?.path };
  };
}

export function makeRequestUrlUploader({
  request_url,
}: {
  request_url: string;
}) {
  const supabase = createClientFormsClient();

  return async (file: File) => {
    const res = await fetch(request_url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(<CreateSessionSignedUploadUrlRequest>{
        file: {
          name: file.name,
          size: file.size,
        },
      }),
    });

    const { data } =
      (await res.json()) as FormsApiResponse<SessionSignedUploadUrlData>;

    if (data) {
      const { signedUrl, path, token } = data;

      // const { data: uploaded } = await supabase.storage
      //   .from(GRIDA_FORMS_RESPONSE_BUCKET)
      //   .uploadToSignedUrl(path, token, file, {
      //     upsert: true,
      //   });

      // using this for more dynamic control - x-supabase integrations
      const { data: uploaded } = await uploadToSupabaseS3SignedUrl(
        signedUrl,
        file
      );

      return { path: uploaded?.path };
    } else {
      throw new Error("Failed to get signed url");
    }
  };
}

async function uploadToSupabaseS3SignedUrl(
  signed_url: string,
  file: File
): Promise<{
  data: {
    fullPath: string;
    path: string;
  } | null;
  error: any;
}> {
  try {
    const response = await fetch(signed_url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (response.ok) {
      const uploaded = await response.json();

      return {
        data: {
          path: uploaded.Key.split("/").slice(1).join("/"),
          fullPath: uploaded.Key,
        },
        error: null,
      };
    } else {
      return { data: null, error: response.statusText };
    }
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}
