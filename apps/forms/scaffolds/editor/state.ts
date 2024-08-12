import { blockstreeflat } from "@/lib/forms/tree";
import type {
  Appearance,
  ConnectionSupabaseJoint,
  Customer,
  EndingPageI18nOverrides,
  EndingPageTemplateID,
  FontFamily,
  FormBlock,
  FormBlockType,
  FormFieldDefinition,
  FormFieldInit,
  FormMethod,
  FormPageBackgroundSchema,
  FormResponse,
  FormResponseField,
  FormResponseSession,
  FormResponseUnknownFieldHandlingStrategyType,
  FormStyleSheetV1Schema,
  FormsPageLanguage,
  GridaSupabase,
  OrderBy,
} from "@/types";
import { LOCALTZ } from "./symbols";
import { SupabasePostgRESTOpenApi } from "@/lib/supabase-postgrest";
import { ZodObject } from "zod";
import { Tokens } from "@/ast";
import React from "react";
import { editorbasepath } from "@/lib/forms/url";

export type GDocEditorRouteParams = {
  org: string;
  proj: string;
  id: string;
};

export type DraftID = `[draft]${string}`;
export const DRAFT_ID_START_WITH = "[draft]";
const ISDEV = process.env.NODE_ENV === "development";

export interface FormEditorInit {
  organization: {
    name: string;
    id: number;
  };
  project: {
    name: string;
    id: number;
  };
  form_id: string;
  campaign: FormEditorState["campaign"];
  form_security: FormEditorState["form_security"];
  ending: FormEditorState["ending"];
  connections?: {
    store_id?: number | null;
    supabase?: GridaSupabase.SupabaseConnectionState;
  };
  theme: FormEditorState["theme"];
  form_title: string;
  document_id: string;
  document_title: string;
  blocks: EditorFlatFormBlock[];
  fields: FormFieldDefinition[];
}

export function initialFormEditorState(init: FormEditorInit): FormEditorState {
  // prepare initial available_field_ids
  const field_ids = init.fields.map((f) => f.id);
  const block_referenced_field_ids = init.blocks
    .map((b) => b.form_field_id)
    .filter((id) => id !== null) as string[];
  const block_available_field_ids = field_ids.filter(
    (id) => !block_referenced_field_ids.includes(id)
  );

  const is_main_table_supabase =
    !!init.connections?.supabase?.main_supabase_table;

  const basepath = editorbasepath({
    org: init.organization.name,
    proj: init.project.name,
  });

  return {
    saving: false,
    basepath: basepath,
    project: init.project,
    organization: init.organization,
    connections: {
      store_id: init.connections?.store_id,
      supabase: init.connections?.supabase,
    },
    theme: init.theme,
    form_id: init.form_id,
    form_title: init.form_title,
    tables: init.connections?.supabase?.main_supabase_table
      ? [
          {
            name: init.connections.supabase.main_supabase_table.sb_table_name,
            group: "x-supabase-main-table",
            views: [
              {
                type: "x-supabase-main-table",
                name: init.connections.supabase.main_supabase_table
                  .sb_table_name,
                label:
                  init.connections.supabase.main_supabase_table.sb_table_name,
              },
            ],
          },
          {
            name: "auth.users",
            group: "x-supabase-auth.users",
            views: [
              {
                type: "x-supabase-auth.users",
                name: "auth.users",
                label: "auth.users",
              },
            ],
          },
        ]
      : [
          {
            name: "Responses",
            group: "response",
            views: [
              { type: "response", name: "response", label: "Responses" },
              { type: "session", name: "session", label: "Sessions" },
            ],
          },
          {
            name: "Customers",
            group: "customer",
            views: [{ type: "customer", name: "customer", label: "Customers" }],
          },
        ],
    campaign: init.campaign,
    form_security: init.form_security,
    ending: init.ending,
    document_id: init.document_id,
    document_title: init.document_title,
    blocks: blockstreeflat(init.blocks),
    document: {
      pages: formpagesinit({ basepath, document_id: init.document_id }),
      selected_page_id: "form",
      nodes: [],
      templatesample: "formcollection_sample_001_the_bundle",
      templatedata: {},
    },
    fields: init.fields,
    assets: {
      backgrounds: [],
    },
    customers: undefined,
    responses: {
      rows: [],
      fields: {},
    },
    selected_rows: new Set(),
    available_field_ids: block_available_field_ids,
    datagrid_rows_per_page: 100,
    datagrid_table_refresh_key: 0,
    datagrid_table_row_keyword: "row",
    datagrid_isloading: false,
    dateformat: "datetime",
    datetz: LOCALTZ,
    datagrid_table: is_main_table_supabase
      ? "x-supabase-main-table"
      : "response",
    datagrid_filter: {
      masking_enabled: false,
      empty_data_hidden: true,
    },
    datagrid_orderby: {},
    realtime_responses_enabled: true,
    realtime_sessions_enabled: false,
    x_supabase_main_table: init.connections?.supabase
      ? xsbmtinit(init.connections.supabase)
      : undefined,
  };
}

