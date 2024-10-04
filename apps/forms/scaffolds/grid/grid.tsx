"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import RDG, {
  Column,
  CopyEvent,
  RenderCellProps,
  RenderEditCellProps,
  RenderHeaderCellProps,
} from "react-data-grid";
import {
  PlusIcon,
  CalendarIcon,
  Link2Icon,
  AvatarIcon,
  ArrowRightIcon,
  PlayIcon,
} from "@radix-ui/react-icons";
import { FormInputType } from "@/types";
import {
  CellRoot,
  ColumnHeaderCell,
  RichTextEditCell,
  FileEditCell,
  JsonPopupEditorCell,
  FileLoadingCell,
  FileRefsStateRenderer,
} from "./cells";
import { useEditorState } from "../editor";
import type {
  CellIdentifier,
  DataGridCellFileRefsResolver,
  DataGridCellSelectionCursor,
  DataGridFileRef,
  DGColumn,
  GFResponseFieldData,
  DGResponseRow,
  DGSystemColumn,
  DGSystemColumnKey,
} from "./types";
import {
  SelectColumn,
  CreateNewAttributeColumn,
  CreateNewAttributeProvider,
} from "./columns";
import { unwrapFeildValue } from "@/lib/forms/unwrap";
import { Button } from "@/components/ui/button";
import { FileTypeIcon } from "@/components/form-field-type-icon";
import { toZonedTime } from "date-fns-tz";
import { tztostr } from "../editor/symbols";
import toast from "react-hot-toast";
import { FormValue } from "@/services/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Highlight from "@/components/highlight";
import { FieldSupports } from "@/k/supported_field_types";
import { format } from "date-fns";
import { EmptyRowsRenderer } from "./grid-empty-state";

import { cn } from "@/utils";
import "./grid.css";
import {
  DataGridStateProvider,
  useCellRootProps,
  useDataGridState,
  useFileRefs,
  useMasking,
} from "./providers";
import { useMediaViewer } from "@/components/mediaviewer";

function rowKeyGetter(row: DGResponseRow) {
  return row.__gf_id;
}

type RenderingRow = DGResponseRow;

