import type { Tokens } from "@/ast";

export namespace grida {
  export namespace program {
    export namespace schema {
      /**
       * Transforms a JSON schema `IProperties` into a strongly-typed object where scalar types are properly mapped,
       * arrays are mapped to their corresponding array types, and other types (e.g., objects) are cast as `Record<string, unknown>`.
       *
       * @template T - The schema `IProperties` to transform into a type-safe object type.
       */
      export type TInferredPropTypes<
        T extends { [key: string]: PropertyDefinition },
      > = {
        [K in keyof T]: T[K] extends TypeScalarPropertyDefinition // Handle scalar types (string, number, boolean)
          ? T[K]["type"] extends "string"
            ? string
            : T[K]["type"] extends "number"
              ? number
              : T[K]["type"] extends "boolean"
                ? boolean
                : never
          : // Handle arrays
            T[K] extends TypeArrayPropertyDefinition<any[]>
            ? Array<any>
            : // Handle custom object types
              T[K] extends TypeObjectPropertyDefinition<any>
              ? { [key: string]: any }
              : // Handle well-known object types
                T[K] extends TypeWellKnownObjectPropertyDefinition
                ? T[K]["type"] extends keyof objects.ObjectTypeMap
                  ? objects.ObjectTypeMap[T[K]["type"]]
                  : unknown
                : // Fallback to unknown
                  unknown;
      };

      export type Value =
        | Tokens.NumericValueExpression
        | Tokens.StringValueExpression
        | Tokens.StringValueExpression[]
        | { [key: string]: Value };

      export type Properties = { [name: string]: schema.PropertyDefinition };

      export type Props = { [name: string]: Value };

      export type PropertyDefinition =
        | TypeScalarPropertyDefinition
        | TypeArrayPropertyDefinition<any[]>
        | TypeObjectPropertyDefinition<any>
        | TypeWellKnownObjectPropertyDefinition;

      interface TypeScalarPropertyDefinition {
        type: "string" | "number" | "boolean";
        default?:
          | Tokens.StringValueExpression
          | Tokens.NumericValueExpression
          | Tokens.BooleanValueExpression;
        required?: boolean;
        //
      }

      interface TypeArrayPropertyDefinition<T extends Array<Value>> {
        type: "array";
        items: PropertyDefinition;
        default?: T;
        required?: boolean;
        //
      }

      interface TypeObjectPropertyDefinition<T extends Record<string, Value>> {
        type: "object";
        properties: Record<string, PropertyDefinition>;
        default?: T;
        required?: boolean;
        //
      }

      interface TypeWellKnownObjectPropertyDefinition {
        type: objects.ObjectType;
        default?: objects.Object;
        required?: boolean;
        //
      }

      // useful when to decide clear the existing data when component / template changes.
      // if the property signature matches by the name and type (deeply), then the editor can deside to keep the existing user data.
      // function is_equal(a, b, keys){}
    }

    export namespace objects {
      export type ObjectType = Object["type"];
      export type ObjectTypeMap = {
        video: VideoSource;
        audio: AudioSource;
        image: ImageSource;
        youtube: YoutubeVideoSource;
        vimeo: VimeoVideoSource;
        facebook: FacebookVideoSource;
      };

      export type Object = Source | VideoPlayerSource;

      export type Source = ImageSource | VideoSource | AudioSource;

      export type VideoSource = {
        type: "video";
        src: string;
      };

      export type AudioSource = {
        type: "audio";
        src: string;
      };

      export type ImageSource = {
        type: "image";
        src: string;
      };

      export type VideoPlayerSource =
        | YoutubeVideoSource
        | VimeoVideoSource
        | FacebookVideoSource;

      export type YoutubeVideoSource = {
        type: "youtube";
        url: string;
      };

      export type VimeoVideoSource = {
        type: "vimeo";
        url: string;
      };

      export type FacebookVideoSource = {
        type: "facebook";
        url: string;
      };
    }

