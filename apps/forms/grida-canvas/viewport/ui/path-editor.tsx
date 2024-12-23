import React from "react";
import { useEventTarget, useSurfacePathEditor } from "@/grida-canvas/provider";
import { useNodeSurfaceTransfrom } from "../hooks/transform";
import { cmath } from "@/grida-canvas/cmath";
import { useGesture } from "@use-gesture/react";
import { cn } from "@/utils";
import { svg } from "@/grida/svg";

export function SurfacePathEditor({ node_id }: { node_id: string }) {
  const { surface_cursor_position, cursor_mode, content_offset } =
    useEventTarget();
  const { offset, verticies, segments, selectedPoints, curve } =
    useSurfacePathEditor();
  const transform = useNodeSurfaceTransfrom(node_id);

  const origin_idx =
    selectedPoints.length === 1 ? selectedPoints[0] : undefined;
  const origin_is_last = origin_idx === verticies.length - 1;

  const lastseg = segments[segments.length - 1];

  // segments that are connected to the origin point
  const neighboring_segments = segments.filter((s) => {
    return s.a === origin_idx || s.b === origin_idx;
  });

  return (
    <div id="path-editor-surface" className="fixed left-0 top-0 w-0 h-0 z-10">
      <div
        style={{
          position: "absolute",
          ...transform,
          willChange: "transform",
          overflow: "visible",
          resize: "none",
          zIndex: 1,
        }}
      >
        {verticies.map(({ p }, i) => (
          <VertexPoint key={i} point={p} index={i} />
        ))}
      </div>
      {cursor_mode.type === "path" && typeof origin_idx === "number" && (
        <>
          {/* next segment */}
          <Extension
            a={cmath.vector2.add(
              offset,
              content_offset,
              verticies[origin_idx].p
            )}
            b={surface_cursor_position}
            ta={lastseg && cmath.vector2.invert(lastseg.tb)}
          />
        </>
      )}
      {neighboring_segments.map((s, i) => {
        const a = verticies[s.a].p;
        const b = verticies[s.b].p;
        const ta = s.ta;
        const tb = s.tb;

        const d = cmath.vector2.add(offset, content_offset);

        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: d[0],
                top: d[1],
              }}
            >
              <Extension a={a} b={cmath.vector2.add(a, ta)} />
              <Extension a={b} b={cmath.vector2.add(b, tb)} />
              {/* preview the next ta - cannot be edited */}
              {origin_is_last && (
                <Extension
                  a={b}
                  b={cmath.vector2.add(b, cmath.vector2.invert(tb))}
                />
              )}
            </div>
          </React.Fragment>
          // <React.Fragment key={i}>
          //   <Extension
          //     a={cmath.vector2.add(
          //       content_offset,
          //       offset,
          //       verticies[originidx].p
          //     )}
          //     b={cmath.vector2.add(
          //       //
          //       content_offset,
          //       offset,
          //       verticies[originidx].p,
          //       s.tb
          //     )}
          //   />
          //   <Extension
          //     a={cmath.vector2.add(
          //       content_offset,
          //       offset,
          //       verticies[originidx].p
          //     )}
          //     b={cmath.vector2.add(
          //       //
          //       content_offset,
          //       offset,
          //       verticies[originidx].p,
          //       cmath.vector2.invert(s.tb)
          //     )}
          //   />
          // </React.Fragment>
        );
      })}
    </div>
  );
}

function Extension({
  a,
  b,
  ta,
  tb,
}: {
  a: cmath.Vector2;
  b: cmath.Vector2;
  ta?: cmath.Vector2;
  tb?: cmath.Vector2;
}) {
  return (
    <>
      {/* cursor point */}
      <Point point={b} style={{ cursor: "crosshair" }} />
      <Curve a={a} b={b} ta={ta} tb={tb} />
    </>
  );
}

function CurveControlPoint({
  point,
  selected,
}: {
  point: cmath.Vector2;
  selected?: boolean;
}) {
  return (
    <Point
      // {...bind()}
      tabIndex={0}
      selected={selected}
      point={point}
    />
  );
}

function VertexPoint({
  point,
  index,
}: {
  point: cmath.Vector2;
  index: number;
}) {
  const editor = useSurfacePathEditor();
  const selected = editor.selectedPoints.includes(index);
  const bind = useGesture({
    onPointerDown: ({ event }) => {
      event.stopPropagation();
    },
    onDragStart: (state) => {
      const { event } = state;
      event.stopPropagation();
      editor.onPointDragStart(index);
    },
    onDrag: (state) => {
      const { movement, distance, delta, initial, xy, event } = state;
      event.stopPropagation();
      editor.onPointDrag({
        movement,
        distance,
        delta,
        initial,
        xy,
      });
    },
    onDragEnd: (state) => {
      const { event } = state;
      event.stopPropagation();
    },
    onKeyDown: (state) => {
      const { event } = state;

      if (event.key === "Delete" || event.key === "Backspace") {
        event.stopPropagation();
        event.preventDefault();
        editor.onPointDelete(index);
      }
    },
  });

  return (
    <Point {...bind()} tabIndex={index} selected={selected} point={point} />
  );
}

const Point = React.forwardRef(
  (
    {
      point,
      className,
      style,
      selected,
      size = 6,
      ...props
    }: React.HtmlHTMLAttributes<HTMLDivElement> & {
      point: cmath.Vector2;
      selected?: boolean;
      size?: number;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    return (
      <div
        ref={ref}
        {...props}
        data-selected={selected}
        className={cn(
          "rounded-full border border-workbench-accent-sky bg-background data-[selected='true']:shadow-sm data-[selected='true']:bg-workbench-accent-sky data-[selected='true']:border-spacing-1.5 data-[selected='true']:border-background",
          className
        )}
        style={{
          position: "absolute",
          left: point[0],
          top: point[1],
          width: size,
          height: size,
          transform: "translate(-50%, -50%)",
          cursor: "pointer",
          touchAction: "none",
          ...style,
        }}
      />
    );
  }
);

Point.displayName = "Point";

function Line({
  x1,
  y1,
  x2,
  y2,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  // Calculate the length and angle of the line
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  return (
    <div
      {...props}
      className={cn("bg-workbench-accent-sky", className)}
      style={{
        ...style,
        position: "absolute",
        left: `${x1}px`,
        top: `${y1}px`,
        width: `${length}px`,
        height: 1,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "0 50%", // Rotate around the left center
      }}
    />
  );
}

function Curve({
  a,
  b,
  ta = [0, 0],
  tb = [0, 0],
}: {
  a: cmath.Vector2;
  b: cmath.Vector2;
  ta?: cmath.Vector2;
  tb?: cmath.Vector2;
}) {
  //
  const offset = a;
  const _a = cmath.vector2.subtract(a, offset);
  const _b = cmath.vector2.subtract(b, offset);
  const path = svg.d.encode(svg.d.curve(_a, ta, tb, _b));

  return (
    <svg
      id="curve"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        left: offset[0],
        top: offset[1],
        overflow: "visible",
      }}
    >
      <path d={path} stroke={"skyblue"} fill="none" strokeWidth="2" />
    </svg>
  );
}
