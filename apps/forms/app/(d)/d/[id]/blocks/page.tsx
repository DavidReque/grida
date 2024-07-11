"use client";

import { AgentThemeProvider } from "@/scaffolds/agent/theme";
import { useEditorState } from "@/scaffolds/editor";
import { Siebar } from "@/scaffolds/sidebar/sidebar";
import { SideControl } from "@/scaffolds/sidecontrol";
import BlocksEditor from "@/scaffolds/blocks-editor";
import FormCollectionPage from "@/theme/templates/formcollection/page";
import FormStartPage from "@/theme/templates/formstart/default/page";

export default function EditFormPage() {
  return (
    <main className="h-full flex flex-1 w-full">
      <aside className="hidden lg:flex h-full">
        <Siebar mode="blocks" />
      </aside>
      <div className="relative w-full overflow-y-auto">
        <div
          className="absolute inset-0 pointer-events-none z-10"
          id="canvas-overlay-portal"
        />
        <AgentThemeProvider>
          <CurrentPageCanvas />
        </AgentThemeProvider>
      </div>
      <aside className="hidden lg:flex h-full">
        <SideControl mode="blocks" />
      </aside>
    </main>
  );
}

function CurrentPageCanvas() {
  const [state, dispatch] = useEditorState();

  switch (state.document.selected_page_id) {
    case "form":
      return <BlocksEditor />;
    case "collection":
      return (
        <div className="mx-auto my-20 max-w-[430px] border rounded-2xl shadow-2xl bg-background overflow-hidden">
          <FormCollectionPage />
        </div>
      );
    case "start": {
      return (
        <div className="mx-auto my-20 max-w-[430px] border rounded-2xl shadow-2xl bg-background overflow-hidden">
          <FormStartPage />
        </div>
      );
    }
    default:
      return <>TODO</>;
  }
}