    export namespace document {
      export namespace k {
        /**
         * Key for the data attribute that stores the node ID in the HTML document.
         *
         * @see {@link INodeHtmlDocumentQueryDataAttributes}
         */
        export const HTML_ELEMET_DATA_ATTRIBUTE_GRIDA_NODE_ID_KEY =
          "data-grida-node-id";
      }

      /**
       * contains all nodes under this defined document in k:v pair
       *
       * @see {@link IDocumentDefinition}
       */
      export interface IDocumentNodesRepository {
        nodes: Record<string, nodes.Node>;
      }

      /**
       * Represents a normalized document structure where all nodes are stored in a flat map
       * with a single `root_id` as the entry point for traversal.
       *
       * @remarks
       * This structure is designed to improve efficiency and scalability by avoiding deep nesting.
       * Instead of storing child nodes within each parent node (deeply nested children), we store
       * all nodes in a flat `Record<string, Node>` and reference child nodes by their IDs. This
       * setup allows for constant-time access to nodes, simplifies updates, and enhances compatibility
       * with React's rendering model.
       *
       * ## Benefits of a Flat Structure over Nested Children:
       * 1. **Performance and Efficiency**:
       *    - **Constant-Time Lookup**: Storing nodes in a flat map (`nodes: Record<string, Node>`) allows
       *      for quick lookups by ID with `O(1)` access time, regardless of the document's complexity or depth.
       *    - **Simplified Updates**: With each node accessible directly by ID, modifications do not require
       *      traversing deeply nested structures, reducing the computational cost of updates.
       *
       * 2. **Compatibility with React**:
       *    - **Minimized Re-renders**: In React, deeply nested structures can trigger unnecessary re-renders
       *      across the component tree. A flat structure allows React components to request only the specific
       *      node data they need, which reduces re-renders and optimizes the virtual DOM diffing process.
       *    - **Memoization-Friendly**: By accessing nodes through IDs rather than deeply nested props,
       *      components can be memoized effectively, re-rendering only when the specific node data they depend on changes.
       *
       * 3. **Scalability and Flexibility**:
       *    - This normalized structure is easier to scale, allowing for flexible hierarchical changes (e.g., moving
       *      nodes, reordering) without requiring deep restructuring.
       *    - Maintaining a `root_id` as the document's starting point simplifies traversal, ensuring that
       *      complex documents can still be navigated in a straightforward manner.
       *
       * ## Querying Nodes Efficiently
       * - Developers should access nodes through the `nodes` map using their unique IDs, starting from `root_id`.
       * - Traversal operations (e.g., rendering the document tree) can begin from `root_id` and recursively fetch child nodes by referencing `children` arrays in each `Node`.
       * - If frequent queries are necessary (e.g., repeated lookups in deeply nested areas), consider memoizing the result of these queries or using selector functions.
       *
       * ## Using in React Efficiently
       * - **React Context**: To avoid prop drilling, consider placing the `nodes` map in a React Context, allowing deeply nested components to access nodes by ID without passing them as props.
       * - **Memoized Selectors**: Use `useMemo` or selector functions (e.g., with libraries like Reselect) to derive specific subtrees or frequently accessed nodes, avoiding redundant calculations on each render.
       * - **Component Memoization**: Use `React.memo` or `useMemo` on components accessing nodes by ID to limit re-renders. This way, only components with changing dependencies re-render.
       *
       * @example
       * ```typescript
       * // Basic structure example:
       * const document: NormalizedNodeDocument = {
       *   root_id: "1",
       *   nodes: {
       *     "1": { id: "1", type: "container", children: ["2", "3"] },
       *     "2": { id: "2", type: "text", children: [] },
       *     "3": { id: "3", type: "image", children: [] },
       *   }
       * };
       *
       * // Example query: Render a node and its children
       * function NodeComponent({ id }: { id: string }) {
       *   const node = document.nodes[id];
       *   return (
       *     <div>
       *       <p>{node.type}</p>
       *       {node.children.map((childId) => (
       *         <NodeComponent key={childId} id={childId} />
       *       ))}
       *     </div>
       *   );
       * }
       * ```
       */
      export interface IDocumentDefinition extends IDocumentNodesRepository {
        /**
         * root node id. must be defined in {@link IDocumentDefinition.nodes}
         */
        root_id: string;
      }

