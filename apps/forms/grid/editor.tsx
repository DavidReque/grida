"use client";
import { produce } from "immer";
import { PlusIcon } from "@radix-ui/react-icons";
import React, {
  createContext,
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useGesture } from "@use-gesture/react";

import { nanoid } from "nanoid";
import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import useMergedRef from "./use-merged-ref";
import { cvt_delta_by_resize_handle_origin, resize } from "./transform-resize";
import { motion } from "framer-motion";

type TransformOrigin = [0 | 1, 0 | 1];

/**
 * [x1 y1 x2 y2]
 */
type Area = [number, number, number, number];
type Position = [number, number];
type Size = [number, number];
type BlockId = string;

type Block<T = any> = {
  id: BlockId;
  x: Position;
  y: Position;
  z?: number;
  data?: T;
};

interface State {
  /**
   * scale factor for grid
   * @default 1
   */
  scalefactor: number;

  /**
   * cell unit in px
   */
  unit: number;

  /**
   * actual width - consider canvas width
   * @default 375
   */
  width: number;

  /**
   * actual height - consider canvas height
   * @default 750
   */
  height: number;

  /**
   * grid size
   * @default [6, 12]
   */
  size: Size;

  /**
   * current pointer position in grid space
   */
  point: Position;

  /**
   * is dragging
   */
  is_dragging: boolean;

  /**
   * is resizing
   */
  is_resizing: boolean;

  /**
   * current delta of the grid block
   */
  delta: [number, number];

  resize_anchor?: "nw" | "ne" | "sw" | "se";

  /**
   * Displacement of the current gesture (clientXY)
   */
  movement: [number, number];

  /**
   * is marquee selection
   */
  is_marquee: boolean;

  /**
   * start position of marquee in grid space
   */
  start?: Position;

  /**
   * end position of marquee in grid space
   */
  end?: Position;

  /**
   * marquee / dropzone area in grid space
   */
  area?: Area;

  controls: {};

  /**
   * selected block id
   */
  selection?: BlockId;

  /**
   * highlighted block id
   */
  highlight?: BlockId;

  debug?: boolean;

  /**
   * grid content blocks
   */
  blocks: Block[];
}

const initial: State = {
  scalefactor: 1,
  width: 375,
  height: 750,
  unit: 62.5,
  size: [6, 12],
  point: [-0, -0],
  resize_anchor: undefined,
  is_dragging: false,
  is_resizing: false,
  is_marquee: false,
  area: undefined,
  delta: [0, 0],
  movement: [0, 0],
  selection: undefined,
  highlight: undefined,
  debug: false,
  controls: {
    insert_panel_open: false,
  },
  blocks: [],
};

type Action =
  | PonterMoveAction
  | PonterLeaveAction
  | PonterDownrAction
  | OpenChangeInsertBlockPanel
  | PonterUpAction
  | InsertBlock
  | InsertBlockHere
  | BlcokPointerEnterAction
  | BlcokPointerLeaveAction
  | BlcokPointerDownAction
  | BlcokDragStartAction
  | BlcokDragAction
  | BlockDragEndAction
  | HandleDragStartAction
  | HandleDragAction
  | HandleDragEndAction
  | ClearAction;

interface PonterMoveAction {
  type: "pointermove";
  xy: [number, number];
}

interface PonterLeaveAction {
  type: "pointerleave";
}

interface PonterDownrAction {
  type: "pointerdown";
}

interface PonterUpAction {
  type: "pointerup";
}

interface BlcokPointerEnterAction {
  type: "block/pointerenter";
  id: BlockId;
}

interface BlcokPointerLeaveAction {
  type: "block/pointerleave";
}

interface BlcokPointerDownAction {
  type: "block/pointerdown";
  id: BlockId;
}

interface BlcokDragStartAction {
  type: "block/dragstart";
  id: BlockId;
}

interface BlcokDragAction {
  type: "block/drag";
  // Displacement of the current gesture
  movement: [number, number];
}

interface BlockDragEndAction {
  type: "block/dragend";
}

interface HandleDragStartAction {
  type: "handle/dragstart";
  anchor: "nw" | "ne" | "sw" | "se";
}

interface HandleDragAction {
  type: "handle/drag";
  // Displacement of the current gesture
  movement: [number, number];
}

