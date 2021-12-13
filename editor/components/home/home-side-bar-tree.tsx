import React, { memo, useCallback, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { TreeView } from "@editor-ui/editor";
import { PageRow } from "./home-side-bar-tree-item";
import { useRouter } from "next/router";
import { flatten } from "components/editor/editor-layer-hierarchy/editor-layer-heriarchy-controller";
interface PresetPage {
  id: string;
  name: string;
  path: string;
  depth: number;
  children?: PresetPage[];
}

const preset_pages: PresetPage[] = [
  {
    id: "/",
    name: "Home",
    path: "/",
    depth: 0,
    children: [
      {
        id: "/#recents",
        name: "Recents",
        path: "/#recents",
        depth: 1,
      },
      {
        id: "/#files",
        name: "Files",
        path: "/#files",
        depth: 1,
      },
      {
        id: "/#scenes",
        name: "Scenes",
        path: "/#scenes",
        depth: 1,
      },
      {
        id: "/#components",
        name: "Components",
        path: "/#components",
        depth: 1,
      },
    ],
  },
  {
    id: "/files",
    name: "Files",
    path: "/files",
    depth: 0,
  },
  {
    id: "/components",
    name: "Components",
    path: "/components",
    depth: 0,
  },
  {
    id: "/integrations",
    name: "Import / Sync",
    path: "/integrations",
    depth: 0,
  },
  {
    id: "/docs",
    name: "Docs",
    path: "/docs",
    depth: 0,
  },
];

export function HomeSidebarTree() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(router.asPath);

  const renderItem = useCallback(
    ({ id, name, path, depth, children }, index: number) => {
      return (
        <PageRow
          id={id}
          name={name}
          key={id}
          depth={depth}
          expanded={children?.length > 0 ? true : undefined}
          selected={selected == path}
          onMenuClick={() => {}}
          onDoubleClick={() => {}}
          onPress={() => {
            setSelected(path);
            router.push(path);
          }}
          onClickChevron={() => {}}
          onContextMenu={() => {}}
        />
      );
    },
    [selected]
  );

  const pages = preset_pages.map((pageroot) => flatten(pageroot)).flat();
  console.log(pages);
  return (
    <TreeView.Root
      data={pages}
      keyExtractor={useCallback((item: any) => item.id, [])}
      renderItem={renderItem}
    />
  );
}
