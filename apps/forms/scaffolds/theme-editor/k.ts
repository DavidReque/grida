import { z } from "zod";
import type { Theme } from "./types";

export const defaultTheme: z.infer<typeof Theme> = {
  "--background": { h: 0, s: 0, l: 100 },
  "--foreground": { h: 0, s: 0, l: 3.9 },
  "--card": { h: 0, s: 0, l: 100 },
  "--card-foreground": { h: 0, s: 0, l: 3.9 },
  "--popover": { h: 0, s: 0, l: 100 },
  "--popover-foreground": { h: 0, s: 0, l: 3.9 },
  "--primary": { h: 0, s: 0, l: 9 },
  "--primary-foreground": { h: 0, s: 0, l: 98 },
  "--secondary": { h: 0, s: 0, l: 96.1 },
  "--secondary-foreground": { h: 0, s: 0, l: 9 },
  "--muted": { h: 0, s: 0, l: 96.1 },
  "--muted-foreground": { h: 0, s: 0, l: 45.1 },
  "--accent": { h: 0, s: 0, l: 96.1 },
  "--accent-foreground": { h: 0, s: 0, l: 9 },
  "--destructive": { h: 0, s: 84.2, l: 60.2 },
  "--destructive-foreground": { h: 0, s: 0, l: 98 },
  "--border": { h: 0, s: 0, l: 89.8 },
  "--input": { h: 0, s: 0, l: 89.8 },
  "--ring": { h: 0, s: 0, l: 3.9 },
  "--radius": "0.5rem",
};