function formpagesinit({
  basepath,
  document_id,
}: {
  basepath: string;
  document_id: string;
}): MenuItem[] {
  return [
    {
      section: "Form",
      id: "campaign",
      label: "Campaign",
      href: `/${basepath}/${document_id}/form`,
      icon: "folder",
    },
    // {
    //   section: "Form",
    //   id: "start",
    //   label: "Start Page",
    //   href: `/${basepath}/${form_id}/form/start`,
    //   icon: "file",
    //   level: 1,
    // },
    {
      section: "Form",
      id: "form",
      label: "Form Page",
      href: `/${basepath}/${document_id}/form/edit`,
      icon: "file",
      level: 1,
    },
    {
      section: "Form",
      id: "ending",
      label: "Ending Page",
      href: `/${basepath}/${document_id}/form/end`,
      icon: "file",
      level: 1,
    },
    {
      section: "Data",
      id: "responses",
      label: "Responses",
      href: `/${basepath}/${document_id}/data/responses`,
      icon: "table",
    },
    {
      section: "Analytics",
      id: "realtime",
      label: "Realtime",
      href: `/${basepath}/${document_id}/data/analytics`,
      icon: "chart",
    },
  ];
}

function xsbmtinit(conn?: GridaSupabase.SupabaseConnectionState) {
  // TODO: need inspection - will supbaseconn present even when main table is not present?
  // if yes, we need to adjust the state to be nullable
  if (!conn) return undefined;
  if (!conn.main_supabase_table) return undefined;

  const parsed = conn.main_supabase_table.sb_table_schema
    ? SupabasePostgRESTOpenApi.parse_supabase_postgrest_schema_definition(
        conn.main_supabase_table?.sb_table_schema
      )
    : undefined;

  return {
    schema: conn.main_supabase_table.sb_table_schema,
    pks: parsed?.pks || [],
    gfpk: (parsed?.pks?.length || 0) > 0 ? parsed?.pks[0] : undefined,
    rows: [],
  };
}

export interface DataGridFilterSettings {
  localsearch?: string; // local search uses fuse.js to available data
  masking_enabled: boolean;
  empty_data_hidden: boolean;
}

type GFTable =
  | {
      type: "response" | "session";
      name: string;
      label: string;
    }
  | {
      type: "customer";
      name: string;
      label: string;
    }
  | {
      type: "x-supabase-main-table" | "x-supabase-auth.users";
      name: string;
      label: string;
    };

interface MenuItem {
  section: string;
  id: string;
  level?: number;
  label: string;
  icon: "folder" | "file" | "setting" | "table" | "chart";
  href?: string;
}

