import type { FormBlock, FormFieldDefinition, FormResponse } from "@/types";

export type DraftID = `[draft]${string}`;
export const DRAFT_ID_START_WITH = "[draft]";

export interface FormEditorInit {
  form_id: string;
  form_title: string;
  blocks: EditorFormBlock[];
  fields: FormFieldDefinition[];
}

export function initialFormEditorState(init: FormEditorInit): FormEditorState {
  // ensure initial blocks are sorted by local_index
  const sorted_blocks = Array.from(init.blocks).sort((a, b) => {
    return a.local_index - b.local_index;
  });

  // prepare initial available_field_ids
  const field_ids = init.fields.map((f) => f.id);
  const block_referenced_field_ids = init.blocks
    .map((b) => b.form_field_id)
    .filter((id) => id !== null) as string[];
  const block_available_field_ids = field_ids.filter(
    (id) => !block_referenced_field_ids.includes(id)
  );

  return {
    form_id: init.form_id,
    form_title: init.form_title,
    blocks: sorted_blocks,
    fields: init.fields,
    selected_responses: new Set(),
    available_field_ids: block_available_field_ids,
    responses_pagination_rows: 100,
  };
}

export interface FormEditorState {
  form_id: string;
  form_title: string;
  blocks: EditorFormBlock[];
  fields: FormFieldDefinition[];
  focus_field_id?: string;
  focus_response_id?: string;
  focus_block_id?: string;
  available_field_ids: string[];
  responses?: FormResponse[];
  selected_responses: Set<string>;
  responses_pagination_rows: number;
  is_field_edit_panel_open?: boolean;
  is_response_edit_panel_open?: boolean;
  field_edit_panel_refresh_key?: number;
}

export interface EditorFormBlock extends FormBlock {
  id: string | DraftID;
}