interface HandleDragEndAction {
  type: "handle/dragend";
}

interface OpenChangeInsertBlockPanel {
  type: "controls/insert_panel_open";
  open: boolean;
}

interface InsertBlock {
  type: "blocks/new";
  block: Block;
}

interface InsertBlockHere {
  type: "blocks/new/here";
  data?: Block["data"];
}

interface ClearAction {
  type: "clear";
}

const Context = React.createContext<State | undefined>(undefined);

type Dispatcher = (action: Action) => void;
type FlatDispatcher = (action: Action) => void;
const __noop = () => {};

const DispatchContext = createContext<Dispatcher>(__noop);

/**
 * calculate grid position based on mouse position
 * @param cellsize cell size in px
 * @param xy mouse position in px (relative to grid)
 * @returns
 */
const gridxypos = (cellsize: number, xy: [number, number]): Position => {
  return [
    Math.floor(xy[0] / cellsize),
    Math.floor(xy[1] / cellsize),
  ] as Position;
};

/**
 * (rounded) calculate grid position based on mouse position
 * @param cellsize cell size in px
 * @param xy mouse position in px (relative to grid)
 * @returns
 */
const gridxyposround = (cellsize: number, xy: [number, number]): Position => {
  return [
    Math.round(xy[0] / cellsize),
    Math.round(xy[1] / cellsize),
  ] as Position;
};

const gridindexpos = (col: number, i: number): Position => {
  const x = i % col;
  const y = Math.floor(i / col);
  return [x, y];
};