export function DataGrid({
  local_cursor_id,
  systemcolumns: _systemcolumns,
  columns,
  rows: rows,
  selectionDisabled,
  readonly,
  loading,
  hasPredicates,
  onAddNewFieldClick,
  onEditFieldClick,
  onDeleteFieldClick,
  onCellChange,
  onSelectedCellChange,
  highlightTokens,
  selectedCells,
  className,
}: {
  local_cursor_id: string;
  systemcolumns: DGSystemColumn[];
  columns: DGColumn[];
  rows: DGResponseRow[];
  selectionDisabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  hasPredicates?: boolean;
  onAddNewFieldClick?: () => void;
  onEditFieldClick?: (id: string) => void;
  onDeleteFieldClick?: (id: string) => void;
  onCellChange?: (
    row: DGResponseRow,
    column: string,
    data: GFResponseFieldData
  ) => void;
  onSelectedCellChange?: (cell: { pk: string | -1; column: string }) => void;
  highlightTokens?: string[];
  selectedCells?: Array<DataGridCellSelectionCursor>;
  className?: string;
}) {
  const [state, dispatch] = useEditorState();
  const { datagrid_selected_rows: selected_responses } = state;

  const onSelectedRowsChange = (selectedRows: ReadonlySet<string>) => {
    dispatch({
      type: "editor/table/space/rows/select",
      selection: selectedRows,
    });
  };

  const onColumnsReorder = (sourceKey: string, targetKey: string) => {
    console.log("reorder", sourceKey, targetKey);
    // FIXME: the reorder won't work. we are using custom header cell, which needs a custom dnd handling.
    dispatch({
      type: "editor/data-grid/column/reorder",
      a: sourceKey,
      b: targetKey,
    });
  };

  const sys_col_props = {
    frozen: true,
    resizable: true,
    draggable: false,
    sortable: false,
    width: 100,
  };
  const __id_column: Column<RenderingRow> = {
    ...sys_col_props,
    key: "__gf_display_id",
    name: "id",
    renderHeaderCell: GFSystemPropertyHeaderCell,
    renderCell: DefaultPropertyIdentifierCell,
  };

  const __created_at_column: Column<RenderingRow> = {
    ...sys_col_props,
    key: "__gf_created_at",
    name: "time",
    renderHeaderCell: GFSystemPropertyHeaderCell,
    renderCell: DefaultPropertyDateCell,
  };

  const __customer_uuid_column: Column<RenderingRow> = {
    ...sys_col_props,
    key: "__gf_customer_id",
    name: "customer",
    renderHeaderCell: GFSystemPropertyHeaderCell,
    renderCell: DefaultPropertyCustomerCell,
  };

  const systemcolumns = _systemcolumns.map((c) => {
    switch (c.key) {
      case "__gf_display_id":
        return {
          ...__id_column,
          // name for display id can be customized
          name: c.name || __id_column.name,
        };
      case "__gf_created_at":
        return __created_at_column;
      case "__gf_customer_id":
        return __customer_uuid_column;
    }
  });

  const allcolumns = systemcolumns
    .concat(
      columns.map(
        (col) =>
          ({
            key: col.key,
            name: col.name,
            resizable: true,
            editable: true,
            sortable: true,
            draggable: false,
            minWidth: 160,
            maxWidth: columns.length <= 1 ? undefined : 640,
            width: undefined,
            renderHeaderCell: (props) => (
              <ColumnHeaderCell
                {...props}
                type={col.type as FormInputType}
                onEditClick={() => {
                  onEditFieldClick?.(col.key);
                }}
                onDeleteClick={() => {
                  onDeleteFieldClick?.(col.key);
                }}
              />
            ),
            renderCell: FieldCell,
            renderEditCell:
              !readonly && !col.readonly ? FieldEditCell : undefined,
          }) as Column<any>
      )
    )
    .concat(CreateNewAttributeColumn);

  if (!selectionDisabled) {
    allcolumns.unshift(SelectColumn);
  }

  const onCopy = (e: CopyEvent<RenderingRow>) => {
    console.log(e);
    let val: string | undefined;
    if (e.sourceColumnKey.startsWith("__gf_")) {
      // copy value as is
      val = (e.sourceRow as any)[e.sourceColumnKey];
    } else {
      // copy value from fields
      const field = e.sourceRow.fields[e.sourceColumnKey];
      const value = field.value;
      val = unwrapFeildValue(value, field.type as FormInputType)?.toString();
    }

    if (val) {
      // copy to clipboard
      const cp = navigator.clipboard.writeText(val);
      toast.promise(cp, {
        loading: "Copying to clipboard...",
        success: "Copied to clipboard",
        error: "Failed to copy to clipboard",
      });
    }
  };

  return (
    <DataGridStateProvider
      local_cursor_id={local_cursor_id}
      selections={selectedCells ?? []}
      highlightTokens={highlightTokens}
    >
      <CreateNewAttributeProvider onAddNewFieldClick={onAddNewFieldClick}>
        <RDG
          className={cn(
            "flex-grow select-none text-xs text-foreground/80",
            className
          )}
          rowKeyGetter={rowKeyGetter}
          columns={allcolumns}
          rows={rows}
          rowHeight={32}
          headerRowHeight={36}
          onCellDoubleClick={() => {
            if (readonly) {
              toast("This table is readonly", { icon: "🔒" });
            }
          }}
          onColumnsReorder={onColumnsReorder}
          selectedRows={selectionDisabled ? undefined : selected_responses}
          onCopy={onCopy}
          onSelectedCellChange={(cell) => {
            if (cell.rowIdx === -1) {
              const column = cell.column.key;
              onSelectedCellChange?.({
                pk: -1,
                column,
              });
            } else {
              const pk = cell.row.__gf_id;
              const column = cell.column.key;
              onSelectedCellChange?.({
                pk,
                column,
              });
            }
          }}
          onRowsChange={(rows, data) => {
            const key = data.column.key;
            const indexes = data.indexes;

            for (const i of indexes) {
              const row = rows[i];
              const field = row.fields[key];

              onCellChange?.(row, key, field);
            }
          }}
          onSelectedRowsChange={
            selectionDisabled ? undefined : onSelectedRowsChange
          }
          renderers={{
            noRowsFallback: (
              <EmptyRowsRenderer
                loading={loading}
                hasPredicates={hasPredicates}
              />
            ),
          }}
        />
      </CreateNewAttributeProvider>
    </DataGridStateProvider>
  );
}

