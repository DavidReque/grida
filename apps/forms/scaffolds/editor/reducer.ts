import { produce } from "immer";
import { FormEditorState } from "./state";
import {
  BlocksEditorAction,
  ChangeBlockFieldAction,
  CreateNewPendingBlockAction,
  DeleteBlockAction,
  DeleteFieldAction,
  DeleteSelectedResponsesAction,
  FeedResponseAction,
  FocusFieldAction,
  OpenEditFieldAction,
  ResolvePendingBlockAction,
  ResponseFeedRowsAction,
  SaveFieldAction,
  SelectResponse,
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

      const new_index = state.blocks.length;

      switch (block) {
        case "field": {
          return produce(state, (draft) => {
            const { available_field_ids } = state;

            // find unused field id (if any)
            const field_id = available_field_ids[0] ?? null;

            draft.blocks.push({
              id: "[draft]" + Math.random().toString(36).substring(7),
              form_field_id: field_id,
              form_id: state.form_id,
              type: block,
              local_index: new_index,
              data: {},
            });

            // remove the field id from available_field_ids
            draft.available_field_ids = available_field_ids.filter(
              (id) => id !== field_id
            );
          });
        }
        case "section": {
          return produce(state, (draft) => {
            draft.blocks.push({
              id: "[draft]" + Math.random().toString(36).substring(7),
              form_id: state.form_id,
              local_index: new_index,
              type: block,
              data: {},
            });
          });
        }
      }
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
        // remove the field id from available_field_ids
        draft.blocks = draft.blocks.filter((block) => block.id !== block_id);

        // find the field_id of the deleted block
        const field_id = state.blocks.find(
          (b) => b.id === block_id
        )?.form_field_id;
        // add the field_id to available_field_ids
        if (field_id) {
          draft.available_field_ids.push(field_id);
        }
      });
    }
    case "blocks/field/change": {
      const { block_id, field_id } = <ChangeBlockFieldAction>action;
      return produce(state, (draft) => {
        const block = draft.blocks.find((b) => b.id === block_id);
        if (block) {
          const previous_field_id = block.form_field_id;
          block.form_field_id = field_id;

          // update the available_field_ids
          draft.available_field_ids = [
            ...draft.available_field_ids.filter((id) => id !== field_id),
            previous_field_id,
          ].filter(Boolean) as string[];
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

          // add the field_id to available_field_ids
          draft.available_field_ids.push(field_id);
        }
        //
      });
    }
    case "editor/field/delete": {
      const { field_id } = <DeleteFieldAction>action;
      return produce(state, (draft) => {
        // remove from fields
        draft.fields = draft.fields.filter((f) => f.id !== field_id);

        // remove from available_field_ids
        draft.available_field_ids = draft.available_field_ids.filter(
          (id) => id !== field_id
        );

        // set empty to referenced blocks
        draft.blocks = draft.blocks.map((block) => {
          if (block.form_field_id === field_id) {
            block.form_field_id = null;
          }
          return block;
        });
      });
    }
    case "editor/response/select": {
      const { selection } = <SelectResponse>action;
      return produce(state, (draft) => {
        draft.selected_responses = new Set(selection);
      });
    }
    case "editor/response/delete/selected": {
      return produce(state, (draft) => {
        const ids = Array.from(state.selected_responses);

        draft.responses = draft.responses?.filter(
          (response) => !ids.includes(response.id)
        );

        // also remove from selected_responses
        const new_selected_responses = new Set(state.selected_responses);
        ids.forEach((id) => {
          new_selected_responses.delete(id);
        });

        draft.selected_responses = new_selected_responses;
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