function reducer(state: State, action: Action): State {
  console.log(action);
  switch (action.type) {
    case "clear": {
      return produce(state, (draft) => {
        draft.selection = undefined;
        draft.is_marquee = false;
        draft.area = undefined;
      });
    }
    case "pointerdown": {
      return produce(state, (draft) => {
        if (state.is_dragging) {
          return;
        }
        draft.selection = undefined;
        draft.is_marquee = true;
        draft.start = state.point;
        draft.area = [...state.point, ...state.point];
      });
    }
    case "pointerleave": {
      return produce(state, (draft) => {
        draft.point = [-1, -1];
      });
    }
    case "pointerup": {
      return produce(state, (draft) => {
        if (state.is_dragging) {
          return;
        }

        // this can happen when pointer is down from outside the grid and up
        if (!state.is_marquee) {
          return;
        }

        draft.is_marquee = false;
        draft.end = state.point;
      });
    }
    case "pointermove": {
      const { xy } = action;
      const { unit: cellsize } = state;

      const pos = gridxypos(cellsize, xy);

      return produce(state, (draft) => {
        draft.point = pos;

        if (state.is_marquee && state.start) {
          const [startX, startY] = state.start;
          const [endX, endY] = pos;

          const [minX, maxX] = startX < endX ? [startX, endX] : [endX, startX];
          const [minY, maxY] = startY < endY ? [startY, endY] : [endY, startY];

          draft.end = pos;
          draft.area = [minX, minY, maxX, maxY];
        }
      });
    }
    case "controls/insert_panel_open": {
      const { open } = action;
      return produce(state, (draft) => {
        if (!open) {
          draft.is_marquee = false;
          draft.area = undefined;
        }
      });
    }
    case "blocks/new": {
      const { block } = action;
      return produce(state, (draft) => {
        const { id } = block;
        draft.blocks.push(block);

        // select the block
        draft.selection = id;
        draft.highlight = id;
      });
    }
    case "blocks/new/here": {
      const { data } = action;
      return produce(state, (draft) => {
        const id = nanoid();
        const [_mx1, _my1, _mx2, _my2] = state.area ?? [0, 0, 1, 1];

        const x: Position = [_mx1, _mx2];
        const y: Position = [_my1, _my2];

        draft.blocks.push({
          id,
          x: x,
          y: y,
          z: 0,
          data: data,
        });

        // select the block
        draft.selection = id;
        draft.highlight = id;
      });
    }
    case "block/pointerenter": {
      const { id } = action;
      return produce(state, (draft) => {
        draft.highlight = id;
      });
    }
    case "block/pointerleave": {
      return produce(state, (draft) => {
        draft.highlight = undefined;
      });
    }
    case "block/pointerdown": {
      const { id } = action;
      return produce(state, (draft) => {
        draft.selection = id;
        draft.highlight = id;
      });
    }
    case "block/dragstart": {
      const { id } = action;
      return produce(state, (draft) => {
        draft.movement = [0, 0];
        draft.selection = id;
        draft.highlight = id;
        draft.is_dragging = true;
      });
    }
    case "block/drag": {
      const { movement } = action;
      return produce(state, (draft) => {
        if (!state.is_dragging) return;

        draft.movement = movement;
        // update the marquee area to let user know the drop area
        const [_client_dx, _client_dy] = movement;
        const block = state.blocks.find((b) => b.id === state.selection);
        // silent assert
        if (!block) return;

        const [dx, dy] = gridxyposround(state.unit, [_client_dx, _client_dy]);

        const [ax1, ax2] = block.x;
        const [bx1, bx2] = [ax1 + dx, ax2 + dx];

        const [ay1, ay2] = block.y;
        const [by1, by2] = [ay1 + dy, ay2 + dy];

        // console.log(ax1, ax2, "=> ", _client_dx, dx, " => ", bx1, bx2);

        draft.area = [bx1, by1, bx2, by2];
      });
    }
    case "block/dragend": {
      return produce(state, (draft) => {
        if (!state.is_dragging) return;
        // place the block
        const block = draft.blocks.find((b) => b.id === state.selection);
        // silent assert
        if (!block) return;
        if (!state.area) return;

        const [mx1, my1, mx2, my2] = state.area ?? [-1, -1, -1, -1];

        block.x = [mx1, mx2];
        block.y = [my1, my2];

        draft.movement = [0, 0];
        draft.is_dragging = false;
        draft.area = undefined; // Clear marquee after drag ends
      });
    }
    case "handle/dragstart": {
      const { anchor } = action;
      return produce(state, (draft) => {
        draft.is_resizing = true;
        draft.resize_anchor = anchor;
        draft.movement = [0, 0];
      });
    }
    case "handle/drag": {
      const { movement } = action;
      return produce(state, (draft) => {
        draft.movement = movement;

        // update the marquee area to let user know the resized area
        const [_client_dx, _client_dy] = movement;
        const block = draft.blocks.find((b) => b.id === state.selection);
        // silent assert
        if (!block) return;

        const [dx, dy] = gridxyposround(state.unit, [_client_dx, _client_dy]);

        const [ax1, ax2] = block.x;
        const [ay1, ay2] = block.y;

        const [nx1_, nx2_] = [ax1, ax2];
        const [ny1_, ny2_] = [ay1, ay2];

        const [dx_, dy_] = [dx, dy];

        // TODO: hanlde following the anchor
        // const [nx1__, nx2__] = [nx1_ + dx_, nx2_ + dx_];
        // const [ny1__, ny2__] = [ny1_ + dy_, ny2_ + dy_];
        const [nx1__, nx2__] = [nx1_, nx2_ + dx_];
        const [ny1__, ny2__] = [ny1_, ny2_ + dy_];

        // update the area
        draft.area = [nx1__, ny1__, nx2__, ny2__];
      });
    }
    case "handle/dragend": {
      return produce(state, (draft) => {
        draft.movement = [0, 0];
        draft.is_resizing = false;

        const block = draft.blocks.find((b) => b.id === state.selection);
        // silent assert
        if (!block) return;

        const [mx1, my1, mx2, my2] = draft.area ?? [
          block.x[0],
          block.y[0],
          block.x[1],
          block.y[1],
        ];

        block.x = [mx1, mx2];
        block.y = [my1, my2];
      });
    }
  }
  return produce(state, (draft) => {});
}

export const useDispatch = (): FlatDispatcher => {
  const dispatch = useContext(DispatchContext);
  return useCallback(
    (action: Action) => {
      dispatch(action);
    },
    [dispatch]
  );
};

export const StateProvider = memo(function StateProvider({
  state,
  dispatch,
  children,
}: {
  state: State;
  dispatch?: Dispatcher;
  children?: React.ReactNode;
}) {
  return (
    <Context.Provider value={state}>
      <DispatchContext.Provider value={dispatch ?? __noop}>
        {children}
      </DispatchContext.Provider>
    </Context.Provider>
  );
});