export interface FormEditorState {
  saving: boolean;
  basepath: string;
  organization: {
    name: string;
    id: number;
  };
  project: {
    name: string;
    id: number;
  };
  connections: {
    store_id?: number | null;
    supabase?: GridaSupabase.SupabaseConnectionState;
  };
  form_id: string;
  form_title: string;
  campaign: {
    max_form_responses_by_customer: number | null;
    is_max_form_responses_by_customer_enabled: boolean;
    max_form_responses_in_total: number | null;
    is_max_form_responses_in_total_enabled: boolean;
    is_force_closed: boolean;
    is_scheduling_enabled: boolean;
    scheduling_open_at: string | null;
    scheduling_close_at: string | null;
    scheduling_tz?: string;
  };
  form_security: {
    unknown_field_handling_strategy: FormResponseUnknownFieldHandlingStrategyType;
    method: FormMethod;
  };
  ending: {
    is_redirect_after_response_uri_enabled: boolean;
    redirect_after_response_uri: string | null;
    is_ending_page_enabled: boolean;
    ending_page_template_id: EndingPageTemplateID | null;
    ending_page_i18n_overrides: EndingPageI18nOverrides | null;
  };
  document_id: string;
  document_title: string;
  blocks: EditorFlatFormBlock[];
  document: {
    pages: MenuItem[];
    selected_page_id: string;
    nodes: any[];
    templatesample: string;
    templatedata: {
      [key: string]: {
        text?: Tokens.StringValueExpression;
        template_id: string;
        attributes?: Omit<
          React.HtmlHTMLAttributes<HTMLDivElement>,
          "style" | "className"
        >;
        properties?: { [key: string]: Tokens.StringValueExpression };
        style?: React.CSSProperties;
      };
    };
    selected_node_id?: string;
    selected_node_type?: string;
    selected_node_schema?: ZodObject<any> | null;
    selected_node_default_properties?: Record<string, any>;
    selected_node_default_style?: React.CSSProperties;
    selected_node_default_text?: Tokens.StringValueExpression;
    selected_node_context?: Record<string, any>;
  };
  fields: FormFieldDefinition[];
  field_draft_init?: Partial<FormFieldInit> | null;
  focus_field_id?: string | null;
  focus_response_id?: string;
  focus_customer_id?: string;
  focus_block_id?: string | null;
  available_field_ids: string[];
  theme: {
    is_powered_by_branding_enabled: boolean;
    lang: FormsPageLanguage;
    appearance: Appearance;
    palette?: FormStyleSheetV1Schema["palette"];
    fontFamily: FontFamily;
    customCSS?: FormStyleSheetV1Schema["custom"];
    section?: FormStyleSheetV1Schema["section"];
    background?: FormPageBackgroundSchema;
  };
  assets: {
    backgrounds: {
      name: string;
      title: string;
      embed: string;
      preview: [string] | [string, string];
    }[];
  };
  customers?: Customer[];
  selected_rows: Set<string>;
  responses: {
    rows: FormResponse[];
    fields: { [key: string]: FormResponseField[] };
  };
  sessions?: FormResponseSession[];
  tables: {
    name: string;
    group:
      | "response"
      | "customer"
      | "x-supabase-main-table"
      | "x-supabase-auth.users";
    views: GFTable[];
  }[];
  datagrid_rows_per_page: number;
  datagrid_table:
    | "response"
    | "session"
    | "customer"
    | "x-supabase-main-table"
    | "x-supabase-auth.users";
  datagrid_table_refresh_key: number;
  datagrid_table_row_keyword: string;
  datagrid_isloading: boolean;
  datagrid_filter: DataGridFilterSettings;
  datagrid_orderby: { [key: string]: OrderBy };
  realtime_sessions_enabled: boolean;
  realtime_responses_enabled: boolean;
  is_insert_menu_open?: boolean;
  is_field_edit_panel_open?: boolean;
  is_response_edit_panel_open?: boolean;
  is_customer_edit_panel_open?: boolean;
  is_block_edit_panel_open?: boolean;
  field_edit_panel_refresh_key?: number;
  dateformat: "date" | "time" | "datetime";
  datetz: typeof LOCALTZ | string;
  x_supabase_main_table?: {
    schema: GridaSupabase.JSONSChema;
    // we need a single pk for editor operations
    gfpk: string | undefined;
    pks: string[];
    rows: GridaSupabase.XDataRow[];
  };
}

export interface EditorFlatFormBlock<T = FormBlockType> extends FormBlock<T> {
  id: string | DraftID;
}
