import { WorkbenchUI } from "@/components/workbench";
import { RGBAChip } from "./utils/paint-chip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils";
import { ColorPicker } from "./color-picker";
import { css } from "@/grida/css";
import HexValueInput from "./utils/hex";

type RGBA = { r: number; g: number; b: number; a: number };

export type RGBAColorControlProps = {
  value: RGBA;
  onValueChange: (value: RGBA) => void;
};

export function RGBAColorControl({
  value,
  onValueChange,
}: {
  value: RGBA;
  onValueChange?: (value: RGBA) => void;
}) {
  return (
    <Popover>
      <div
        className={cn(
          "flex items-center border cursor-default",
          WorkbenchUI.inputVariants({ size: "xs" })
        )}
      >
        <PopoverTrigger>
          <RGBAChip rgba={value} />
        </PopoverTrigger>

        {/* <span className="ms-2">#{css.rgbaToHex(value)}</span> */}
        <HexValueInput
          className="border-none outline-none w-full h-full ps-2 text-xs"
          value={{
            r: value.r,
            g: value.g,
            b: value.b,
            // ommit the alpha
          }}
          onValueChange={(color) => {
            onValueChange?.({
              ...color,
              a: value.a,
            });
          }}
        />
      </div>
      <PopoverContent
        align="start"
        side="right"
        sideOffset={16}
        className="p-0"
      >
        <ColorPicker color={value} onColorChange={onValueChange} />
      </PopoverContent>
    </Popover>
  );
}