const useGridState = (): [State, FlatDispatcher] => {
  const state = useContext(Context);

  if (!state) {
    throw new Error(`No StateProvider: this is a logical error.`);
  }

  const dispatch = useDispatch();

  return useMemo(() => [state, dispatch], [state, dispatch]);
};

export const useGrid = () => {
  const [state, dispatch] = useGridState();

  const grid = {
    ...state,
    clear: () => {
      dispatch({ type: "clear" });
    },
    insertBlockOnAera: (data?: Block["data"]) => {
      dispatch({ type: "blocks/new/here", data });
    },
  };

  return grid;
};

interface EditorProps {
  renderer: (block: Block["data"]) => React.ReactNode;
  onMarqueeEnd?: (area?: Area) => void;
  onBlockDoubleClick?: (id: BlockId) => void;
}

export function GridContext({ children }: React.PropsWithChildren<{}>) {
  return <Provider>{children}</Provider>;
}

function Provider({ children }: React.PropsWithChildren<{}>) {
  const [state, dispatch] = React.useReducer(reducer, initial);
  return (
    <StateProvider state={state} dispatch={dispatch}>
      {children}
    </StateProvider>
  );
}

export function GridEditor({
  onMarqueeEnd,
  onBlockDoubleClick,
  renderer,
}: EditorProps) {
  const [state, dispatch] = useGridState();

  const [col, row] = state.size;

  useEffect(() => {
    if (state.is_marquee === false) {
      onMarqueeEnd?.(state.area);
    }
  }, [state.is_marquee]);

  return (
    <>
      <DndContext
      // sensors={sensors}
      // collisionDetection={closestCorners}
      // modifiers={[restrictToVerticalAxis]}
      // onDragEnd={handleDragEnd}
      >
        <div
          id="grid-editor"
          style={{
            userSelect: "none",
            width: state.width,
            height: state.height,
          }}
        >
          <GridGuide col={col} row={row} />
          <Grid col={col} row={row}>
            {state.blocks.map((block) => (
              <GridAreaBlock
                key={block.id}
                id={block.id}
                x={block.x}
                y={block.y}
                z={block.z}
                onDoubleClick={() => {
                  onBlockDoubleClick?.(block.id);
                }}
              >
                {renderer(block.data)}
              </GridAreaBlock>
            ))}
          </Grid>
        </div>
      </DndContext>
    </>
  );
}

function GridGuide({
  col,
  row,
  debug,
}: {
  col: number;
  row: number;
  debug?: boolean;
}) {
  // <div
  //   style={{
  //     height: "852px",
  //     width: "calc(100% - 1px)",
  //     boxSizing: "border-box",
  //     pointerEvents: "none",
  //     position: "absolute",
  //     top: 0,
  //     left: 0,
  //     zIndex: -10,
  //     mixBlendMode: "difference",
  //     backgroundImage:
  //       "linear-gradient(rgba(255, 255, 255, 0.65) 0.51px, transparent 0.51px), linear-gradient(to right, rgba(255, 255, 255, 0.65) 0.51px, transparent 0.51px)",
  //     backgroundPosition: "-1px -1px",
  //     backgroundSize: "71px 71px",
  //   }}
  // ></div>

  const [state, dispatch] = useGridState();

  const { width, height } = state;

  return (
    <>
      <div
        id="grid-guide"
        className="w-full h-full z-10"
        style={{
          position: "absolute",
          pointerEvents: "none",
          display: "grid",
          gridTemplateColumns: `repeat(${col}, 1fr)`,
          gridTemplateRows: `repeat(${row}, 1fr)`,
          width: width,
          height: height,
          // height: "calc(var(--scale-factor) * 750)",
          // width: "calc(var(--scale-factor) * 375)",
          margin: "0px auto",
          border: "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        {Array.from({ length: col * row }).map((_, i) => (
          <Cell pos={gridindexpos(col, i)} key={i} index={i} />
        ))}
      </div>
    </>
  );
}

