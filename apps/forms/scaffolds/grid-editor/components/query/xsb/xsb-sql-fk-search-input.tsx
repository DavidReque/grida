import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PrivateEditorApi } from "@/lib/private";
import { XSBReferenceTableGrid } from "@/scaffolds/grid/xsb-reference-grid";
import { GridaXSupabase } from "@/types";
import { Link2Icon, PlusIcon } from "@radix-ui/react-icons";
import React, { useEffect, useMemo, useState } from "react";
import useSWR, { BareFetcher } from "swr";
import { GridDataXSBUnknown } from "@/scaffolds/grid-editor/grid-data-xsb-unknow";
import * as GridLayout from "@/scaffolds/grid-editor/components/layout";
import {
  GridQueryCount,
  GridQueryLimitSelect,
  GridRefreshButton,
  GridQueryPaginationControl,
  DataQueryOrderByMenu,
  DataQueryOrderbyMenuTriggerButton,
  DataQueryPredicatesMenu,
  DataQueryPredicatesMenuTriggerButton,
  DataQueryOrderbyChip,
  DataQueryPredicateChip,
  DataQueryPrediateAddMenu,
  GridLocalSearch,
} from "@/scaffolds/grid-editor/components";
import {
  SchemaNameProvider,
  StandaloneDataQueryProvider,
  useStandaloneSchemaDataQuery,
} from "@/scaffolds/data-query";
import { Data } from "@/lib/data";
import toast from "react-hot-toast";
import { XPostgrestQuery } from "@/lib/supabase-postgrest/builder";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLocalFuzzySearch } from "@/hooks/use-fuzzy-search";
import { cn } from "@/utils";

interface ISQLForeignKeyRelation {
  referenced_column: string;
  referenced_table: string;
}

type SQLForeignKeyValue = string | number | undefined;

