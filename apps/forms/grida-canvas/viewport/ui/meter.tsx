import { cmath } from "@/grida-canvas/math";
import React from "react";
// import type { Rectangle } from "../types";
// import * as k from "./k";

const font_size = 10;

export function SizeMeterLabel({
  size,
  margin = 0,
  rect,
  zoom,
}: {
  size: { width: number; height: number };
  margin?: number;
} & {
  rect: cmath.Rectangle;
  zoom: number;
}) {
  const { x, y, width, height } = rect;
  const bottomY = y + height;
  const centerX = x + width / 2;

  const text = `${+size.width.toFixed(2)} x ${+size.height.toFixed(2)}`;

  return (
    <MeterLabel
      label={text}
      background={"rgb(0, 87, 255)"}
      x={centerX}
      y={bottomY}
      anchor="s"
      margin={margin}
      zoom={zoom}
      zIndex={5}
    />
  );
}

export function MeterLabel({
  x,
  y,
  background,
  label,
  anchor,
  zoom,
  margin = 0,
  zIndex = 5,
  weight = 500,
}: {
  x: number;
  y: number;
  weight?: React.CSSProperties["fontWeight"];
  background?: React.CSSProperties["background"];
  label: string;
  anchor: "w" | "n" | "s" | "e";
  margin?: number;
  zoom: number;
  zIndex?: number;
}) {
  const labelWidth = (label.length * font_size) / 1.8; // Estimate text width
  const viewWidth = labelWidth + 4; // 4 is for horizontal padding
  const viewHeight = font_size + 4; // 4 is for vertical padding

  let t: [number, number] = [0, 0];
  switch (anchor) {
    case "s": {
      t = [x * zoom - viewWidth / 2, y * zoom + margin];
      break;
    }
    case "n": {
      t = [x * zoom - viewWidth / 2, y * zoom - margin - viewHeight];
      break;
    }
    case "e": {
      t = [x * zoom + margin, y * zoom - viewHeight / 2];
      break;
    }
    case "w": {
      t = [x * zoom - margin - viewWidth, y * zoom - viewHeight / 2];
      break;
    }
  }

  const [tx, ty] = t;

  return (
    <div
      id="size-meter"
      style={{
        minWidth: viewWidth,
        position: "absolute",
        pointerEvents: "none",
        transform: `translate3d(${tx}px, ${ty}px, 0)`,
        willChange: "transform, opacity",
        boxSizing: "border-box",
        whiteSpace: "nowrap",
        borderRadius: 4,
        background: background,
        padding: "2px 4px",
        color: "white",
        fontSize: font_size,
        fontFamily: "Inter, sans-serif",
        fontWeight: weight,
        textAlign: "center",
        zIndex: zIndex,
      }}
    >
      {label}
    </div>
  );
}
