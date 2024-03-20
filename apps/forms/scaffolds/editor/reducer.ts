import { produce } from "immer";
import { FormEditorState } from "./state";
import {
  BlocksEditorAction,
  ChangeBlockFieldAction,
  CreateNewPendingBlockAction,
  DeleteBlockAction,
  FeedResponseAction,
  FocusFieldAction,
  OpenEditFieldAction,
  ResolvePendingBlockAction,
  ResponseFeedRowsAction,
  SaveFieldAction,
  SortBlockAction,
} from "./action";
import { arrayMove } from "@dnd-kit/sortable";

export function reducer(
  state: FormEditorState,
  action: BlocksEditorAction
): FormEditorState {
  switch (action.type) {
    case "blocks/new": {
      // TODO: if adding new section, if there is a present non-section-blocks on root, it should automatically be nested under new section.
      const { block } = <CreateNewPendingBlockAction>action;
      return produce(state, (draft) => {
        // find unused field id (if any)
        const field_ids = draft.fields.map((f) => f.id);
        const used_ids = draft.blocks.map((b) => b.form_field_id);
        const unused_ids = field_ids.filter((id) => !used_ids.includes(id));
        const field_id = unused_ids[0] ?? null;

        draft.blocks.push({
          id: "[draft]" + Math.random().toString(36).substring(7),
          form_field_id: field_id,
          form_id: state.form_id,
          type: block,
          data: {},
        });
      });
    }
    case "blocks/resolve": {
      const { block_id, block } = <ResolvePendingBlockAction>action;
      return produce(state, (draft) => {
        const index = draft.blocks.findIndex((b) => b.id === block_id);
        if (index !== -1) {
          draft.blocks[index] = block;
        }
      });
    }
    case "blocks/delete": {
      const { block_id } = <DeleteBlockAction>action;
      console.log("delete block", block_id);
      return produce(state, (draft) => {
        draft.blocks = draft.blocks.filter((block) => block.id !== block_id);
      });
    }
    case "blocks/field/change": {
      const { block_id, field_id } = <ChangeBlockFieldAction>action;
      return produce(state, (draft) => {
        const block = draft.blocks.find((b) => b.id === block_id);
        if (block) {
          block.form_field_id = field_id;
        }
      });
    }
    case "blocks/sort": {
      const { block_id, over_id } = <SortBlockAction>action;
      return produce(state, (draft) => {
        if (over_id === "root") {
          return;
        }

        const oldIndex = draft.blocks.findIndex(
          (block) => block.id === block_id
        );

        const newIndex = draft.blocks.findIndex(
          (block) => block.id === over_id
        );

        // Ensure arrayMove returns a new array with objects that can be mutated
        let movedBlocks = arrayMove(draft.blocks, oldIndex, newIndex);

        // Re-assign draft.blocks to ensure the objects are treated as new if necessary
        draft.blocks = movedBlocks.map((block, index) => ({
          ...block,
          local_index: index,
        }));
      });
    }
    case "editor/field/focus": {
      const { field_id } = <FocusFieldAction>action;
      return produce(state, (draft) => {
        draft.focus_field_id = field_id;
      });
    }
    case "editor/field/edit": {
      // TODO: I'm not being triggred inspect me.
      const { field_id, open, refresh } = <OpenEditFieldAction>action;
      return produce(state, (draft) => {
        draft.is_field_edit_panel_open = open ?? true;
        draft.focus_field_id = field_id;
        if (refresh) {
          draft.field_edit_panel_refresh_key =
            (draft.field_edit_panel_refresh_key ?? 0) + 1;
        }
      });
    }
    case "editor/field/save": {
      const { field_id, data } = <SaveFieldAction>action;
      return produce(state, (draft) => {
        const field = draft.fields.find((f) => f.id === field_id);
        if (field) {
          field.id = field_id;
          field.name = data.name;
          field.label = data.label;
          field.placeholder = data.placeholder;
          field.help_text = data.help_text;
          field.type = data.type;
          field.required = data.required;
          // TODO: support options
          // field.options = data.options;
          field.pattern = data.pattern;
        } else {
          // create new field
          draft.fields.push({
            ...data,
          });
        }
        //
      });
    }
    case "editor/responses/pagination/rows": {
      const { max } = <ResponseFeedRowsAction>action;
      return produce(state, (draft) => {
        draft.responses_pagination_rows = max;
      });
    }
    case "editor/response/feed": {
      const { data } = <FeedResponseAction>action;
      return produce(state, (draft) => {
        // Initialize draft.responses if it's not already an array
        if (!Array.isArray(draft.responses)) {
          draft.responses = [];
        }

        // Map of ids to responses for the existing responses
        const existingResponsesById = draft.responses.reduce(
          (acc, response) => {
            acc[response.id] = response;
            return acc;
          },
          {}
        );

        data.forEach((newResponse) => {
          if (existingResponsesById.hasOwnProperty(newResponse.id)) {
            // Update existing response
            Object.assign(existingResponsesById[newResponse.id], newResponse);
          } else {
            // Add new response if id does not exist
            draft.responses!.push(newResponse);
          }
        });
      });
    }
    default:
      return state;
  }
}
