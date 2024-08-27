"use client";

import Invalid from "@/components/invalid";
import {
  useDatagridTable,
  useEditorState,
  useFormFields,
} from "@/scaffolds/editor";
import {
  ResponseFeedProvider,
  ResponseSessionFeedProvider,
  ResponseSyncProvider,
  FormsXSupabaseMainTableFeedProvider,
  FormsXSupabaseMainTableSyncProvider,
} from "@/scaffolds/editor/feed";
import { GDocFormsXSBTable, GDocTableID } from "@/scaffolds/editor/state";
import { EditorSymbols } from "@/scaffolds/editor/symbols";
import { CurrentTable } from "@/scaffolds/editor/utils/switch-table";
import { GridEditor } from "@/scaffolds/grid-editor";
import { GridData } from "@/scaffolds/grid-editor/grid-data";
import { GFResponseRow } from "@/scaffolds/grid/types";
import { useMemo } from "react";

export default function FormResponsesPage() {
  const [state] = useEditorState();
  const { doctype, datagrid_table_id } = state;

  if (doctype !== "v0_form") {
    return <Invalid />;
  }

  return (
    <CurrentTable
      table={EditorSymbols.Table.SYM_GRIDA_FORMS_WHATEVER_MAIN_TABLE_INDICATOR}
    >
      {/* wait until state fully change */}
      {allowedtable(datagrid_table_id) && <SwitchGridEditor />}
    </CurrentTable>
  );
}

function SwitchGridEditor() {
  const [state] = useEditorState();
  const { datagrid_table_id } = state;

  switch (datagrid_table_id) {
    case EditorSymbols.Table.SYM_GRIDA_FORMS_RESPONSE_TABLE_ID:
    case EditorSymbols.Table.SYM_GRIDA_FORMS_SESSION_TABLE_ID:
      return (
        <>
          <ResponseFeedProvider />
          <ResponseSyncProvider />
          <ResponseSessionFeedProvider />
          <FormResponseGridEditor />
        </>
      );
    case EditorSymbols.Table.SYM_GRIDA_FORMS_X_SUPABASE_MAIN_TABLE_ID:
      return (
        <>
          <FormsXSupabaseMainTableFeedProvider />
          <FormsXSupabaseMainTableSyncProvider />
          <ModeXSBMainTable />
        </>
      );
    default:
      return <Invalid />;
  }
}

function FormResponseGridEditor() {
  const [state, dispatch] = useEditorState();
  const { form_id, tablespace, datagrid_filter, datagrid_table_id } = state;

  const fields = useFormFields();

  const sessions_stream =
    tablespace[EditorSymbols.Table.SYM_GRIDA_FORMS_SESSION_TABLE_ID].stream;

  const responses_stream =
    tablespace[EditorSymbols.Table.SYM_GRIDA_FORMS_RESPONSE_TABLE_ID].stream;

  const { systemcolumns, columns } = useMemo(
    () =>
      datagrid_table_id
        ? GridData.columns(datagrid_table_id, fields)
        : { systemcolumns: [], columns: [] },
    [datagrid_table_id, fields]
  );

  // Transforming the responses into the format expected by react-data-grid
  const { filtered, inputlength } = useMemo(() => {
    return GridData.rows({
      form_id: form_id,
      // TODO: types with symbols not working ?
      table: datagrid_table_id as any,
      fields: fields,
      filter: datagrid_filter,
      responses: responses_stream ?? [],
      sessions: sessions_stream ?? [],
    });
  }, [
    form_id,
    datagrid_table_id,
    sessions_stream,
    fields,
    responses_stream,
    datagrid_filter,
  ]);

  return (
    <>
      <GridEditor
        systemcolumns={systemcolumns}
        columns={columns}
        rows={filtered as GFResponseRow[]}
      />
    </>
  );
}

function ModeXSBMainTable() {
  const [state, dispatch] = useEditorState();

  const { form_id, tablespace, datagrid_filter, datagrid_table_id } = state;

  const tb = useDatagridTable<GDocFormsXSBTable>();

  const fields = useFormFields();

  const stream =
    tablespace[EditorSymbols.Table.SYM_GRIDA_FORMS_X_SUPABASE_MAIN_TABLE_ID]
      .stream;

  const { systemcolumns, columns } = useMemo(
    () =>
      datagrid_table_id
        ? GridData.columns(
            EditorSymbols.Table.SYM_GRIDA_FORMS_X_SUPABASE_MAIN_TABLE_ID,
            fields
          )
        : { systemcolumns: [], columns: [] },
    [datagrid_table_id, fields]
  );

  const { filtered } = useMemo(() => {
    return GridData.rows({
      form_id: form_id,
      table: EditorSymbols.Table.SYM_GRIDA_FORMS_X_SUPABASE_MAIN_TABLE_ID,
      fields: fields,
      filter: datagrid_filter,
      data: {
        pks: tb?.x_sb_main_table_connection.pks ?? [],
        rows: stream ?? [],
      },
    });
  }, [form_id, fields, tb, stream, datagrid_filter]);

  if (!tb) {
    return <Invalid />;
  }

  return (
    <>
      <GridEditor
        systemcolumns={systemcolumns}
        columns={columns}
        rows={filtered as GFResponseRow[]}
      />
    </>
  );
}

function allowedtable(table: GDocTableID | null): boolean {
  return (
    table === EditorSymbols.Table.SYM_GRIDA_FORMS_RESPONSE_TABLE_ID ||
    table === EditorSymbols.Table.SYM_GRIDA_FORMS_SESSION_TABLE_ID ||
    table === EditorSymbols.Table.SYM_GRIDA_FORMS_X_SUPABASE_MAIN_TABLE_ID
  );
}
