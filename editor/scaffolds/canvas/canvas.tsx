import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Canvas } from "@code-editor/canvas";
import { useEditorState, useWorkspace } from "core/states";
import { Preview } from "scaffolds/preview";
import useMeasure from "react-use-measure";
import { useDispatch } from "core/dispatch";
import { FrameTitleRenderer } from "./render/frame-title";
import { IsolateModeCanvas } from "./isolate-mode";
import { useRouter } from "next/router";

type ViewMode = "full" | "isolate";

/**
 * Statefull canvas segment that contains canvas as a child, with state-data connected.
 */
export function VisualContentArea() {
  const [state] = useEditorState();
  const router = useRouter();
  const { mode: q_mode } = router.query;

  // this hook is used for focusing the node on the first load with the initial selection is provided externally.
  useEffect(() => {
    // if the initial selection is available, and not empty &&
    if (state.selectedNodesInitial?.length && q_mode == "isolate") {
      // trigger isolation mode once.
      setMode("isolate");

      // TODO: set explicit canvas initial transform.
      // make the canvas fit to the initial target even when the isolation mode is complete by the user.
    }
  }, [state.selectedNodesInitial]);

  const [canvasSizingRef, canvasBounds] = useMeasure();

  const { highlightedLayer, highlightLayer } = useWorkspace();
  const dispatch = useDispatch();

  const { selectedPage, design, selectedNodes } = state;

  const thisPageNodes = selectedPage
    ? state.design.pages
        .find((p) => p.id == selectedPage)
        .children.filter(Boolean)
    : [];

  const isEmptyPage = thisPageNodes?.length === 0;

  const [mode, _setMode] = useState<ViewMode>("full");

  const setMode = (m: ViewMode) => {
    _setMode(m);

    // update the router
    (router.query.mode = m) && router.push(router);
  };

  return (
    <CanvasContainer ref={canvasSizingRef} id="canvas">
      {/* <EditorAppbarFragments.Canvas /> */}

      {isEmptyPage ? (
        <></>
      ) : (
        <>
          {mode == "isolate" && (
            <IsolateModeCanvas
              onClose={() => {
                setMode("full");
              }}
            />
          )}
          <div
            style={{
              display: mode == "full" ? undefined : "none",
            }}
          >
            <Canvas
              key={selectedPage}
              viewbound={[
                canvasBounds.left,
                canvasBounds.top,
                canvasBounds.bottom,
                canvasBounds.right,
              ]}
              filekey={state.design.key}
              pageid={selectedPage}
              selectedNodes={selectedNodes.filter(Boolean)}
              highlightedLayer={highlightedLayer}
              onSelectNode={(node) => {
                dispatch({ type: "select-node", node: node?.id });
              }}
              onClearSelection={() => {
                dispatch({ type: "select-node", node: null });
              }}
              nodes={thisPageNodes}
              // initialTransform={ } // TODO: if the initial selection is provided from first load, from the query param, we have to focus to fit that node.
              renderItem={(p) => {
                return <Preview key={p.node.id} target={p.node} {...p} />;
              }}
              config={{
                can_highlight_selected_layer: true,
                marquee: {
                  disabled: true,
                },
              }}
              renderFrameTitle={(p) => (
                <FrameTitleRenderer
                  key={p.id}
                  {...p}
                  onRunClick={() => {
                    setMode("isolate");
                  }}
                />
              )}
            />
          </div>
        </>
      )}
    </CanvasContainer>
  );
}

const CanvasContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;
