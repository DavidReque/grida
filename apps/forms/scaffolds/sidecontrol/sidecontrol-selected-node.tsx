"use client";

import React from "react";

import {
  SidebarMenuSectionContent,
  SidebarSection,
  SidebarSectionHeaderItem,
  SidebarSectionHeaderLabel,
} from "@/components/sidebar";

import { TextAlignControl } from "./controls/text-align";
import { FontSizeControl } from "./controls/font-size";
import { FontWeightControl } from "./controls/font-weight";
import { SwitchControl } from "./controls/switch";
import { OpacityControl } from "./controls/opacity";
import { HrefControl } from "./controls/href";
import { CornerRadiusControl } from "./controls/corner-radius";
import { BorderControl } from "./controls/border";
import { FillControl } from "./controls/fill";
import { StringValueControl } from "./controls/string-value";
import { PaddingControl } from "./controls/padding";
import { BoxShadowControl } from "./controls/box-shadow";
import { GapControl } from "./controls/gap";
import { CrossAxisAlignmentControl } from "./controls/cross-axis-alignment";
import { MainAxisAlignmentControl } from "./controls/main-axis-alignment";
import { TemplateControl } from "./controls/template";
import { CursorControl } from "./controls/cursor";
import { PropertyLine, PropertyLineLabel } from "./ui";
import { SrcControl } from "./controls/src";
import { BoxFitControl } from "./controls/box-fit";
import { PropsControl } from "./controls/props";
import { TargetBlankControl } from "./controls/target";
import { ExportNodeControl } from "./controls/export";
import { FontFamilyControl } from "./controls/font-family";
import {
  PositioningConstraintsControl,
  PositioningModeControl,
} from "./controls/positioning";
import { RotateControl } from "./controls/rotate";
import { TextAlignVerticalControl } from "./controls/text-align-vertical";
import { LetterSpacingControl } from "./controls/letter-spacing";
import { LineHeightControl } from "./controls/line-height";
import { NameControl } from "./controls/name";
import { UserDataControl } from "./controls/x-userdata";
import { LengthControl } from "./controls/length";
import { LayoutControl } from "./controls/layout";
import { AxisControl } from "./controls/axis";
import { MaxlengthControl } from "./controls/maxlength";
import { useComputedNode, useDocument, useNode } from "@/grida-canvas";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { supports } from "@/grida/utils/supports";
import { StrokeWidthControl } from "./controls/stroke-width";
import { PaintControl } from "./controls/paint";
import { StrokeCapControl } from "./controls/stroke-cap";
import { grida } from "@/grida";
import assert from "assert";
import { useNodeAction } from "@/grida-canvas/provider";