function Cell({ pos, index }: { pos: Position; index: number }) {
  const [state, dispatch] = useGridState();
  const [col, row] = state.size;
  const [_mx1, _my1, _mx2, _my2] = state.area ?? [-1, -1, -1, -1];

  const is_in_marquee =
    pos[0] >= _mx1 && pos[0] <= _mx2 && pos[1] >= _my1 && pos[1] <= _my2;

  const { is_dragging, is_resizing } = state;
  const is_pointer = state.point[0] === pos[0] && state.point[1] === pos[1];
  const is_hover = is_pointer && !is_dragging && !is_resizing;

  return (
    <div
      data-hover={is_hover}
      data-marqueed={is_in_marquee}
      className={clsx(
        "data-[hover='true']:bg-gray-500/15",
        "data-[marqueed='true']:bg-gray-500/15"
      )}
      style={{
        touchAction: "none",
        border: "0.1px solid rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {state.debug ? (
        <>
          <span className="text-xs font-mono opacity-20">
            {gridindexpos(col, index).join(",")}
          </span>
        </>
      ) : (
        <>
          <PlusIcon className="opacity-20" />
        </>
      )}
    </div>
  );
}

function Grid({
  col,
  row,
  children,
}: React.PropsWithChildren<{
  col: number;
  row: number;
}>) {
  const [state, dispatch] = useGridState();
  const { width, height } = state;
  const ref = useRef<HTMLDivElement>(null);

  useGesture(
    {
      onMove: ({ xy: [x, y] }) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const relx = x - rect.left;
          const rely = y - rect.top;
          dispatch({ type: "pointermove", xy: [relx, rely] });
        }
      },
      onPointerLeave: () => {
        dispatch({ type: "pointerleave" });
      },
      onPointerDown: () => {
        dispatch({ type: "pointerdown" });
      },
      onPointerUp: () => {
        dispatch({ type: "pointerup" });
      },
      // ensure pointerup from outside the grid
      onDragEnd: () => {
        dispatch({ type: "pointerup" });
      },
    },
    {
      target: ref,
    }
  );

  return (
    <div
      ref={ref}
      className="w-full h-full"
      style={{
        touchAction: "none",
        // position: "relative",
        position: "absolute",
        display: "grid",
        gridTemplateColumns: `repeat(${col}, 1fr)`,
        gridTemplateRows: `repeat(${row}, 1fr)`,
        width: width,
        height: height,
        // height: "calc(var(--scale-factor) * 750)",
        // width: "calc(var(--scale-factor) * 375)",
        margin: "0px auto",
      }}
    >
      {children}
    </div>
  );
}