export function XSBSQLForeignKeySearchInput({
  value,
  onValueChange,
  relation,
  supabase_project_id,
  supabase_schema_name,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "onChange"> & {
  relation: ISQLForeignKeyRelation;
  supabase_project_id: number;
  supabase_schema_name: string;
  value: SQLForeignKeyValue;
  onValueChange?: (value: SQLForeignKeyValue) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <XSBSearchTableSheet
        value={value}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={setOpen}
        relation={relation}
        supabase_project_id={supabase_project_id}
        supabase_schema_name={supabase_schema_name}
      />
      <div className="relative group">
        <Input
          type="search"
          placeholder="Search for reference..."
          {...props}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={cn("group-hover:pr-8", className)}
        />
        <div className="absolute hidden group-hover:flex items-center justify-end right-2 top-2 bottom-2">
          <Button
            variant="outline"
            size="icon"
            className="w-6 h-6"
            onClick={() => setOpen(true)}
          >
            <Link2Icon />
          </Button>
        </div>
      </div>
    </>
  );
}

function XSBSearchTableSheet({
  value,
  onValueChange,
  relation,
  supabase_project_id,
  supabase_schema_name,
  children,
  ...props
}: React.ComponentProps<typeof Sheet> & {
  value?: SQLForeignKeyValue;
  onValueChange?: (value: SQLForeignKeyValue) => void;
  relation: ISQLForeignKeyRelation;
  supabase_project_id: number;
  supabase_schema_name: string;
}) {
  return (
    <Sheet {...props}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col p-0 py-6 xl:w-[800px] xl:max-w-none sm:w-[500px] sm:max-w-none w-screen max-w-none">
        <SheetHeader className="px-6">
          <SheetTitle>Search Reference</SheetTitle>
          <SheetDescription>
            Select a record to reference from{" "}
            <code>
              {supabase_schema_name}.{relation.referenced_table}
            </code>
          </SheetDescription>
        </SheetHeader>
        <hr />
        <SchemaNameProvider schema={supabase_schema_name}>
          <StandaloneDataQueryProvider
            initial={Data.Relation.INITIAL_QUERY_STATE}
          >
            <XSBSearchTableDataGrid
              supabase_project_id={supabase_project_id}
              supabase_schema_name={supabase_schema_name}
              supabase_table_name={relation.referenced_table}
              onRowDoubleClick={(row) => {
                onValueChange?.(row[relation.referenced_column]);
                props.onOpenChange?.(false);
              }}
            />
          </StandaloneDataQueryProvider>
        </SchemaNameProvider>
      </SheetContent>
    </Sheet>
  );
}

/**
 * swr fetcher for x-sb search integration, which passes schema name to Accept-Profile header
 * @returns
 */
const x_table_search_swr_fetcher = async (
  arg: [string, string]
): Promise<GridaXSupabase.XSBSearchResult> => {
  const [url, schema_name] = arg;
  const res = await fetch(url, {
    headers: {
      "Accept-Profile": schema_name,
    },
  });
  return res.json();
};

function useXSupabaseTableSearch({
  supabase_project_id,
  supabase_schema_name,
  supabase_table_name,
  search,
}: {
  supabase_project_id: number;
  supabase_table_name: string;
  supabase_schema_name: string;
  search?: URLSearchParams | string;
}) {
  return useSWR<GridaXSupabase.XSBSearchResult>(
    [
      PrivateEditorApi.XSupabase.url_x_table_search(
        supabase_project_id,
        supabase_table_name,
        {
          serachParams: search,
        }
      ),
      supabase_schema_name,
    ],
    // @see https://github.com/vercel/swr/discussions/545#discussioncomment-10740463
    x_table_search_swr_fetcher as BareFetcher<any>
  );
}

function XSBSearchTableDataGrid({
  supabase_project_id,
  supabase_table_name,
  supabase_schema_name,
  onRowDoubleClick,
}: {
  supabase_project_id: number;
  supabase_table_name: string;
  supabase_schema_name: string;
  onRowDoubleClick?: (value: GridaXSupabase.XDataRow) => void;
}) {
  const [localSearch, setLocalSearch] = useState<string>("");
  const [schema, setSchema] = useState<GridaXSupabase.JSONSChema | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const query = useStandaloneSchemaDataQuery({
    schema,
    estimated_count: count,
  });

  const { predicates, isPredicatesSet, isOrderbySet } = query;
  const is_query_orderby_or_predicates_set = isPredicatesSet || isOrderbySet;

  const searchParams = useMemo(
    () => XPostgrestQuery.QS.fromQueryState(query),
    [query]
  );

  const { data, error } = useXSupabaseTableSearch({
    supabase_project_id,
    supabase_table_name,
    supabase_schema_name,
    search: searchParams,
  });

  useEffect(() => {
    if (data?.meta?.table_schema) setSchema(data?.meta?.table_schema);
  }, [data?.meta?.table_schema]);

  useEffect(() => {
    if (data?.count) setCount(data.count);
  }, [data?.count]);

  useEffect(() => {
    if (data?.error) {
      console.error(data.error.message);
      toast.error(data.error.message);
    }
  }, [data?.error]);

  const result = useLocalFuzzySearch(localSearch, {
    data: data?.data ?? [],
    keys: Object.keys(schema?.properties ?? {}),
  });

  const rows = result.map((r) => r.item);

  return (
    <GridLayout.Root>
      <GridLayout.Header>
        <GridLayout.HeaderLine>
          <GridLayout.HeaderMenus>
            <GridLayout.HeaderMenuItems>
              <DataQueryPredicatesMenu {...query}>
                <DataQueryPredicatesMenuTriggerButton
                  active={query.isPredicatesSet}
                />
              </DataQueryPredicatesMenu>
              <DataQueryOrderByMenu {...query}>
                <DataQueryOrderbyMenuTriggerButton
                  active={query.isOrderbySet}
                />
              </DataQueryOrderByMenu>
              <GridLocalSearch onValueChange={setLocalSearch} />
            </GridLayout.HeaderMenuItems>
          </GridLayout.HeaderMenus>
        </GridLayout.HeaderLine>
        {is_query_orderby_or_predicates_set && (
          <GridLayout.HeaderLine className="border-b-0 px-0">
            <ScrollArea>
              <ScrollBar orientation="horizontal" className="invisible" />
              <div className="px-2">
                <div className="flex gap-2">
                  {isOrderbySet && (
                    <>
                      <DataQueryOrderbyChip {...query} />
                      <GridLayout.HeaderSeparator />
                    </>
                  )}
                  {predicates.map((predicate, i) => (
                    <DataQueryPredicateChip key={i} index={i} {...query} />
                  ))}
                  <DataQueryPrediateAddMenu {...query}>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground"
                    >
                      <PlusIcon className="w-3 h-3 me-2" />
                      Add filter
                    </Button>
                  </DataQueryPrediateAddMenu>
                </div>
              </div>
            </ScrollArea>
          </GridLayout.HeaderLine>
        )}
      </GridLayout.Header>
      <GridLayout.Content>
        <XSBReferenceTableGrid
          loading={!data?.data}
          tokens={localSearch ? [localSearch] : undefined}
          onRowDoubleClick={onRowDoubleClick}
          columns={GridDataXSBUnknown.columns(data?.meta?.table_schema, {
            sort: "unknown_table_column_priorities",
          })}
          rows={rows ?? []}
        />
      </GridLayout.Content>
      <GridLayout.Footer>
        <div className="flex gap-4 items-center">
          <GridQueryPaginationControl {...query} />
          <GridQueryLimitSelect
            value={query.q_page_limit}
            onValueChange={query.onLimit}
          />
        </div>
        <GridLayout.FooterSeparator />
        <GridQueryCount count={count} keyword="record" />
        <GridLayout.FooterSeparator />
        <GridRefreshButton />
      </GridLayout.Footer>
    </GridLayout.Root>
  );
}
