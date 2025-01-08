"use client";

import React, { useContext, useRef } from "react";
import { useDocument, useTransform } from "./provider";
import { NodeElement } from "./nodes/node";
import { domapi } from "./domapi";

const UserDocumentCustomRendererContext = React.createContext<
  Record<string, CustomReactRenderer>
>({});

export function useUserDocumentCustomRenderer() {
  return useContext(UserDocumentCustomRendererContext);
}

type CustomReactRenderer = React.ComponentType<any>;

interface DocumentContentViewProps {
  /**
   * custom templates to render
   */
  templates?: Record<string, CustomReactRenderer>;
}

export function StandaloneDocumentContent({
  templates,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & DocumentContentViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    state: { document },
  } = useDocument();
  const { root_id } = document;

  return (
    <div id={domapi.k.EDITOR_CONTENT_ELEMENT_ID} ref={ref} {...props}>
      <UserDocumentCustomRendererContext.Provider value={templates ?? {}}>
        <NodeElement node_id={root_id} />
      </UserDocumentCustomRendererContext.Provider>
    </div>
  );
}

export function ContentTransform({ children }: React.PropsWithChildren<{}>) {
  const transform = useTransform();

  const matrix = `matrix(${transform[0][0]}, ${transform[1][0]}, ${transform[0][1]}, ${transform[1][1]}, ${transform[0][2]}, ${transform[1][2]})`;

  return (
    <div
      className="w-full h-full"
      style={{
        transform: matrix,
      }}
    >
      {children}
    </div>
  );
}
