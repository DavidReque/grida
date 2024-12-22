"use client";

import React, { useState } from "react";
import { useDocument } from "@/grida-canvas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CaretDownIcon, CaretUpIcon } from "@radix-ui/react-icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useDialogState } from "@/components/hooks/use-dialog-state";
import { useGoogleFontsList } from "../google.fonts";

export function DevtoolsPanel() {
  const { state } = useDocument();
  const fonts = useGoogleFontsList();
  const expandable = useDialogState();

  const {
    document,
    document_ctx,
    history,
    googlefonts,
    user_clipboard,
    ...state_without_document
  } = state;

  const onTabClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    expandable.openDialog();
  };

  return (
    <Collapsible {...expandable.props}>
      <Tabs defaultValue="document" className="border-t">
        <div
          onClick={expandable.toggleOpen}
          className="w-full flex justify-between border-b"
        >
          <div className="w-full">
            <TabsList className="m-2">
              <TabsTrigger onClick={onTabClick} value="document">
                Document
              </TabsTrigger>
              <TabsTrigger onClick={onTabClick} value="editor">
                Editor
              </TabsTrigger>
              <TabsTrigger onClick={onTabClick} value="fonts">
                Fonts
              </TabsTrigger>
              <TabsTrigger onClick={onTabClick} value="clipboard">
                Clipboard
              </TabsTrigger>
            </TabsList>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant="outline"
              size="icon"
              className="m-2"
            >
              {expandable.open ? <CaretDownIcon /> : <CaretUpIcon />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="h-96">
          <TabsContent
            value="document"
            className="p-2 overflow-scroll w-full h-full"
          >
            <JSONContent value={{ document, document_ctx }} />
          </TabsContent>
          <TabsContent
            value="editor"
            className="p-2 overflow-scroll w-full h-full"
          >
            <JSONContent value={state_without_document} />
          </TabsContent>
          <TabsContent
            value="clipboard"
            className="p-2 overflow-scroll w-full h-full"
          >
            <JSONContent value={user_clipboard} />
          </TabsContent>
          <TabsContent
            value="fonts"
            className="p-2 overflow-scroll w-full h-full"
          >
            <JSONContent
              value={{
                // used fonts
                fonts: googlefonts,
                // all fonts
                registry: fonts,
              }}
            />
          </TabsContent>
        </CollapsibleContent>
      </Tabs>
    </Collapsible>
  );
}

function JSONContent({ value }: { value: unknown }) {
  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        width="100%"
        defaultLanguage="json"
        value={JSON.stringify(value, null, 2)}
        options={{
          minimap: { enabled: false },
          readOnly: true,
        }}
      />
    </div>
  );
}