function GFSystemPropertyHeaderCell({ column }: RenderHeaderCellProps<any>) {
  const { name, key } = column;

  const rootprops = useCellRootProps(-1, key);

  return (
    <CellRoot {...rootprops} className="flex items-center gap-2 border-t-0">
      <DefaultPropertyIcon __key={key as DGSystemColumnKey} />
      <span className="font-normal">{name}</span>
    </CellRoot>
  );
}

function DefaultPropertyIcon({ __key: key }: { __key: DGSystemColumnKey }) {
  switch (key) {
    case "__gf_display_id":
      return <Link2Icon className="min-w-4" />;
    case "__gf_created_at":
      return <CalendarIcon className="min-w-4" />;
    case "__gf_customer_id":
      return <AvatarIcon className="min-w-4" />;
  }
}

function DefaultPropertyIdentifierCell({
  column,
  row,
}: RenderCellProps<RenderingRow>) {
  const identifier = row.__gf_display_id;

  const rootprops = useCellRootProps(row.__gf_id, column.key);

  return <CellRoot {...rootprops}>{identifier}</CellRoot>;
}

function DefaultPropertyDateCell({
  column,
  row,
}: RenderCellProps<RenderingRow>) {
  const [state] = useEditorState();

  const date = row.__gf_created_at;

  const { dateformat, datetz } = state;

  const rootprops = useCellRootProps(row.__gf_id, column.key);

  if (!date) {
    return <></>;
  }

  return (
    <CellRoot {...rootprops}>
      {fmtdate(date, dateformat, tztostr(datetz))}
    </CellRoot>
  );
}

function fmtdatetimelocal(date: Date | string) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function fmtdate(
  date: Date | string,
  format: "date" | "time" | "datetime",
  tz?: string
) {
  if (typeof date === "string") {
    date = new Date(date);
  }

  if (tz) {
    date = toZonedTime(date, tz);
  }

  switch (format) {
    case "date":
      return date.toLocaleDateString();
    case "time":
      return date.toLocaleTimeString();
    case "datetime":
      return date.toLocaleString();
  }
}

function DefaultPropertyCustomerCell({
  column,
  row,
}: RenderCellProps<RenderingRow>) {
  const [state, dispatch] = useEditorState();

  const data = row.__gf_customer_id;

  const rootprops = useCellRootProps(row.__gf_id, column.key);

  if (!data) {
    return <></>;
  }

  return (
    <CellRoot
      {...rootprops}
      className="w-full flex justify-between items-center"
    >
      <span className="font-mono text-ellipsis flex-1 overflow-hidden">
        {data}
      </span>
      <FKButton
        onClick={() => {
          dispatch({
            type: "editor/panels/customer-details",
            open: true,
            customer_id: data,
          });
        }}
      />
    </CellRoot>
  );
}

function FKButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="p-1 w-5 h-5"
      onClick={onClick}
    >
      <ArrowRightIcon className="w-3 h-3" />
    </Button>
  );
}