      export interface INodeHtmlDocumentQueryDataAttributes {
        [k.HTML_ELEMET_DATA_ATTRIBUTE_GRIDA_NODE_ID_KEY]: nodes.Node["id"];
        ["data-grida-node-type"]: nodes.Node["type"];
        // #region dev properties

        /**
         * Dev property - editor-selected
         *
         * if this node is a selected node withing current editor context, when editable
         *
         * this is not required to be set, but once configured to set, it is safe to build apon this attribute
         */
        ["data-dev-editor-selected"]?: boolean | undefined;

        /**
         * Dev property - editor-hovered
         *
         * if this node is a hovered node withing current editor context, when editable
         *
         * this is not required to be set, but once configured to set, it is safe to build apon this attribute
         */
        ["data-dev-editor-hovered"]?: boolean | undefined;
        // #endregion dev properties
      }

      /**
       * wraps node data with document query-able extra data.
       * this is essential when using html backend.
       *
       * grida canvas overlay will use these attributes to determine if the raycasted element is a valid node.
       */
      type INodeWithHtmlDocumentQueryDataAttributes<N extends nodes.Node> =
        INodeHtmlDocumentQueryDataAttributes & N;

      /**
       * final props that matches the react rendering signature
       */
      export type IComputedNodeReactRenderProps<N extends nodes.Node> =
        INodeWithHtmlDocumentQueryDataAttributes<N> & {
          style: React.CSSProperties;
          //
        };

      export namespace template {
        export interface IUserDefinedTemplateNodeReactComponentRenderProps<P>
          extends nodes.i.IBaseNode,
            nodes.i.ISceneNode,
            nodes.i.ICSSStylable,
            nodes.i.IExpandable {
          props: P;
        }

        export interface TemplateDocumentDefinition<
          P extends schema.Properties = schema.Properties,
        > extends IDocumentNodesRepository {
          /**
           * @deprecated - rename to template_id
           */
          name: string;
          version: string;
          type: "template";
          properties: P;
          default: Record<string, schema.Value>;
        }

        /**
         * Type for containing template instance's node changes data relative to master template definition
         *
         * {@link nodes.TemplateInstanceNode.overrides}
         */
        export type NodeChanges = Record<
          nodes.NodeID,
          Partial<nodes.Node> | undefined
        >;
      }
    }

    export namespace css {
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/CSS/length
       */
      export type Length =
        | number
        | {
            type: "length";
            /**
             * only supports the following units:
             * - px
             * - vw
             * - vh
             * - dvw
             * - dvh
             * - em
             * - rem
             */
            unit: "px" | "vw" | "vh" | "dvw" | "dvh" | "em" | "rem";
            value: number;
          };

      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/CSS/percentage
       */
      export type Percentage = {
        type: "percentage";
        value: number;
      };

      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/CSS/length-percentage
       */
      export type LengthPercentage = Length | Percentage;

      export type RGBA = { r: number; g: number; b: number; a: number };

