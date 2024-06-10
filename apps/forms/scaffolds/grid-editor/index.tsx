"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Grid } from "../grid";
import { createClientFormsClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { useEditorState } from "../editor";
import Link from "next/link";
import {
  CommitIcon,
  DownloadIcon,
  PieChartIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { fmt_local_index } from "@/utils/fmt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FormResponseField } from "@/types";

export function GridEditor() {
  const [state, dispatch] = useEditorState();
  const [deleteFieldConfirmOpen, setDeleteFieldConfirmOpen] = useState(false);

  const { form_id, focus_field_id, fields, responses, selected_responses } =
    state;
  const supabase = createClientFormsClient();

  const columns = useMemo(
    () =>
      fields?.map((field) => ({
        key: field.id,
        name: field.name,
        frozen: false,
        type: field.type,
        // You can add more properties here as needed by react-data-grid
      })) ?? [],
    [fields]
  );

  // Transforming the responses into the format expected by react-data-grid
  const rows = useMemo(() => {
    return (
      responses?.map((response, index) => {
        const row: any = {
          __gf_id: response.id,
          __gf_local_index: fmt_local_index(response.local_index),
          __gf_created_at: response.created_at,
          __gf_customer_uuid: response.customer_id,
        }; // react-data-grid expects each row to have a unique 'id' property
        response?.fields?.forEach((field: FormResponseField) => {
          row[field.form_field_id] = {
            type: field.type,
            value: field.value,
            storage_object_paths: field.storage_object_paths,
          };
        });
        return row;
      }) ?? []
    );
    // TODO: need to update dpes with fields
  }, [responses]);

  const openNewFieldPanel = useCallback(() => {
    dispatch({
      type: "editor/field/edit",
      open: true,
      refresh: true,
    });
  }, [dispatch]);

  const openEditFieldPanel = useCallback(
    (field_id?: string) => {
      dispatch({
        type: "editor/field/edit",
        field_id: field_id,
        open: true,
        refresh: true,
      });
    },
    [dispatch]
  );

  const openDeleteFieldConfirm = () => {
    setDeleteFieldConfirmOpen(true);
  };

  const closeDeleteFieldConfirm = () => {
    setDeleteFieldConfirmOpen(false);
  };

  const onDeleteField = useCallback(() => {
    const deleting = supabase
      .from("form_field")
      .delete({
        count: "exact",
      })
      .eq("id", focus_field_id!)
      .then(({ error, count }) => {
        if (!count || error) {
          throw error;
        }
        dispatch({
          type: "editor/field/delete",
          field_id: focus_field_id!,
        });
      });

    toast.promise(deleting as Promise<any>, {
      loading: "Deleting...",
      success: "Field deleted",
      error: "Failed to delete field",
    });
  }, [supabase, focus_field_id, dispatch]);

  const onDeleteResponse = useCallback(() => {
    const deleting = supabase
      .from("response")
      .delete()
      .in("id", Array.from(selected_responses))
      .then(() => {
        dispatch({
          type: "editor/response/delete/selected",
        });
      });

    toast.promise(deleting as Promise<any>, {
      loading: "Deleting response...",
      success: "Response deleted",
      error: "", // this won't be shown (supabase does not return error for delete operation)
    });
  }, [supabase, selected_responses, dispatch]);

  const has_selected_responses = selected_responses.size > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 w-full">
        <div className="flex px-4 py-1 h-full items-center justify-between gap-4">
          <div hidden={!has_selected_responses}>
            <div className="flex gap-2 items-center">
              <span
                className="text-sm font-normal text-neutral-500"
                aria-label="selected responses"
              >
                {txt_n_responses(selected_responses.size)} selected
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1 p-2 rounded-md border text-sm">
                    <TrashIcon />
                    Delete {txt_n_responses(selected_responses.size)}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Delete Response</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deleting this response will remove all data associated with
                    it. Are you sure you want to delete this response?
                  </AlertDialogDescription>
                  <div className="flex justify-end gap-2 p-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteResponse}>
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div />
          <div className="flex gap-2">
            <Link href={`./analytics`}>
              <Badge variant={"outline"} className="cursor-pointer">
                Realtime
                <PieChartIcon className="align-middle ms-2" />
              </Badge>
            </Link>
            <Link href={`./simulator`} target="_blank">
              <Badge variant={"outline"} className="cursor-pointer">
                Simulator
                <CommitIcon className="align-middle ms-2" />
              </Badge>
            </Link>
          </div>
        </div>
      </header>
      <DeleteFieldConfirmDialog
        open={deleteFieldConfirmOpen}
        onOpenChange={setDeleteFieldConfirmOpen}
        onCancel={closeDeleteFieldConfirm}
        onDeleteConfirm={onDeleteField}
      />
      <div className="flex flex-col w-full h-full">
        <Grid
          columns={columns}
          rows={rows}
          onAddNewFieldClick={openNewFieldPanel}
          onEditFieldClick={openEditFieldPanel}
          onDeleteFieldClick={(field_id) => {
            dispatch({
              type: "editor/field/focus",
              field_id,
            });
            openDeleteFieldConfirm();
          }}
        />
      </div>
      <footer className="flex gap-4 min-h-9 overflow-hidden items-center px-2 w-full border-t dark:border-t-neutral-700">
        <MaxRowsSelect />
        <div>{txt_n_responses(state.responses?.length ?? 0)}</div>
        <Link href={`/v1/${form_id}/export/csv`} download target="_blank">
          <button className="flex items-center gap-1 p-2 bg-neutral-100 dark:bg-neutral-900 rounded">
            Export to CSV
            <DownloadIcon />
          </button>
        </Link>
      </footer>
    </div>
  );
}

function txt_n_responses(n: number) {
  return n === 1 ? "1 response" : `${n} responses`;
}

function MaxRowsSelect() {
  const [state, dispatch] = useEditorState();

  return (
    <div>
      <Select
        value={state.responses_pagination_rows + ""}
        onValueChange={(value) => {
          dispatch({
            type: "editor/responses/pagination/rows",
            max: parseInt(value),
          });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="rows" />
        </SelectTrigger>
        <SelectContent>
          <></>
          <SelectItem value={10 + ""}>10 rows</SelectItem>
          <SelectItem value={100 + ""}>100 rows</SelectItem>
          <SelectItem value={500 + ""}>500 rows</SelectItem>
          <SelectItem value={1000 + ""}>1000 rows</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function DeleteFieldConfirmDialog({
  onCancel,
  onDeleteConfirm,
  ...props
}: React.ComponentProps<typeof AlertDialog> & {
  onCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete Field</AlertDialogTitle>
        <AlertDialogDescription>
          Deleting this field will remove all data associated with it. Are you
          sure you want to delete this field?
        </AlertDialogDescription>
        <div className="flex justify-end gap-2 p-2">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDeleteConfirm}>
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