function FieldCell({ column, row }: RenderCellProps<RenderingRow>) {
  const [state] = useEditorState();

  const { datagrid_local_filter: datagrid_filter } = state;

  const data = row.fields[column.key];

  const rootprops = useCellRootProps(row.__gf_id, column.key);

  const masker = useMasking();

  const { highlightTokens } = useDataGridState();

  const identifier: CellIdentifier = {
    attribute: column.key,
    key: row.__gf_id,
  };

  if (!data) {
    return <CellRoot {...rootprops}></CellRoot>;
  }

  const { type, value, options, multiple, files } = data;

  // FIXME: we need to use other parser for db-oriented data.
  // at the moment, we are using type check on value to use the value as is or not.
  const parsed =
    typeof value === "object"
      ? value
      : FormValue.parse(value, {
          type,
          enums: options
            ? Object.keys(options).map((key) => ({
                id: key,
                value: options[key].value,
              }))
            : [],
          multiple: multiple,
        }).value;

  const unwrapped = unwrapFeildValue(parsed, type as FormInputType);

  if (
    !FieldSupports.file_alias(type) &&
    (unwrapped === null || unwrapped === "" || unwrapped === undefined)
  ) {
    return (
      <CellRoot {...rootprops} className="text-muted-foreground/50">
        <Empty value={unwrapped} />
      </CellRoot>
    );
  }

  switch (type as FormInputType) {
    case "switch":
    case "checkbox": {
      return (
        <CellRoot {...rootprops}>
          <input type="checkbox" checked={unwrapped as boolean} disabled />
        </CellRoot>
      );
    }
    case "color": {
      return (
        <CellRoot
          {...rootprops}
          className="w-full h-full p-2 flex gap-2 items-center"
        >
          <div
            className="aspect-square min-w-4 rounded bg-neutral-500 border border-ring"
            style={{ backgroundColor: unwrapped as string }}
          />
          <span>
            <Highlight
              text={unwrapped?.toString()}
              tokens={highlightTokens}
              className="bg-foreground text-background"
            />
          </span>
        </CellRoot>
      );
    }
    case "image": {
      return (
        <CellRoot {...rootprops} className="w-full h-full flex gap-2">
          <ImageCellContent
            identifier={identifier}
            rowdata={row.raw}
            resolver={files}
          />
        </CellRoot>
      );
    }
    case "video":
    case "audio": {
      return (
        <CellRoot {...rootprops} className="w-full h-full flex gap-2">
          <MediaCellContent
            identifier={identifier}
            rowdata={row.raw}
            resolver={files}
            type={type as "audio" | "video"}
          />
        </CellRoot>
      );
    }
    case "file": {
      return (
        <CellRoot {...rootprops} className="w-full h-full flex gap-2">
          <FileCellContent
            identifier={identifier}
            rowdata={row.raw}
            resolver={files}
            type={type as "file" | "audio" | "video"}
          />
        </CellRoot>
      );
    }

    case "richtext": {
      if (unwrapped === null || unwrapped === "" || unwrapped === undefined) {
        return (
          <CellRoot {...rootprops} className="text-muted-foreground/50">
            <Empty value={unwrapped} />
          </CellRoot>
        );
      }

      return (
        <CellRoot {...rootprops}>
          <FileTypeIcon
            type="richtext"
            className="inline w-4 h-4 align-middle me-2"
          />{" "}
          DOCUMENT
        </CellRoot>
      );
    }
    case "datetime-local": {
      return (
        <CellRoot {...rootprops}>
          {fmtdate(unwrapped as string, "datetime", tztostr(state.datetz))}
        </CellRoot>
      );
    }
    case "json": {
      return (
        <CellRoot {...rootprops}>
          <code>{masker(JSON.stringify(unwrapped))}</code>
        </CellRoot>
      );
    }
    default:
      const display = masker(unwrapped?.toString() ?? "");
      return (
        <CellRoot {...rootprops}>
          <Highlight
            text={display}
            tokens={highlightTokens}
            className="bg-foreground text-background"
          />
        </CellRoot>
      );
  }
}

function MediaCellContent({
  identifier,
  rowdata,
  type,
  resolver,
}: {
  identifier: CellIdentifier;
  rowdata: Record<string, any> | null;
  resolver?: DataGridCellFileRefsResolver;
  type: "audio" | "video";
}) {
  const refs = useFileRefs(identifier, rowdata, resolver);
  const { openInPictureInPicture } = useMediaViewer();

  return (
    <>
      <FileRefsStateRenderer
        refs={refs}
        renderers={{
          loading: <FileLoadingCell />,
          error: "ERR",
          files: (f, i) => {
            return (
              <span key={i} className="group">
                <div className="relative inline-flex w-5 h-5 me-1 align-middle">
                  <div className="visible group-hover:invisible">
                    <FileTypeIcon type={type} className="w-4 h-4" />
                  </div>
                  <div className="absolute inset-0 rounded hidden group-hover:flex items-center">
                    <Button
                      variant="default"
                      size="icon"
                      className="w-5 h-5 p-0.5 rounded-sm"
                      onClick={() => {
                        openInPictureInPicture(
                          {
                            title: f.name,
                            src: f.srcset.original,
                          },
                          {
                            contentType: `${type}/*`,
                          }
                        );
                      }}
                    >
                      <PlayIcon />
                    </Button>
                  </div>
                </div>
                <span>{f.name}</span>
              </span>
            );
          },
        }}
      />
    </>
  );
}

