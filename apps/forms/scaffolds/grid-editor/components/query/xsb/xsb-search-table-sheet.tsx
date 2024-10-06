"use client";

import { Button } from "@/components/ui/button";
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
import { PlusIcon } from "@radix-ui/react-icons";
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
  DataQueryTextSearch,
} from "@/scaffolds/grid-editor/components";
import {
  SchemaNameProvider,
  StandaloneDataQueryProvider,
  TableDefinitionProvider,
  useStandaloneSchemaDataQuery,
} from "@/scaffolds/data-query";
import { Data } from "@/lib/data";
import toast from "react-hot-toast";
import { XPostgrestQuery } from "@/lib/supabase-postgrest/builder";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLocalFuzzySearch } from "@/hooks/use-fuzzy-search";
import { XSBTextSearchInput } from "./xsb-text-search";
import { SupabasePostgRESTOpenApi } from "@/lib/supabase-postgrest";

type SQLForeignKeyValue = string | number | undefined;

export function XSBSearchTableSheet({
  onValueChange,
  relation,
  supabase_project_id,
  supabase_schema_name,
  children,
  ...props
}: React.ComponentProps<typeof Sheet> & {
  onValueChange?: (value: SQLForeignKeyValue) => void;
  relation: Data.Relation.NonCompositeRelationship;
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
            initial={{
              ...Data.Relation.INITIAL_QUERY_STATE,
              q_text_search: { query: "", column: null, type: "websearch" },
            }}
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
  const [schema, setSchema] = useState<GridaXSupabase.JSONSChema | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const query = useStandaloneSchemaDataQuery({
    estimated_count: count,
  });

  const { predicates, isPredicatesSet, isOrderbySet } = query;
  const is_query_orderby_or_predicates_set = isPredicatesSet || isOrderbySet;

  const searchParams = useMemo(
    () => XPostgrestQuery.QS.fromQueryState(query),
    [query]
  );

  const { data, error, isLoading } = useXSupabaseTableSearch({
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

  const rows = data?.data;

  const def = useMemo(() => {
    if (schema) {
      return SupabasePostgRESTOpenApi.parse_supabase_postgrest_schema_definition(
        schema
      );
    }
  }, [schema]);

  return (
    <TableDefinitionProvider
      definition={def ?? { pks: [], fks: [], properties: {} }}
    >
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
                <XSBTextSearchInput
                  query={query.q_text_search?.query}
                  onQueryChange={query.onTextSearchQuery}
                  column={query.q_text_search?.column}
                  onColumnChange={query.onTextSearchColumn}
                />
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
            tokens={
              query?.q_text_search?.query ? [query?.q_text_search.query] : []
            }
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
          <GridRefreshButton
            onRefreshClick={query.onRefresh}
            refreshing={isLoading}
          />
        </GridLayout.Footer>
      </GridLayout.Root>
    </TableDefinitionProvider>
  );
}
