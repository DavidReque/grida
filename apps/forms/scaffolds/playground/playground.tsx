"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor as MonacoEditor, useMonaco } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GridaLogo } from "@/components/grida-logo";
import { Button } from "@/components/ui/button";
import {
  Link2Icon,
  ReloadIcon,
  RocketIcon,
  SlashIcon,
} from "@radix-ui/react-icons";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { examples } from "./k";
import { generate } from "@/app/actions";
import { readStreamableValue } from "ai/rsc";
import Link from "next/link";
import { useDarkMode } from "usehooks-ts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlaygroundPreview from "./preview";
import { ThemePalette } from "../theme-editor/palette-editor";
import { z } from "zod";
import { Theme } from "../theme-editor/types";
import { defaultTheme } from "../theme-editor/k";
import { stringfyThemeVariables } from "../theme-editor/serialize";

const HOST_NAME = process.env.NEXT_PUBLIC_HOST_NAME || "http://localhost:3000";

const theme = {
  "variables.css": `
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}
`,
};

export function Playground({
  initial,
}: {
  initial?: {
    src?: string;
    prompt?: string;
    slug?: string;
  };
}) {
  const generating = useRef(false);
  const router = useRouter();

  // const [is_modified, set_is_modified] = useState(false);
  const [exampleId, setExampleId] = useState<string | undefined>(
    initial ? undefined : examples[0].id
  );
  // const [data, setData] = useState<JSONForm | undefined>();
  const [__schema_txt, __set_schema_txt] = useState<string | null>(
    initial?.src || null
  );

  const [__variablecss_txt, __set_variablecss_txt] = useState<string | null>(
    stringfyThemeVariables(theme)
  );

  const is_modified = __schema_txt !== initial?.src;
  const [busy, setBusy] = useState(false);

  const streamGeneration = (prompt: string) => {
    if (generating.current) {
      return;
    }

    setBusy(true);
    generating.current = true;
    generate(prompt, initial?.slug).then(async ({ output }) => {
      for await (const delta of readStreamableValue(output)) {
        // setData(delta as JSONForm);
        __set_schema_txt(JSON.stringify(delta, null, 2));
      }
      generating.current = false;
      setBusy(false);
    });
  };

  useEffect(() => {
    if (initial?.prompt && !initial?.src) {
      streamGeneration(initial.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (exampleId) {
      fetch(examples.find((e) => e.id === exampleId)!.template.schema.src)
        .then((res) => res.text())
        .then((schema) => {
          __set_schema_txt(schema);
        });
    }
  }, [exampleId]);

  const onShareClick = async () => {
    setBusy(true);
    fetch("/playground/share", {
      method: "POST",
      body: JSON.stringify({
        src: __schema_txt,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((req) => req.json())
      .then(({ slug }) => {
        // update the route
        router.push(`/playground/${slug}`);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to share");
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <header className="relative p-4 flex justify-between border-b">
        {/* {busy && (
          <div className="absolute inset-0 flex items-center justify-center">
            
          </div>
        )} */}
        <div className="flex-1  flex gap-1 items-center">
          <Link href="/ai">
            <button className="text-md font-black text-start flex items-center gap-2">
              <GridaLogo />
              <span className="flex flex-col">
                Forms
                <span className="-mt-1 font-mono font-normal text-[10px]">
                  Playground
                </span>
              </span>
            </button>
          </Link>
          <SlashIcon className="h-6 w-6 opacity-20" />
          <div className="ms-1">
            <Select
              disabled={busy}
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
          {initial?.slug && !is_modified && (
            <Button
              onClick={() => {
                // copy to clipboard
                navigator.clipboard.writeText(
                  `${HOST_NAME}/playground/${initial.slug}`
                );
                toast.success("Copied");
              }}
              variant="link"
            >
              ../{initial.slug}
            </Button>
          )}
        </div>
        <div className="flex-1 flex justify-center">
          {busy ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-t-[#333] rounded-full animate-spin" />
              <span className="text-sm opacity-80">Generating...</span>
            </div>
          ) : (
            <>
              {initial?.prompt ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      streamGeneration(initial.prompt!);
                    }}
                  >
                    <ReloadIcon />
                  </Button>
                </>
              ) : (
                <></>
              )}
            </>
          )}
        </div>
        <div className="flex-1 flex gap-2 items-center justify-end">
          <Button
            onClick={onShareClick}
            disabled={!is_modified || busy}
            variant="secondary"
          >
            <Link2Icon className="mr-2" />
            Share
          </Button>
          <form action={`/playground/publish`} method="POST">
            <input type="hidden" name="src" value={__schema_txt || undefined} />
            <input type="hidden" name="gist" value={initial?.slug} />
            <Button disabled={busy}>
              <RocketIcon className="mr-2" />
              Publish
            </Button>
          </form>
        </div>
      </header>
      <div className="flex-1 flex max-h-full overflow-hidden">
        <section className="flex-1 h-full">
          <div className="w-full h-full flex flex-col">
            <div className="flex-shrink flex flex-col h-full">
              <Editor
                readonly={busy}
                files={{
                  "form.json": {
                    name: "form.json",
                    language: "json",
                    value: __schema_txt || "",
                  },
                  "variables.css": {
                    name: "variables.css",
                    language: "css",
                    value: __variablecss_txt || "",
                  },
                }}
                onChange={(f: EditorFileName, v?: string) => {
                  switch (f) {
                    case "form.json": {
                      __set_schema_txt(v || "");
                      return;
                    }
                    case "variables.css": {
                      __set_variablecss_txt(v || "");
                      return;
                    }
                  }
                }}
              />
            </div>
          </div>
        </section>
        <div className="h-full border-r" />
        <section className="flex-1 h-full overflow-y-scroll">
          <PlaygroundPreview
            schema={__schema_txt || ""}
            css={__variablecss_txt || ""}
          />
        </section>
      </div>
    </main>
  );
}

const schema = {
  uri: "https://forms.grida.co/schema/form.schema.json",
  fileMatch: ["*"], // Associate with all JSON files
};

type EditorFileName = "form.json" | "variables.css";
type EditorFile<T extends EditorFileName = any> = {
  name: EditorFileName;
  language: "json" | "css";
  value?: string;
};
type EditorFiles = {
  "form.json": EditorFile<"form.json">;
  "variables.css": EditorFile<"variables.css">;
};

function Editor({
  files,
  onChange,
  readonly,
}: {
  // value?: string;
  files: EditorFiles;
  onChange?: (fileName: EditorFileName, value?: string) => void;
  readonly?: boolean;
}) {
  const monaco = useMonaco();
  const { isDarkMode } = useDarkMode();
  const [fileName, setFileName] = useState<EditorFileName>("form.json");

  const file = files[fileName];

  useEffect(() => {
    monaco?.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: true,
      schemas: [schema],
    });

    import("monaco-themes/themes/Blackboard.json").then((data) => {
      data.colors["editor.background"] = "#0D0D0D";
      monaco?.editor.defineTheme("dark", data as any);
      monaco?.editor.setTheme(isDarkMode ? "dark" : "light");
    });
  }, [monaco]);

  return (
    <div className="font-mono flex-1 flex flex-col w-full h-full">
      <header className="p-2 border-b z-10">
        <Tabs
          value={fileName}
          onValueChange={(file) => {
            setFileName(file as EditorFileName);
          }}
        >
          <TabsList>
            {Object.keys(files).map((file) => (
              <TabsTrigger key={file} value={file}>
                {file}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>
      <div className="relative w-full h-full">
        {fileName === "variables.css" && (
          <div className="absolute z-10 top-0 right-0 max-w-lg">
            <ThemePalette
              initialTheme={defaultTheme}
              onValueChange={(theme) => {
                // create css from theme
                const css = stringfyThemeVariables(theme);

                onChange?.("variables.css", css);
              }}
            />
          </div>
        )}
        <MonacoEditor
          height={"100%"}
          onChange={(v) => {
            onChange?.(fileName, v);
          }}
          path={fileName}
          defaultLanguage={file.language}
          defaultValue={file.value}
          value={file.value}
          theme={isDarkMode ? "dark" : "light"}
          options={{
            readOnly: readonly || fileName === "variables.css",
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
    </div>
  );
}