function FileCellContent({
  identifier,
  rowdata,
  type,
  resolver,
}: {
  identifier: CellIdentifier;
  rowdata: Record<string, any> | null;
  resolver?: DataGridCellFileRefsResolver;
  type: "file" | "audio" | "video";
}) {
  const refs = useFileRefs(identifier, rowdata, resolver);
  return (
    <>
      <FileRefsStateRenderer
        refs={refs}
        renderers={{
          loading: <FileLoadingCell />,
          error: "ERR",
          files: (f, i) => {
            return (
              <span key={i}>
                <FileTypeIcon
                  type={type}
                  className="inline w-4 h-4 align-middle me-2"
                />
                <span>{f.name}</span>
              </span>
            );
          },
        }}
      />
    </>
  );
}

function ImageCellContent({
  identifier,
  rowdata,
  resolver,
}: {
  identifier: CellIdentifier;
  rowdata: Record<string, any> | null;
  resolver?: DataGridCellFileRefsResolver;
}) {
  const refs = useFileRefs(identifier, rowdata, resolver);

  return (
    <>
      <FileRefsStateRenderer
        refs={refs}
        renderers={{
          loading: <FileLoadingCell />,
          error: "ERR",
          files: (f, i) => {
            return (
              <figure key={i} className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.srcset.thumbnail}
                  alt={f.name}
                  className="h-full min-w-8 aspect-square rounded overflow-hidden object-cover bg-neutral-500"
                  loading="lazy"
                />
              </figure>
            );
          },
        }}
      />
    </>
  );
}

