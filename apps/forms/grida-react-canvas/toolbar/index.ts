import type { CursorMode } from "../state";

export type ToolbarToolType =
  | "cursor"
  | "rectangle"
  | "ellipse"
  | "text"
  | "container"
  | "image"
  | "line"
  | "pencil"
  | "path";

export function cursormode_to_toolbar_value(cm: CursorMode): ToolbarToolType {
  switch (cm.type) {
    case "cursor":
      return "cursor";
    case "insert":
      return cm.node;
    case "draw":
      return cm.tool;
    case "path":
      return "path";
  }
}

export function toolbar_value_to_cursormode(tt: ToolbarToolType): CursorMode {
  switch (tt) {
    case "cursor":
      return { type: "cursor" };
    case "container":
    case "ellipse":
    case "image":
    case "rectangle":
    case "text":
      return { type: "insert", node: tt };
    case "line":
    case "pencil":
      return { type: "draw", tool: tt };
    case "path":
      return { type: "path" };
  }
}
