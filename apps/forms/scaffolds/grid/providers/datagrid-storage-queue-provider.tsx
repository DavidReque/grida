import QueueProvider, { useQueue } from "@/lib/p-queue";
import React, { useEffect, useState } from "react";
import type {
  CellIdentifier,
  DataGridCellFileRefsResolver,
  DataGridFileRef,
  StandaloneFileRefsResolverFn,
} from "../types";
import type { XSupabaseStorageTaskPoolerResult } from "@/services/x-supabase/xsb-storage-pooler";
import { xsb_file_refs_mapper } from "@/scaffolds/grid-editor/grid-data";

const taskid = (identifier: CellIdentifier) =>
  `${identifier.key}/${identifier.attribute}`;

const parsetaskid = (id: string): CellIdentifier => {
  const [key, attribute] = id.split("/");
  return { key, attribute };
};

type FileStorageQueryTask = {
  id: string;
  row: Record<string, any>;
};

type FileStorageQueryResult = {
  id: string;
  files: DataGridFileRef[];
};

function task_response_result_mapper({
  table_id,
  tasks,
  result,
}: {
  table_id: string;
  tasks: FileStorageQueryTask[];
  result: XSupabaseStorageTaskPoolerResult;
}): FileStorageQueryResult[] {
  return tasks.map((task) => {
    const { id } = task;
    const { key, attribute } = parsetaskid(id);
    const _files = result[key][attribute];
    const files = _files
      ? xsb_file_refs_mapper(table_id, attribute, _files)
      : [];
    return { id, files };
  });
}

export function GridFileStorageQueueProvider({
  table_id,
  supabase_table_id,
  children,
}: React.PropsWithChildren<{
  table_id: string;
  supabase_table_id: number | null;
}>) {
  const resolver = async (...t: FileStorageQueryTask[]) => {
    // we only support x-sb storage query for task based file resolving.
    // this is fine for now, other providers are not supported or already resolved in initial api call.
    if (!supabase_table_id) throw new Error("Supabase table id is required");
    const pl = {
      rows: t.map((t) => t.row),
    };

    const res: { data: XSupabaseStorageTaskPoolerResult } = await fetch(
      `/private/editor/connect/${table_id}/supabase/table/${supabase_table_id}/storage/pool`,
      {
        method: "POST",
        body: JSON.stringify(pl),
      }
    ).then((res) => {
      return res.json();
    });

    // api result shape: { [row_pk]: { [field_id]: { signedUrl: string, path: string }[] } }
    // output shape: { id: string, files: DataGridFileRef[] }
    // match task id <> result id
    const data = task_response_result_mapper({
      table_id,
      tasks: t,
      result: res.data,
    });

    // map the result with task id

    return { data: data, error: null };
  };

  return (
    <QueueProvider<FileStorageQueryResult, FileStorageQueryTask>
      identifier="id"
      batch={50}
      throttle={250}
      config={{}}
      resolver={resolver}
    >
      {children}
    </QueueProvider>
  );
}

export function useGridFileStorageQueue() {
  return useQueue<FileStorageQueryResult, FileStorageQueryTask>();
}

async function resolveFileRefs(
  resolver: DataGridCellFileRefsResolver | null | undefined,
  pooler?: StandaloneFileRefsResolverFn
): Promise<DataGridFileRef[] | null> {
  if (!resolver) return null;
  if (Array.isArray(resolver)) {
    return resolver satisfies DataGridFileRef[];
  }

  switch (resolver.type) {
    case "data-grid-file-storage-file-refs-resolver-fn":
      return await resolver.fn();
    case "data-grid-file-storage-file-refs-query-task":
      if (!pooler) throw new Error("Pooler is required with query task");
      return await pooler?.();
  }

  throw new Error("Invalid resolver");
}

export function useFileRefs(
  identifier: CellIdentifier,
  rowdata: Record<string, any>,
  resolver?: DataGridCellFileRefsResolver
): DataGridFileRef[] | "loading" | null | "error" {
  const { add } = useGridFileStorageQueue();
  const [error, setError] = useState<any | null>(null);
  const [refs, setRefs] = useState<DataGridFileRef[] | "loading" | null>(
    "loading"
  );

  useEffect(() => {
    if (!resolver) {
      setRefs(null);
      return;
    }

    const id = taskid(identifier);
    // TODO: make it dynamic

    resolveFileRefs(resolver, async () => {
      const res = await add({ id, row: rowdata });
      if (res.data?.files) {
        return res.data?.files;
      }
      throw res.error;
    })
      .then((res) => {
        setRefs(res);
      })
      .catch((e) => {
        console.error(e);
        setRefs(null);
        setError(e ?? true);
      });
  }, [resolver]);

  return error ? "error" : refs;
}