function FieldEditCell(props: RenderEditCellProps<RenderingRow>) {
  const { column, row } = props;
  const data = row.fields[column.key];
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const wasEscPressed = useRef(false);

  const rootprops = useCellRootProps(row.__gf_id, column.key);

  useEffect(() => {
    if (ref.current) {
      // focus & select all
      ref.current.focus();
      ref.current.select();
    }
  }, [ref]);

  const { type, value, option_id, multiple, options, files } = data ?? {};

  const identifier: CellIdentifier = {
    attribute: column.key,
    key: row.__gf_id,
  };

  const onKeydown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      const val = ref.current?.value;
      onCommit(e);
    }
    if (e.key === "Escape") {
      wasEscPressed.current = true;
    }
  };

  const onBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!wasEscPressed.current) {
      onCommit(e);
    } else {
      wasEscPressed.current = false;
    }
  };

  const commit = (change: { value: any; option_id?: string }) => {
    props.onRowChange(
      {
        ...row,
        fields: {
          ...row.fields,
          [column.key]: {
            ...data,
            value: change.value,
            option_id: change.option_id,
          },
        },
      },
      true
    );
  };

  const onCommit = (
    e:
      | React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
      | React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let val: any = ref.current?.value;
    switch (e.currentTarget.type) {
      case "checkbox": {
        val = (e.currentTarget as HTMLInputElement).checked;
        break;
      }
      case "number":
        if (!val) val = null;
        else val = parseFloat(val);
        break;
      case "datetime-local": {
        try {
          const date = new Date(val);
          val = date.toISOString();
        } catch (e) {
          // when user leaves the field empty
          return;
        }
      }
    }

    commit({ value: val });
  };

  try {
    const unwrapped = unwrapFeildValue(value, type);

    if (!FieldSupports.file_alias(type) && unwrapped === undefined) {
      return (
        <CellRoot {...rootprops}>
          <NotSupportedEditCell />
        </CellRoot>
      );
    }

    switch (type as FormInputType) {
      case "email":
      case "password":
      case "tel":
      case "url":
      case "text":
      case "hidden": {
        return (
          <CellRoot {...rootprops}>
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type={type === "hidden" ? "text" : type}
              className="w-full appearance-none outline-none border-none bg-transparent"
              defaultValue={unwrapped as string}
              onKeyDown={onKeydown}
              onBlur={onBlur}
            />
          </CellRoot>
        );
      }
      case "textarea": {
        return (
          <CellRoot {...rootprops}>
            <textarea
              ref={ref as React.RefObject<HTMLTextAreaElement>}
              className="w-full appearance-none outline-none border-none bg-transparent"
              defaultValue={unwrapped as string}
              onKeyDown={onKeydown}
              onBlur={onBlur}
            />
          </CellRoot>
        );
      }
      case "range":
      case "number": {
        return (
          <CellRoot {...rootprops}>
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              className="w-full appearance-none outline-none border-none bg-transparent"
              type="number"
              defaultValue={unwrapped as string | number}
              onKeyDown={onKeydown}
              onBlur={onBlur}
            />
          </CellRoot>
        );
      }
      case "datetime-local": {
        return (
          <CellRoot {...rootprops}>
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type={type}
              className="w-full appearance-none outline-none border-none bg-transparent"
              defaultValue={
                unwrapped ? fmtdatetimelocal(unwrapped as string) : undefined
              }
              onKeyDown={onKeydown}
              onBlur={onBlur}
            />
          </CellRoot>
        );
      }
      case "date":
      case "time":
      case "month":
      case "week": {
        return (
          <CellRoot {...rootprops}>
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type={type}
              className="w-full appearance-none outline-none border-none bg-transparent"
              defaultValue={unwrapped as string}
              onKeyDown={onKeydown}
              onBlur={onBlur}
            />
          </CellRoot>
        );
      }
      case "color":
        return (
          <CellRoot {...rootprops}>
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="color"
              className="w-full appearance-none outline-none border-none bg-transparent"
              defaultValue={unwrapped as string}
              onKeyDown={onKeydown}
              onBlur={onBlur}
            />
          </CellRoot>
        );
      case "file":
      case "audio":
      case "video":
      case "image": {
        return (
          <CellRoot {...rootprops}>
            <FileEditCell
              identifier={identifier}
              rowdata={row.raw}
              type={type as "file" | "image" | "audio" | "video"}
              multiple={multiple}
              resolver={files}
            />
          </CellRoot>
        );
      }
      case "richtext": {
        return (
          <CellRoot {...rootprops}>
            <RichTextEditCell
              row_id={row.__gf_id}
              field_id={column.key}
              defaultValue={unwrapped}
              onValueCommit={(v) => {
                commit({ value: v });
              }}
            />
          </CellRoot>
        );
      }
      case "switch":
      case "checkbox": {
        return (
          <CellRoot
            {...rootprops}
            className="px-2 w-full h-full flex justify-between items-center"
          >
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="checkbox"
              defaultChecked={unwrapped === true}
              onKeyDown={onKeydown}
              onBlur={onBlur}
            />
          </CellRoot>
        );
      }
      case "radio":
      case "select":
        return (
          <CellRoot {...rootprops}>
            <Select
              defaultValue={option_id ?? undefined}
              onValueChange={(v) => {
                commit({ value: options?.[v]?.value, option_id: v });
              }}
            >
              <SelectTrigger>
                <SelectValue
                  className="w-full h-full m-0"
                  placeholder="Select"
                />
              </SelectTrigger>
              <SelectContent>
                {options &&
                  Object.keys(options)?.map((key, i) => {
                    const opt = options[key];
                    return (
                      <SelectItem key={key} value={key}>
                        {opt.value}{" "}
                        <small className="text-muted-foreground">
                          {opt.label || opt.value}
                        </small>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </CellRoot>
        );
      case "json":
        return (
          <CellRoot {...rootprops}>
            <JsonPopupEditorCell
              value={unwrapped ?? null}
              onCommitValue={(v) => {
                commit({ value: v });
              }}
            />
          </CellRoot>
        );
      // not supported
      case "checkboxes":
      case "signature":
      case "payment":
      default:
        return (
          <CellRoot {...rootprops}>
            <NotSupportedEditCell />
          </CellRoot>
        );
    }
  } catch (e) {
    console.error(e);
    return (
      <CellRoot {...rootprops}>
        <JsonPopupEditorCell
          value={value}
          onCommitValue={(v) => {
            commit({ value: v });
          }}
        />
      </CellRoot>
    );
  }
}

function NotSupportedEditCell() {
  return (
    <div className="px-2 w-full text-muted-foreground">
      This field can&apos;t be edited
    </div>
  );
}

function Empty({ value }: { value?: null | undefined | "" }) {
  if (value === null) {
    return <>NULL</>;
  }
  if (value === "") {
    return <>EMPTY</>;
  }
  if (value === undefined) {
    return <>UNDEFINED</>;
  }
  return <></>;
}
