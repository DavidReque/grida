import { ComponentWidget } from "./component";
import { ContainerWidget } from "./container";
import { FlexWidget } from "./flex";
import { GridWidget } from "./grid";
import { IconWidget } from "./icon";
import { LayerkWidget } from "./layer";
import { LayoutWidget } from "./layout";
import { LinkWidget } from "./link";
import { RichTextWidget } from "./richtext";
import { VectorWidget } from "./vector";
import { TextWidget } from "./text";
import { ThemeWidget } from "./theme";
import { ImageWidget } from "./image";
import { RectangleWidget } from "./rectangle";
import { EllipseWidget } from "./ellipse";
import { SVGLineWidget } from "./line";
export namespace TemplateBuilderWidgets {
  export const container = ContainerWidget;
  export const component = ContainerWidget; // TODO:
  // export const Component = ComponentWidget;
  export const flex = FlexWidget;
  // export const Grid = GridWidget;
  export const icon = IconWidget;
  // export const Layer = LayerkWidget;
  export const Layout = LayoutWidget;
  // export const Link = LinkWidget;
  // export const RichText = RichTextWidget;
  export const vector = VectorWidget;
  export const line = SVGLineWidget;
  export const rectangle = RectangleWidget;
  export const ellipse = EllipseWidget;
  export const text = TextWidget;
  export const image = ImageWidget;
  // export const Theme = ThemeWidget;
}