      /**
       * CSS properties that is supported via the standard editor
       *
       * (when using html backend, other css properties can also be dynamically applied, but not guaranteed)
       *
       * Note: some prorperties must not be set directly, e.g. `opacity` as it is a valid property for both html backend and canvas backend, we handle this in a higher level.
       * When set explicitly, it will override the default behaviour, causing unexpected results.
       *
       * Common properties to avoid setting directly:
       * - `opacity`
       * - `z-index`
       * - `cursor`
       * - `position`
       * - `width`
       * - `height`
       * - `top`
       * - `left`
       * - `pointer-events`
       * - `border-radius`
       * - `fill`
       *
       *
       * @deprecated Note: Do not modify this directly - it will progressively be replaced by a more robust and universal CSS property type system.
       * If you wish to add a complex styled node, try using {@link document.template.TemplateDocumentDefinition}
       */
      export type ExplicitlySupportedCSSProperties = Pick<
        // TODO: Drop the React dependency and use css-types instead
        React.CSSProperties,
        // explicitly prohibited
        // - "opacity"
        // - "zIndex"
        // - "width"
        // - "height"
        // - "position"
        // - "left"
        // - "top"
        // - "right"
        // - "bottom"
        // - "cursor"
        // - "pointerEvents"
        // - "borderRadius"
        //
        // position & dimension
        // | 'width' | 'height' | 'minWidth' | 'minHeight' | 'maxWidth' | 'maxHeight' | 'position' | 'top' | 'right' | 'bottom' | 'left' | 'zIndex'
        // | "position"
        // | "width"
        // | "height"
        // | "top"
        // | "left"
        //
        | "fontWeight"
        | "fontFamily"
        | "fontSize"
        | "lineHeight"
        | "textAlign"
        | "textTransform"
        //
        | "boxShadow"
        //
        | "borderWidth"
        //
        | "margin"
        | "padding"
        //
        | "aspectRatio"
        //
        | "flexDirection"
        | "flexWrap"
        | "justifyContent"
        | "alignItems"
        | "gap"
        //
        | "cursor"
        | "userSelect"
        //
        | "objectFit"
        | "objectPosition"
      >;

      export function toReactCSSProperties(
        styles: nodes.i.ICSSStylable & Partial<nodes.i.IRectangleCorner>,
        config: {
          fill: "color" | "background" | "fill" | "none";
        }
      ): React.CSSProperties {
        const {
          position,
          top,
          left,
          bottom,
          right,
          width,
          height,
          zIndex,
          opacity,
          rotation,
          fill,
          cornerRadius: __,
          style,
        } = styles;
        const without_fill = {
          position: position,
          width: toDimension(width),
          height: toDimension(height),
          top: top,
          left: left,
          right: right,
          bottom: bottom,
          zIndex: zIndex,
          opacity: opacity,
          rotate: rotation ? `${rotation}deg` : undefined,
          ...style,
        } satisfies React.CSSProperties;

        switch (config.fill) {
          case "color":
            return {
              ...without_fill,
              color: fill ? toFillString(fill) : undefined,
            };
          case "background":
            return {
              ...without_fill,
              background: fill ? toFillString(fill) : undefined,
            };
          case "fill":
            return {
              ...without_fill,
              fill: fill ? toFillString(fill) : undefined,
            };
          case "none":
            return without_fill;
        }
      }

      export function toFillString(paint: cg.Paint): string {
        switch (paint.type) {
          case "solid":
            return toRGBAString(paint.color);
          case "linear_gradient":
            return toLinearGradientString(paint);
          case "radial_gradient":
            return toRadialGradientString(paint);
        }
      }

      export function toRGBAString(rgba: css.RGBA): string {
        return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
      }

      /**
       *
       * @example
       * `linear-gradient(to right, red, blue)`
       *
       * @param paint
       * @returns
       * @see https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient
       */
      export function toLinearGradientString(
        paint: Omit<cg.LinearGradientPaint, "id">
      ): string {
        const { stops } = paint;

        const gradientStops = stops
          .map((stop) => {
            return `${toRGBAString(stop.color)} ${stop.offset * 100}%`;
          })
          .join(", ");

        return `linear-gradient(${gradientStops})`;
      }

      /**
       *
       * @example
       * `radial-gradient(circle, red, blue)`
       *
       * @param paint
       * @returns
       * @see https://developer.mozilla.org/en-US/docs/Web/CSS/radial-gradient
       */
      export function toRadialGradientString(
        paint: Omit<cg.RadialGradientPaint, "id">
      ): string {
        const { stops } = paint;

        const gradientStops = stops
          .map((stop) => {
            return `${toRGBAString(stop.color)} ${stop.offset * 100}%`;
          })
          .join(", ");

        return `radial-gradient(${gradientStops})`;
      }

      export function toDimension(
        value: css.LengthPercentage | "auto"
      ): string {
        if (value === "auto") return "auto";
        if (typeof value === "number") {
          return `${value}px`;
        } else {
          switch (value.type) {
            case "length": {
              return `${value.value}${value.unit}`;
            }
            case "percentage": {
              return `${value.value}%`;
            }
          }
        }
      }

