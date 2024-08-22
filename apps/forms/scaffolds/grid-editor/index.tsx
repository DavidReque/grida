"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ResponseGrid } from "../grid";
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
import { useDatagridTable, useEditorState } from "../editor";
import Link from "next/link";
import { DownloadIcon, PieChartIcon, TrashIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import clsx from "clsx";
import {
  GridLimit,
  GridViewSettings,
  GridRefresh,
  XSupaDataGridSort,
  GridLocalSearch,
  GridCount,
  TableViews,
} from "./components";
import * as GridLayout from "./components/layout";
import { txt_n_plural } from "@/utils/plural";
import { editorlink } from "@/lib/forms/url";
import { useDialogState } from "@/components/hooks/use-dialog-state";
import type { GFColumn, GFResponseRow, GFSystemColumn } from "../grid/types";
import { PrivateEditorApi } from "@/lib/private";
import { EditorSymbols } from "../editor/symbols";

export function GridEditor({
  systemcolumns,
  columns,
  rows,
}: {
  systemcolumns: GFSystemColumn[];
  columns: GFColumn[];
  rows?: GFResponseRow[];
}) {
  const [state, dispatch] = useEditorState();
  const deleteFieldConfirmDialog = useDialogState<{ field_id: string }>();

  const {
    form_id,
    datagrid_table_id,
    datagrid_isloading,
    datagrid_selected_rows,
  } = state;

  const supabase = useMemo(() => createClientFormsClient(), []);

  const tb = useDatagridTable();
  const row_keyword = tb?.row_keyword ?? "row";
  const readonly = tb?.readonly ?? true;

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

  const onDeleteField = useCallback(
    (field_id: string) => {
      const deleting = supabase
        .from("form_field")
        .delete({
          count: "exact",
        })
        .eq("id", field_id)
        .then(({ error, count }) => {
          if (!count || error) {
            throw error;
          }
          dispatch({
            type: "editor/field/delete",
            field_id: field_id,
          });
        });

      toast.promise(deleting as Promise<any>, {
        loading: "Deleting...",
        success: "Field deleted",
        error: "Failed to delete field",
      });
    },
    [supabase, dispatch]
  );

  const has_selected_responses = datagrid_selected_rows.size > 0;
  const selectionDisabled =
    datagrid_table_id === EditorSymbols.Table.SYM_GRIDA_FORMS_SESSION_TABLE_ID;

  return (
    <GridLayout.Root>
      <GridLayout.Header>
        <GridLayout.HeaderMenus>
          {has_selected_responses ? (
            <div
              className={clsx(
                "flex items-center",
                !has_selected_responses || selectionDisabled ? "hidden" : ""
              )}
            >
              <div className="flex gap-2 items-center">
                <span
                  className="text-sm font-normal text-neutral-500"
                  aria-label="selected responses"
                >
                  {txt_n_plural(datagrid_selected_rows.size, row_keyword)}{" "}
                  selected
                </span>
                <DeleteSelectedRowsButton />
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center items-center divide-x *:px-2 first:*:pl-0 last:*:pr-0">
                <TableViews />
                {/* <div className="border-r"/> */}
                <TableTools />
              </div>
            </>
          )}
        </GridLayout.HeaderMenus>
        <GridLayout.HeaderMenus>
          <Link
            href={editorlink("data/analytics", {
              basepath: state.basepath,
              document_id: state.document_id,
            })}
            className="flex"
          >
            <Badge variant={"outline"} className="cursor-pointer">
              <PieChartIcon className="align-middle me-2" />
              Realtime
            </Badge>
          </Link>
          <GridViewSettings />
        </GridLayout.HeaderMenus>
      </GridLayout.Header>
      <DeleteFieldConfirmDialog
        open={deleteFieldConfirmDialog.open}
        onOpenChange={deleteFieldConfirmDialog.onOpenChange}
        onCancel={deleteFieldConfirmDialog.closeDialog}
        field_id={deleteFieldConfirmDialog.data?.field_id}
        onDeleteConfirm={(field_id) => onDeleteField(field_id)}
      />
      <GridLayout.Content>
        <ResponseGrid
          systemcolumns={systemcolumns}
          columns={columns}
          rows={rows ?? []}
          readonly={readonly}
          loading={datagrid_isloading}
          selectionDisabled={selectionDisabled}
          onAddNewFieldClick={openNewFieldPanel}
          onEditFieldClick={openEditFieldPanel}
          onDeleteFieldClick={(field_id) => {
            deleteFieldConfirmDialog.setData({ field_id });
            deleteFieldConfirmDialog.openDialog();
          }}
          onCellChange={(row, column, data) => {
            dispatch({
              type: "editor/data-grid/cell/change",
              row: row.__gf_id,
              column: column,
              data: data,
            });
          }}
        />
      </GridLayout.Content>
      <GridLayout.Footer>
        <div className="flex gap-2 items-center">
          <GridLimit />
          <GridCount count={rows?.length} keyword={row_keyword} />
        </div>
        <Link href={`/v1/${form_id}/export/csv`} download target="_blank">
          <Button variant="ghost">
            Export to CSV
            <DownloadIcon />
          </Button>
        </Link>
        <GridRefresh />
      </GridLayout.Footer>
    </GridLayout.Root>
  );
}

function TableTools() {
  const [state] = useEditorState();
  const { datagrid_table_id } = state;

  return (
    <div className="flex items-center gap-1">
      <GridLocalSearch />
      {datagrid_table_id ===
        EditorSymbols.Table.SYM_GRIDA_FORMS_X_SUPABASE_MAIN_TABLE_ID && (
        <XSupaDataGridSort />
      )}
    </div>
  );
}

function DeleteSelectedRowsButton() {
  const supabase = createClientFormsClient();
  const [state, dispatch] = useEditorState();

  const { datagrid_table_id, datagrid_selected_rows } = state;
  const { row_keyword } = useDatagridTable() || { row_keyword: "row" };

  const delete_selected_responses = useCallback(() => {
    const deleting = supabase
      .from("response")
      .delete()
      .in("id", Array.from(datagrid_selected_rows))
      .then(() => {
        dispatch({
          type: "editor/data-grid/delete/selected",
        });
      });

    toast.promise(deleting as Promise<any>, {
      loading: "Deleting response...",
      success: "Response deleted",
      error: "", // this won't be shown (supabase does not return error for delete operation)
    });
  }, [supabase, datagrid_selected_rows, dispatch]);

  const delete_selected_x_supabase_main_table_rows = useCallback(() => {
    if (!state.x_supabase_main_table?.gfpk) {
      toast.error("Cannot delete rows without a primary key");
      return;
    }

    const res = PrivateEditorApi.SupabaseQuery.qdelete({
      form_id: state.form_id,
      main_table_id: state.connections!.supabase!.main_supabase_table_id!,
      filters: [
        {
          type: "in",
          column: state.x_supabase_main_table.gfpk,
          values: Array.from(datagrid_selected_rows),
        },
      ],
    }).then(({ data: { error, count } }) => {
      if (error || !count) {
        console.error("Failed to delete rows", error);
        throw error;
      }
      dispatch({
        type: "editor/data-grid/delete/selected",
      });
    });

    toast.promise(res, {
      loading: "Deleting...",
      success: "Deleted",
      error: "Failed",
    });
  }, [
    state.form_id,
    state.connections,
    state.x_supabase_main_table?.gfpk,
    datagrid_selected_rows,
    dispatch,
  ]);

  const onDeleteSelection = useCallback(() => {
    switch (datagrid_table_id) {
      case EditorSymbols.Table.SYM_GRIDA_FORMS_RESPONSE_TABLE_ID:
        delete_selected_responses();
        break;
      case EditorSymbols.Table.SYM_GRIDA_FORMS_SESSION_TABLE_ID:
        toast.error("Cannot delete sessions");
        break;
      case EditorSymbols.Table.SYM_GRIDA_FORMS_X_SUPABASE_MAIN_TABLE_ID:
        delete_selected_x_supabase_main_table_rows();
        break;
      default:
        toast.error("Cannot delete rows from this table");
    }
  }, [
    datagrid_table_id,
    delete_selected_responses,
    delete_selected_x_supabase_main_table_rows,
  ]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="flex items-center gap-1 p-2 rounded-md border text-sm">
          <TrashIcon />
          Delete {txt_n_plural(datagrid_selected_rows.size, row_keyword)}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>
          Delete {txt_n_plural(datagrid_selected_rows.size, row_keyword)}
        </AlertDialogTitle>
        <AlertDialogDescription>
          Deleting this record will remove all data associated with it. Are you
          sure you want to delete this record?
        </AlertDialogDescription>
        <div className="flex justify-end gap-2 p-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={onDeleteSelection}
          >
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteFieldConfirmDialog({
  onCancel,
  onDeleteConfirm,
  field_id,
  ...props
}: React.ComponentProps<typeof AlertDialog> & {
  field_id?: string;
  onCancel: () => void;
  onDeleteConfirm: (field_id: string) => void;
}) {
  const [state] = useEditorState();

  const { datagrid_table_id } = state;

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete Field</AlertDialogTitle>
        <AlertDialogDescription>
          {datagrid_table_id ===
          EditorSymbols.Table.SYM_GRIDA_FORMS_X_SUPABASE_MAIN_TABLE_ID ? (
            <>
              Deleting this field will remove all data associated with it
              (within Grida Forms). Are you sure you want to delete this field?
              <br />
              <strong>
                Your supabase column stays untouched. - We do not have
                permission to do that.
              </strong>
            </>
          ) : (
            <>
              Deleting this field will remove all data associated with it. Are
              you sure you want to delete this field?
            </>
          )}
        </AlertDialogDescription>
        <div className="flex justify-end gap-2 p-2">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!field_id}
            onClick={() => onDeleteConfirm(field_id!)}
          >
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