function GridAreaBlockOverlay({
  onDoubleClick,
  readonly,
}: {
  onDoubleClick?: () => void;
  readonly?: boolean;
}) {
  const [state, dispatch] = useGridState();

  const { movement, resize_anchor, is_resizing } = state;

  const bind = useGesture({
    onDoubleClick: onDoubleClick,
  });

  const onHandleDragStart = (anchor: "nw" | "ne" | "sw" | "se") => {
    dispatch({ type: "handle/dragstart", anchor });
  };

  const onHandleDrag = ({ movement }: { movement: [number, number] }) => {
    dispatch({ type: "handle/drag", movement: movement });
  };

  const onHandleDragEnd = () => {
    dispatch({ type: "handle/dragend" });
  };

  const { origin, delta } = is_resizing
    ? cvt_delta_by_resize_handle_origin(
        resize_anchor ?? "nw",
        is_resizing ? movement : [0, 0]
      )
    : {
        origin: [0, 0] as [number, number],
        delta: [0, 0] as [number, number],
      };

  const {
    diff: [dx, dy, dw, dh],
  } = resize(
    // box size doesn't matter since we are only interested in the delta
    [0, 0, 0, 0],
    delta,
    origin
  );

  return (
    <div
      {...bind()}
      style={{
        position: "absolute",
        width: `calc(100% + ${dw}px)`,
        height: `calc(100% + ${dh}px)`,
        transform: `translate(${dx}px, ${dy}px)`,
        border: "2px solid rgba(0, 0, 255, 1)",
      }}
    >
      {!readonly && (
        <>
          {/* <div className="absolute top-0 left-0">
            <ResizeHandle
              anchor="nw"
              onDragStart={() => onDragStart("nw")}
              onDrag={onDrag}
              onDragEnd={onDragEnd}
            />
          </div>
          <div className="absolute top-0 right-0">
            <ResizeHandle
              anchor="ne"
              onDragStart={() => onDragStart("ne")}
              onDrag={onDrag}
              onDragEnd={onDragEnd}
            />
          </div>
          <div className="absolute bottom-0 left-0">
            <ResizeHandle
              anchor="sw"
              onDragStart={() => onDragStart("sw")}
              onDrag={onDrag}
              onDragEnd={onDragEnd}
            />
          </div> */}
          <div className="absolute bottom-0 right-0">
            <ResizeHandle
              anchor="se"
              onDragStart={() => onHandleDragStart("se")}
              onDrag={onHandleDrag}
              onDragEnd={onHandleDragEnd}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ResizeHandle({
  onDragStart,
  onDrag,
  onDragEnd,
  anchor,
}: {
  anchor: "nw" | "ne" | "sw" | "se";
  onDragStart?: () => void;
  onDrag?: ({ movement }: { movement: [number, number] }) => void;
  onDragEnd?: () => void;
}) {
  const bind = useGesture(
    {
      onDragStart: ({ event }) => {
        // stop propagation to prevent the block drag - this is only required on start
        event.stopPropagation();
        onDragStart?.();
      },
      onDrag: onDrag,
      onDragEnd: onDragEnd,
    },
    {
      eventOptions: {
        capture: true,
      },
    }
  );

  return (
    <div
      style={{
        position: "relative",
        width: 0,
        height: 0,
      }}
    >
      <div
        {...bind()}
        style={{
          touchAction: "none",
          position: "absolute",
          width: "8px",
          height: "8px",
          transform: "translate(-50%, -50%)",
          boxSizing: "content-box",
          backgroundColor: "rgba(255, 255, 255, 1)",
          border: "2px solid rgba(0, 0, 255, 1)",
          cursor: resize_cursor_map[anchor],
        }}
      />
    </div>
  );
}

const resize_cursor_map = {
  nw: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  se: "nwse-resize",
  w: "ew-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
};

function GridAreaBlock({
  id,
  x,
  y,
  z,
  debug,
  children,
  onDoubleClick,
}: React.PropsWithChildren<{
  id: string;
  x: [number, number];
  y: [number, number];
  z?: number;
  debug?: boolean;
  onDoubleClick?: () => void;
}>) {
  const [state, dispatch] = useGridState();

  const gestureRef = useRef<HTMLDivElement>(null);
  useGesture(
    {
      onPointerEnter: () => {
        dispatch({ type: "block/pointerenter", id });
      },
      onPointerLeave: () => {
        dispatch({ type: "block/pointerleave" });
      },
      onPointerDown: () => {
        dispatch({ type: "block/pointerdown", id });
      },
      onDrag: ({ movement }) => {
        dispatch({ type: "block/drag", movement: movement });
      },
      onDragStart: () => {
        dispatch({ type: "block/dragstart", id });
      },
      onDragEnd: () => {
        dispatch({ type: "block/dragend" });
      },
    },
    {
      drag: {
        enabled: true,
      },
      eventOptions: {
        capture: true,
      },
      target: gestureRef,
    }
  );

  const { transform, listeners, attributes, setNodeRef, isDragging } =
    useDraggable({
      id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1 : 0,
  };

  const mergedRef = useMergedRef<HTMLDivElement>(gestureRef, setNodeRef);

  const selected = state.selection === id;
  const highlighted = state.highlight === id;

  return (
    <div
      {...listeners}
      {...attributes}
      ref={mergedRef}
      data-debug={debug}
      className="data-[debug='true']:bg-pink-300/20"
      style={{
        ...style,
        touchAction: "none",
        pointerEvents: "auto",
        gridArea:
          y[0] +
          1 +
          " / " +
          (x[0] + 1) +
          " / " +
          (y[1] + 2) +
          " / " +
          (x[1] + 2),
        zIndex: z,
        position: "relative",
        padding: "0px",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
        animate={{
          scale: isDragging ? 1.05 : 1,
        }}
      >
        <div
          style={{
            visibility: selected || highlighted ? "visible" : "hidden",
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1,
          }}
        >
          <GridAreaBlockOverlay
            onDoubleClick={onDoubleClick}
            readonly={!selected}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            overflow: "hidden",
          }}
        >
          {state.debug && (
            <div className="absolute top-0 left-0 bg-black text-white font-mono text-xs">
              {id}
              <br />x{x.join(",")} y{y.join(",")} z{z}
            </div>
          )}
          {children}
        </div>
      </motion.div>
    </div>
  );
}