export function SelectedNodeProperties() {
  const { state: document } = useDocument();

  // - color - variables
  const {
    selection,
    document: { root_id },
  } = document;

  assert(selection.length === 1);
  const node_id = selection[0];
  const actions = useNodeAction(node_id)!;

  const node = useNode(node_id);
  const root = useNode(root_id);
  const computed = useComputedNode(node_id);
  const {
    id,
    name,
    active,
    locked,
    component_id,
    style,
    type,
    properties,
    opacity,
    cornerRadius,
    rotation,
    fill,
    stroke,
    strokeWidth,
    strokeCap,
    position,
    width,
    height,
    left,
    top,
    right,
    bottom,
    fit,
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    letterSpacing,
    textAlign,
    textAlignVertical,
    maxLength,

    //
    border,
    //
    padding,

    //
    layout,
    direction,
    mainAxisAlignment,
    crossAxisAlignment,
    mainAxisGap,
    crossAxisGap,

    // x
    userdata,
  } = node;

  const { properties: root_properties } = root;

  // const istemplate = type?.startsWith("templates/");
  const is_instance = type === "instance";
  const is_templateinstance = type === "template_instance";
  const is_text = type === "text";
  const is_image = type === "image";
  const is_container = type === "container";
  const is_root = node_id === root_id;
  const is_flex_container = is_container && layout === "flex";
  const is_stylable = type !== "template_instance";

  const {
    //
    boxShadow,
    //
    // margin,
    // padding,
    //
    // aspectRatio,
    //
    // flexWrap,
    // gap,
    //
    cursor,
    //
    //
  } = {
    // ...selected_node_default_style,
    ...(style || {}),
  } satisfies grida.program.css.ExplicitlySupportedCSSProperties;

  return (
    <div key={node_id} className="mt-4 mb-10">
      {/* {process.env.NODE_ENV === "development" && (
        <SidebarSection className="border-b pb-4">
          <SidebarSectionHeaderItem>
            <SidebarSectionHeaderLabel>Debug</SidebarSectionHeaderLabel>
          </SidebarSectionHeaderItem>
          <DebugControls />
        </SidebarSection>
      )} */}
      {/* <SidebarSection className="border-b">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel className="w-full flex justify-between items-center">
            <div>
              <div className="capitalize">{type}</div>
              <br />
              <small className="font-mono">{id}</small>
            </div>
          </SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
      </SidebarSection> */}
      <SidebarSection className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>
            Layer
            <small className="ms-2 font-mono">{id}</small>
          </SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine className="items-center">
            <PropertyLineLabel>Name</PropertyLineLabel>
            <NameControl value={name} onValueChange={actions.name} />
          </PropertyLine>
          <PropertyLine className="items-center">
            <PropertyLineLabel>Active</PropertyLineLabel>
            <SwitchControl value={active} onValueChange={actions.active} />
          </PropertyLine>
          <PropertyLine className="items-center">
            <PropertyLineLabel>
              <LockClosedIcon />
            </PropertyLineLabel>
            <SwitchControl value={locked} onValueChange={actions.locked} />
          </PropertyLine>
        </SidebarMenuSectionContent>
      </SidebarSection>
      <SidebarSection hidden={is_root} className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Position</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine>
            <PositioningConstraintsControl
              value={{
                position,
                top,
                left,
                right,
                bottom,
              }}
              onValueChange={actions.positioning}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Mode</PropertyLineLabel>
            <PositioningModeControl
              value={position}
              //
              onValueChange={actions.positioningMode}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Rotate</PropertyLineLabel>
            <RotateControl value={rotation} onValueChange={actions.rotation} />
          </PropertyLine>
        </SidebarMenuSectionContent>
      </SidebarSection>
      <SidebarSection className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Size</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine>
            <PropertyLineLabel>Width</PropertyLineLabel>
            <LengthControl value={width} onValueChange={actions.width} />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Height</PropertyLineLabel>
            <LengthControl value={height} onValueChange={actions.height} />
          </PropertyLine>
        </SidebarMenuSectionContent>
      </SidebarSection>
      <SidebarSection className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Link</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine>
            <PropertyLineLabel>Link To</PropertyLineLabel>
            <HrefControl value={node.href} onValueChange={actions.href} />
          </PropertyLine>
          {node.href && (
            <PropertyLine>
              <PropertyLineLabel>New Tab</PropertyLineLabel>
              <TargetBlankControl
                value={node.target}
                onValueChange={actions.target}
              />
            </PropertyLine>
          )}
        </SidebarMenuSectionContent>
      </SidebarSection>
      <SidebarSection hidden={!is_templateinstance} className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Template</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent>
          <TemplateControl
            value={component_id}
            onValueChange={actions.component}
          />
        </SidebarMenuSectionContent>
      </SidebarSection>
      <SidebarSection hidden={!is_templateinstance} className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Props</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>

        {properties && (
          <SidebarMenuSectionContent className="space-y-2">
            <PropsControl
              properties={properties}
              props={computed.props || {}}
              onValueChange={actions.value}
            />
          </SidebarMenuSectionContent>
        )}
      </SidebarSection>

      <SidebarSection hidden={!is_text} className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Text</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine>
            <PropertyLineLabel>Value</PropertyLineLabel>
            <StringValueControl
              value={node.text}
              maxlength={maxLength}
              onValueChange={actions.text}
              schema={
                root_properties
                  ? {
                      properties: root_properties,
                    }
                  : undefined
              }
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Font</PropertyLineLabel>
            <FontFamilyControl
              value={fontFamily as any}
              onValueChange={actions.fontFamily}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Weight</PropertyLineLabel>
            <FontWeightControl
              value={fontWeight as any}
              onValueChange={actions.fontWeight}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Size</PropertyLineLabel>
            <FontSizeControl
              value={fontSize as any}
              onValueChange={actions.fontSize}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Line</PropertyLineLabel>
            <LineHeightControl
              value={lineHeight as any}
              onValueChange={actions.lineHeight}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Letter</PropertyLineLabel>
            <LetterSpacingControl
              value={letterSpacing as any}
              onValueChange={actions.letterSpacing}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Align</PropertyLineLabel>
            <TextAlignControl
              value={textAlign}
              onValueChange={actions.textAlign}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel></PropertyLineLabel>
            <TextAlignVerticalControl
              value={textAlignVertical}
              onValueChange={actions.textAlignVertical}
            />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Max Length</PropertyLineLabel>
            <MaxlengthControl
              value={maxLength}
              placeholder={(computed.text as any as string)?.length?.toString()}
              onValueChange={actions.maxLength}
            />
          </PropertyLine>
        </SidebarMenuSectionContent>
      </SidebarSection>
      <SidebarSection hidden={!is_image} className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Image</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine>
            <PropertyLineLabel>Source</PropertyLineLabel>
            <SrcControl value={node.src} onValueChange={actions.src} />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Fit</PropertyLineLabel>
            <BoxFitControl value={fit} onValueChange={actions.fit} />
          </PropertyLine>
        </SidebarMenuSectionContent>
      </SidebarSection>
      {is_container && (
        <SidebarSection className="border-b pb-4">
          <SidebarSectionHeaderItem>
            <SidebarSectionHeaderLabel>Layout</SidebarSectionHeaderLabel>
          </SidebarSectionHeaderItem>
          <SidebarMenuSectionContent className="space-y-2">
            <PropertyLine>
              <PropertyLineLabel>Type</PropertyLineLabel>
              <LayoutControl value={layout!} onValueChange={actions.layout} />
            </PropertyLine>
            <PropertyLine hidden={!is_flex_container}>
              <PropertyLineLabel>Direction</PropertyLineLabel>
              <AxisControl
                value={direction!}
                onValueChange={actions.direction}
              />
            </PropertyLine>
            {/* <PropertyLine>
              <PropertyLineLabel>Wrap</PropertyLineLabel>
              <FlexWrapControl
                value={flexWrap as any}
                onValueChange={actions.flexWrap}
              />
            </PropertyLine> */}
            <PropertyLine hidden={!is_flex_container}>
              <PropertyLineLabel>Distribute</PropertyLineLabel>
              <MainAxisAlignmentControl
                value={mainAxisAlignment!}
                onValueChange={actions.mainAxisAlignment}
              />
            </PropertyLine>
            <PropertyLine hidden={!is_flex_container}>
              <PropertyLineLabel>Align</PropertyLineLabel>
              <CrossAxisAlignmentControl
                value={crossAxisAlignment!}
                direction={direction}
                onValueChange={actions.crossAxisAlignment}
              />
            </PropertyLine>
            <PropertyLine hidden={!is_flex_container}>
              <PropertyLineLabel>Gap</PropertyLineLabel>
              <GapControl
                value={{
                  mainAxisGap: mainAxisGap!,
                  crossAxisGap: crossAxisGap!,
                }}
                onValueChange={actions.gap}
              />
            </PropertyLine>
            {/* <PropertyLine hidden={!is_flex_container}>
              <PropertyLineLabel>Margin</PropertyLineLabel>
              <MarginControl
                value={margin as any}
                onValueChange={actions.margin}
              />
            </PropertyLine> */}
            <PropertyLine hidden={!is_flex_container}>
              <PropertyLineLabel>Padding</PropertyLineLabel>
              <PaddingControl
                value={padding!}
                onValueChange={actions.padding}
              />
            </PropertyLine>
          </SidebarMenuSectionContent>
        </SidebarSection>
      )}
      <SidebarSection hidden={!is_stylable} className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Styles</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine>
            <PropertyLineLabel>Opacity</PropertyLineLabel>
            <OpacityControl
              value={opacity as any}
              onValueChange={actions.opacity}
            />
          </PropertyLine>
          {supports.cornerRadius(node.type) && (
            <PropertyLine>
              <PropertyLineLabel>Radius</PropertyLineLabel>
              <CornerRadiusControl
                value={cornerRadius}
                onValueChange={actions.cornerRadius}
              />
            </PropertyLine>
          )}
          {supports.border(node.type) && (
            <PropertyLine>
              <PropertyLineLabel>Border</PropertyLineLabel>
              <BorderControl value={border} onValueChange={actions.border} />
            </PropertyLine>
          )}
          <PropertyLine>
            <PropertyLineLabel>Fill</PropertyLineLabel>
            <FillControl value={fill} onValueChange={actions.fill} />
          </PropertyLine>
          <PropertyLine>
            <PropertyLineLabel>Shadow</PropertyLineLabel>
            <BoxShadowControl
              value={{ boxShadow }}
              onValueChange={actions.boxShadow}
            />
          </PropertyLine>
          {/* <PropertyLine>
            <PropertyLineLabel>Ratio</PropertyLineLabel>
            <AspectRatioControl
              value={aspectRatio as any}
              onValueChange={actions.aspectRatio}
            />
          </PropertyLine> */}
          <PropertyLine>
            <PropertyLineLabel>Cursor</PropertyLineLabel>
            <CursorControl value={cursor} onValueChange={actions.cursor} />
          </PropertyLine>
        </SidebarMenuSectionContent>
      </SidebarSection>
      {supports.stroke(node.type) && (
        <SidebarSection className="border-b pb-4">
          <SidebarSectionHeaderItem>
            <SidebarSectionHeaderLabel>Stroke</SidebarSectionHeaderLabel>
          </SidebarSectionHeaderItem>
          <SidebarMenuSectionContent className="space-y-2">
            <PropertyLine>
              <PropertyLineLabel>Color</PropertyLineLabel>
              <PaintControl value={stroke} onValueChange={actions.stroke} />
            </PropertyLine>
            <PropertyLine>
              <PropertyLineLabel>Width</PropertyLineLabel>
              <StrokeWidthControl
                value={strokeWidth}
                onValueChange={actions.strokeWidth}
              />
            </PropertyLine>
            <PropertyLine hidden={!supports.strokeCap(node.type)}>
              <PropertyLineLabel>Cap</PropertyLineLabel>
              <StrokeCapControl
                value={strokeCap}
                onValueChange={actions.strokeCap}
              />
            </PropertyLine>
          </SidebarMenuSectionContent>
        </SidebarSection>
      )}

      <SidebarSection className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Developer</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine>
            <UserDataControl
              node_id={id}
              value={userdata}
              onValueCommit={actions.userdata}
            />
          </PropertyLine>
        </SidebarMenuSectionContent>
      </SidebarSection>
      <SidebarSection className="border-b pb-4">
        <SidebarSectionHeaderItem>
          <SidebarSectionHeaderLabel>Export</SidebarSectionHeaderLabel>
        </SidebarSectionHeaderItem>
        <SidebarMenuSectionContent className="space-y-2">
          <PropertyLine>
            <ExportNodeControl node_id={id} name={name} />
          </PropertyLine>
        </SidebarMenuSectionContent>
      </SidebarSection>
    </div>
  );
}
