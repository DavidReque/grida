"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormView } from "@/scaffolds/e/form";
import { Editor as MonacoEditor, useMonaco } from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  JSONField,
  JSONForm,
  JSONOptionLike,
  parse,
  parse_jsonfield_type,
} from "@/types/schema";
import resources from "@/k/i18n";
import { FormRenderTree } from "@/lib/forms";
import { GridaLogo } from "@/components/grida-logo";
import { FormFieldAutocompleteType, Option } from "@/types";
import { Button } from "@/components/ui/button";
import { Link2Icon, RocketIcon, SlashIcon } from "@radix-ui/react-icons";
import { createClientFormsClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Ajv from "ajv";
import { useRouter } from "next/navigation";

const HOST = process.env.NEXT_PUBLIC_HOST_NAME || "http://localhost:3000";

const examples = [
  {
    id: "001-hello-world",
    name: "Hello World",
    template: {
      schema: {
        src: `${HOST}/schema/examples/001-hello-world/form.json`,
      },
    },
  },
  {
    id: "002-iphone-pre-order",
    name: "iPhone Pre-Order",
    template: {
      schema: {
        src: `${HOST}/schema/examples/002-iphone-pre-order/form.json`,
      },
    },
  },
  {
    id: "003-fields",
    name: "Fields",
    template: {
      schema: {
        src: `${HOST}/schema/examples/003-fields/form.json`,
      },
    },
  },
] as const;

type MaybeArray<T> = T | T[];

function toArrayOf<T>(value: MaybeArray<T>, nofalsy = true): NonNullable<T>[] {
  return (
    Array.isArray(value) ? value : nofalsy && value ? [value] : []
  ) as NonNullable<T>[];
}

function compile(txt?: string) {
  const schema = parse(txt);
  if (!schema) {
    return;
  }

  const map_option = (o: JSONOptionLike): Option => {
    switch (typeof o) {
      case "string":
      case "number": {
        return {
          id: String(o),
          value: String(o),
          label: String(o),
        };
      }
      case "object": {
        return {
          ...o,
          id: o.value,
        };
      }
    }
  };

  const renderer = new FormRenderTree(
    nanoid(),
    schema.fields?.map((f: JSONField, i) => {
      const { type, is_array } = parse_jsonfield_type(f.type);
      return {
        ...f,
        id: f.name,
        type: type,
        is_array,
        autocomplete: toArrayOf<FormFieldAutocompleteType | undefined>(
          f.autocomplete
        ),
        required: f.required || false,
        local_index: i,
        options: f.options?.map(map_option) || [],
      };
    }) || [],
    []
  );

  return renderer;
}

export function Playground({
  initial,
  slug,
}: {
  initial?: string;
  slug?: string;
}) {
  const router = useRouter();
  const [is_modified, set_is_modified] = useState(false);
  const [exampleId, setExampleId] = useState<string | undefined>(
    initial ? undefined : examples[0].id
  );
  const [__schema_txt, __set_schema_txt] = useState<string | undefined>(
    initial
  );

  const renderer: FormRenderTree | undefined = useMemo(
    () => compile(__schema_txt),
    [__schema_txt]
  );

  useEffect(() => {
    if (exampleId) {
      fetch(examples.find((e) => e.id === exampleId)!.template.schema.src)
        .then((res) => res.text())
        .then((schema) => {
          __set_schema_txt(schema);
        });
    }
  }, [exampleId]);

  const onShare = async () => {
    const supabase = createClientFormsClient();
    const { data, error } = await supabase
      .from("playground_gist")
      .insert({
        gist: JSON.parse(__schema_txt!),
      })
      .select("slug")
      .single();

    if (error) {
      toast.error("Failed");
    }

    // update the route
    router.replace(`/playground/${data!.slug}`);
  };

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden">
      <header className="p-4 flex justify-between border-b">
        <div className="flex gap-1 items-center">
          <h1 className="text-xl font-black flex items-center gap-2">
            <GridaLogo />
            Forms
            <span className="font-mono text-sm px-3 py-1 rounded-md bg-black/45 text-white">
              Playground
            </span>
          </h1>
          <SlashIcon className="h-6 w-6 opacity-20" />
          <div className="ms-1">
            <Select
              value={exampleId}
              onValueChange={(value) => setExampleId(value)}
            >
              <SelectTrigger id="method" aria-label="select method">
                <SelectValue placeholder="Examples" />
              </SelectTrigger>
              <SelectContent>
                {examples.map((example) => (
                  <SelectItem key={example.id} value={example.id}>
                    {example.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {slug && !is_modified && <Button variant="link">../{slug}</Button>}
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={onShare} disabled={!is_modified} variant="secondary">
            <Link2Icon className="mr-2" />
            Share
          </Button>
          <Button>
            <RocketIcon className="mr-2" />
            Publlish
          </Button>
        </div>
      </header>
      <div className="flex-1 flex max-h-full overflow-hidden">
        <section className="flex-1 h-full">
          <div className="w-full h-full flex flex-col">
            <div className="flex-shrink flex flex-col h-full">
              <Editor
                value={__schema_txt}
                onChange={(v) => {
                  __set_schema_txt(v);
                  set_is_modified(true);
                }}
              />
            </div>
            <div className="flex-grow">
              <details>
                <summary>Data</summary>
                <MonacoEditor
                  height={200}
                  defaultLanguage="json"
                  value={JSON.stringify(renderer, null, 2)}
                  options={{
                    padding: {
                      top: 16,
                    },
                    minimap: {
                      enabled: false,
                    },
                    scrollBeyondLastLine: false,
                  }}
                />
              </details>
            </div>
          </div>
        </section>
        <section className="flex-1 flex h-full overflow-y-scroll">
          {renderer ? (
            <FormView
              title={"Form"}
              form_id={renderer.id}
              fields={renderer.fields()}
              blocks={renderer.blocks()}
              tree={renderer.tree()}
              translation={resources.en.translation as any}
              options={{
                is_powered_by_branding_enabled: false,
              }}
            />
          ) : (
            <div className="grow flex items-center justify-center p-4 text-center text-gray-500">
              Invalid schema
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const schema = {
  uri: "https://forms.grida.co/schema/form.schema.json",
  fileMatch: ["*"], // Associate with all JSON files
};

function Editor({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value?: string) => void;
}) {
  const monaco = useMonaco();

  useEffect(() => {
    monaco?.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: true,
      schemas: [schema],
    });
  }, [monaco]);

  return (
    <div className="font-mono flex-1 flex flex-col w-full h-full">
      <header className="p-2">
        <h2 className="">form.json</h2>
      </header>
      <MonacoEditor
        height={"100%"}
        defaultLanguage="json"
        onChange={onChange}
        value={value}
        options={{
          automaticLayout: true,
          padding: {
            top: 16,
          },
          minimap: {
            enabled: false,
          },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