      /**
       *
       * @param color
       * @returns hex color string without the leading `#`
       * @example `rgba_to_hex({ r: 255, g: 255, b: 255, a: 1 })` returns `"ffffff"`
       *
       */
      export function rgbaToHex(color: grida.program.css.RGBA): string {
        return `${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
      }
    }

    /**
     * Core Graphics
     */
    export namespace cg {
      export type Paint =
        | SolidPaint
        | LinearGradientPaint
        | RadialGradientPaint;

      export type PaintWithoutID =
        | SolidPaint
        | Omit<LinearGradientPaint, "id">
        | Omit<RadialGradientPaint, "id">;

      export type SolidPaint = {
        type: "solid";
        color: css.RGBA;
      };

      export type LinearGradientPaint = {
        type: "linear_gradient";
        id: string;
        // transform: unknown;
        stops: Array<GradientStop>;
      };

      export type RadialGradientPaint = {
        type: "radial_gradient";
        id: string;
        // transform: unknown;
        stops: Array<GradientStop>;
      };

      export type GradientStop = {
        /**
         * 0-1
         * 0 - start (0%)
         * 1 - end (100%)
         */
        offset: number;
        color: css.RGBA;
      };
      //
      //

      export type FilterEffects = FeDropShadow | FeGaussianBlur;

      /**
       *
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDropShadow
       */
      export type FeDropShadow = {
        type: "drop_shadow";

        /**
         * offset-x
         */
        dx: number;

        /**
         * offset-y
         */
        dy: number;

        /**
         * blur radius
         *
         * a.k.a. stdDeviation in SVG <feDropShadow>
         */
        blur: number;
        //
      };

      export type FeGaussianBlur = {
        type: "blur";

        /**
         * blur radius
         *
         * a.k.a. stdDeviation in SVG <feGaussianBlur>
         */
        radius: number;
      };
    }

    export namespace nodes {
      export type NodeID = string;
      export type Node =
        | TextNode
        | ImageNode
        | ContainerNode
        | SvgNode
        | RectangleNode
        | EllipseNode
        | InstanceNode
        | TemplateInstanceNode;

      /**
       * Any node utility type - use within the correct context
       */
      export type AnyNode = Omit<
        Partial<TextNode> &
          Partial<SvgNode> &
          Partial<RectangleNode> &
          Partial<ImageNode> &
          Partial<ContainerNode> &
          Partial<InstanceNode> &
          Partial<TemplateInstanceNode>,
        "type"
      > & {
        readonly type: Node["type"];
      } & i.IBaseNode &
        i.ISceneNode &
        i.ICSSStylable;

      export namespace i {
        export interface IBaseNode {
          readonly id: NodeID;
          name: string;
        }

        export interface ISceneNode {
          /**
           * whether this node is active within the editor context
           *
           * when active is false, its content will not be included in the runtime tree
           *
           * its exact behaviour varies by the environment
           *
           * @default true
           * @example when false, display:none or not included in the tree
           */
          active: boolean;

          /**
           * whether this node is locked
           *
           * when the node is locked, on editor environment, the node cannot be selected or edited via viewport
           *
           * on production environment, this property is ignored
           *
           * @default false
           * @example when true, pointer-events:none
           */
          locked: boolean;
        }

        export interface IOpacity {
          /**
           * opacity of the node.
           *
           * Env:
           * - on html backend, this value is passed the the style `opacity` property
           * - on canvas backend, this value is passed to the `opacity` property of the node
           *
           * @default 1
           */
          opacity: number;
        }

        export interface IZIndex {
          /**
           * z-index of the node.
           *
           *
           * Env:
           * - on html backend, this value is passed the the style `z-index` property
           * - on canvas backend, this value is used to determine the depth / z buffer
           *
           * Terms - Also knwon as:
           * - Sorting Order
           * - Depth
           * - Z Buffer
           * - Order in Layer
           *
           * @default 0
           * @type {number} integer
           */
          zIndex: number;
        }

        /**
         * Node that can be expanded in hierarchy
         */
        export interface IExpandable {
          expanded: boolean;
        }

        /**
         * Node that can be exported
         *
         * @deprecated - not ready - do not use in production
         */
        export interface IExportable {}

        /**
         * Rectangle Corner
         */
        export interface IRectangleCorner {
          cornerRadius:
            | number
            | {
                topLeftRadius: number;
                topRightRadius: number;
                bottomLeftRadius: number;
                bottomRightRadius: number;
              };
        }

        export interface IChildren {
          children?: NodeID[];
        }

        /**
         * Node that can be filled with color - such as rectangle, ellipse, etc.
         */
        export interface IFill {
          fill?: cg.Paint;
        }

        /**
         * Node that supports stroke with color - such as rectangle, ellipse, etc.
         *
         * - [Env:HTML] for html text, `-webkit-text-stroke` will be used
         */
        export interface IStroke {
          stroke: css.RGBA;
        }

        export interface IEffects {
          //
          effects: Array<cg.FilterEffects>;
        }

        export interface IStylable<S extends Record<string, unknown>> {
          style: S;
        }

        export interface ICSSStylable
          extends IStylable<css.ExplicitlySupportedCSSProperties>,
            IPositioning,
            ICSSDimension,
            IFill,
            IOpacity,
            IRotation,
            IZIndex {
          style: css.ExplicitlySupportedCSSProperties;
        }

        export interface IHrefable {
          href?: string;
          target?: "_self" | "_blank" | undefined;
        }

        /**
         * does not represent any specific rule or logic, just a data structure, depends on the context
         */
        export interface IFixedDimension {
          width: number;
          height: number;
        }

        export interface ICSSDimension {
          width: css.LengthPercentage | "auto";
          height: css.LengthPercentage | "auto";
        }

        /**
         * Relative DOM Positioning model
         *
         * by default, use position: relative, left: 0, top: 0 - to avoid unexpected layout issues
         */
        export interface IPositioning {
          position: "absolute" | "relative";
          left?: number | undefined;
          top?: number | undefined;
          right?: number | undefined;
          bottom?: number | undefined;
          // x: number;
          // y: number;
        }

        /**
         * specifies node's x rotation in degrees
         *
         * @default 0
         */
        export interface IRotation {
          rotation?: number;
        }

        export interface ITextValue {
          /**
           * text value
           *
           * - expression - {@link Tokens.StringValueExpression} - computed or literal
           *   - literal - e.g. `"A text value"`
           *   - property access - {@link Tokens.PropertyAccessExpression} - computed, , e.g. `userdata.title`
           *   - identifier - {@link Tokens.Identifier} - computed, e.g. `title`
           *   - others - all {@link Tokens.StringValueExpression} types
           *
           * when used under a component / instance / template, the `props.` expression is reserved and refers to adjacent parent's props.
           * - by the standard implementation, the `props.[x]` is recommended to be referenced only once in a single node.
           * - by the standard implementation, within the visual editor context, when user attempts to updates the literal value (where it is a `props.[x]` and `props.[x] is literal`), it should actually update the `props.[x]` value, not this `text` literal value.
           */
          text: Tokens.StringValueExpression | null;
        }

        export interface IProperties {
          properties: Record<string, schema.PropertyDefinition>;
        }

        export interface IProps {
          /**
           * props data
           *
           * expression that will be passed to this instance
           *
           * it should match the signature with defined properties
           */
          props: Record<string, schema.Value>;
        }
      }

      /**
       * @deprecated - not ready - do not use in production
       */
      export interface GroupNode
        extends i.IBaseNode,
          i.ISceneNode,
          i.IChildren,
          i.IExpandable {
        //
      }

      export interface TextNode
        extends i.IBaseNode,
          i.ISceneNode,
          i.ICSSStylable,
          i.IHrefable,
          i.ITextValue {
        readonly type: "text";
        // textAutoResize: "none" | "width" | "height" | "auto";
      }

      export interface ImageNode
        extends i.IBaseNode,
          i.ISceneNode,
          i.ICSSStylable,
          i.IHrefable {
        readonly type: "image";
        /**
         * required - when falsy, the image will not be rendered
         */
        src?: Tokens.StringValueExpression;
        alt?: string;
      }

      export interface ContainerNode
        extends i.IBaseNode,
          i.ISceneNode,
          i.ICSSStylable,
          i.IHrefable,
          i.IExpandable,
          i.IChildren {
        readonly type: "container";
        //
      }

      /**
       * @deprecated - not ready - do not use in production
       */
      export interface SvgNode
        extends i.IBaseNode,
          i.ISceneNode,
          i.ICSSStylable,
          i.IHrefable {
        type: "svg";
        svg: string;
      }

      /**
       * Rect Node
       *
       * - [Env:HTML/SVG] on svg rendering, this will be rendered as `<rect>` with `x`, `y`, `width`, `height` attributes with unified corner radius.
       * - [Env:HTML/SVG] on svg rendering, this will be rendered as `<path>` with `d` attribute with individual rounded corner path.
       *
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect}
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path}
       * @see {@link https://api.skia.org/classSkRRect.html}
       * @see {@link https://www.figma.com/plugin-docs/api/RectangleNode/}
       *
       */
      export interface RectangleNode
        extends i.IBaseNode,
          i.ISceneNode,
          i.IHrefable,
          i.IPositioning,
          // i.ICSSDimension,
          i.IFixedDimension,
          i.IOpacity,
          i.IZIndex,
          i.IFill,
          i.IEffects,
          i.IRectangleCorner {
        type: "rectangle";
      }

      /**
       * Ellipse Node
       *
       * - For Drawing Arc, use ArcNode
       * - [Env:SVG] on svg rendering, this will be rendered as `<ellipse>` with `cx`, `cy`, `rx`, `ry` attributes calculated from the `width`, `height` and `x`, `y` properties.
       */
      export interface EllipseNode
        extends i.IBaseNode,
          i.ISceneNode,
          i.IHrefable,
          i.IPositioning,
          // i.ICSSDimension,
          i.IFixedDimension,
          i.IOpacity,
          i.IZIndex,
          i.IFill,
          i.IEffects {
        type: "ellipse";
      }

      export interface InstanceNode
        extends i.IBaseNode,
          i.ISceneNode,
          i.IPositioning,
          // i.ICSSStylable,
          i.IHrefable,
          i.IProperties,
          i.IProps {
        readonly type: "instance";
        /**
         * ID of component that this instance came from, refers to components table
         */
        component_id: NodeID;
      }

      /**
       * [Template Instance Node] Template node is a static, hand crafted template that does not have a intrinsic tree, only a root properties [data] and [overrides] to each customizable node
       *
       * Template Node cannot be used as a child node.
       *
       * This is useful when you have a complex structure with custom loggics and state management, use this node and expose only customizable nodes and properties.
       */
      export interface TemplateInstanceNode
        extends i.IBaseNode,
          i.IHrefable,
          i.ISceneNode,
          i.IProperties,
          i.IProps {
        readonly type: "template_instance";

        /**
         * ID of template definition that this instance came from, refers to user defined templates table
         */
        template_id: string;

        /**
         * template definition exposed child node overrides
         */
        overrides: document.template.NodeChanges;
      }

      /**
       * calling this does not actually contribute to the rendering by itself, it creates a {@link TemplateInstanceNode} data.
       */
      export function createTemplateInstanceNodeFromTemplateDefinition(
        id: string,
        def: document.template.TemplateDocumentDefinition,
        seed?: Partial<Omit<TemplateInstanceNode, "id">>
      ): TemplateInstanceNode {
        const { nodes, properties } = def;

        return {
          id,
          name: def.name,
          type: "template_instance",
          active: true,
          locked: false,
          properties,
          props: {},
          overrides: cloneWithUndefinedValues(nodes),
          template_id: def.name,
          ...seed,
        };
        //
      }
    }
  }
}

const cloneWithUndefinedValues = (
  obj: Record<string, any>
): Record<string, undefined> =>
  Object.fromEntries(Object.keys(obj).map((key) => [key, undefined])) as Record<
    string,
    undefined
  >;
