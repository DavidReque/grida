import OpenAPIParser from "@readme/openapi-parser";
import type { OpenAPI } from "openapi-types";

type SupabaseOpenAPIDocument = OpenAPI.Document & {
  basePath: string;
  consumes: string[];
  definitions: {
    [key: string]: {
      properties: {
        [key: string]: {
          default?: any;
          description?: string;
          type: string;
          format: string;
        };
      };
      type: string;
      required: string[];
    };
  };
  host: string;
  parameters: any;
  produces: string[];
  schemes: string[];
  swagger: string;
};

export type SupabasePublicSchema = SupabaseOpenAPIDocument["definitions"];

function build_supabase_openapi_url(url: string, apiKey: string) {
  return `${url}/rest/v1/?apikey=${apiKey}`;
}

export async function parseSupabaseSchema({
  url,
  anonKey,
}: {
  url: string;
  anonKey: string;
}): Promise<{
  sb_anon_key: string;
  sb_project_reference_id: string;
  sb_public_schema: { [key: string]: any };
  sb_project_url: string;
}> {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const projectref = u.hostname.split(".")[0];

      OpenAPIParser.parse(
        build_supabase_openapi_url(url, anonKey),
        (error, api) => {
          if (error || !api) {
            return reject(error);
          }

          const apidoc = api as SupabaseOpenAPIDocument;

          // validate
          if (apidoc.host.includes(projectref)) {
            return resolve({
              sb_anon_key: anonKey,
              sb_project_reference_id: projectref,
              sb_public_schema: apidoc.definitions,
              sb_project_url: url,
            });
          }

          reject("Invalid URL");
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}
