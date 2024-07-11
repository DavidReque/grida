const monochrome = {
  light: {
    "--background": { h: 0, s: 0, l: 96.86 },
    "--foreground": { h: 196.73, s: 0, l: 0 },
    "--muted": { h: 0, s: 0, l: 96.86 },
    "--muted-foreground": { h: 109, s: 0, l: 40.77 },
    "--popover": { h: 0, s: 0, l: 96.86 },
    "--popover-foreground": { h: 0, s: 0, l: 12.94 },
    "--card": { h: 349, s: 0, l: 100 },
    "--card-foreground": { h: 196.73, s: 0, l: 0 },
    "--border": { h: 0, s: 0, l: 96.86 },
    "--input": { h: 0, s: 0, l: 87.69 },
    "--primary": { h: 0, s: 0, l: 26.15 },
    "--primary-foreground": { h: 0, s: 0, l: 100 },
    "--secondary": { h: 196.73, s: 0, l: 60 },
    "--secondary-foreground": { h: 0, s: 0, l: 96.86 },
    "--accent": { h: 0, s: 0, l: 26.27 },
    "--accent-foreground": { h: 0, s: 0, l: 96.86 },
    "--destructive": { h: 360, s: 56.57, l: 61.03 },
    "--destructive-foreground": { h: 0, s: 0, l: 96.86 },
    "--ring": { h: 0, s: 0, l: 26.27 },
    "--radius": "0.5rem",
  },
  dark: {
    "--background": { h: 0, s: 0, l: 26.27 },
    "--foreground": { h: 0, s: 0, l: 48.46 },
    "--muted": { h: 109, s: 0, l: 7.69 },
    "--muted-foreground": { h: 0, s: 0, l: 53.85 },
    "--popover": { h: 0, s: 0, l: 100 },
    "--popover-foreground": { h: 0, s: 0, l: 0 },
    "--card": { h: 0, s: 0, l: 7.69 },
    "--card-foreground": { h: 349, s: 0, l: 73.85 },
    "--border": { h: 349, s: 3, l: 10 },
    "--input": { h: 349, s: 0, l: 0 },
    "--primary": { h: 0, s: 0, l: 100 },
    "--primary-foreground": { h: 0, s: 0, l: 0 },
    "--secondary": { h: 0, s: 0, l: 60 },
    "--secondary-foreground": { h: 0, s: 0, l: 0 },
    "--accent": { h: 0, s: 0, l: 32.31 },
    "--accent-foreground": { h: 0, s: 0, l: 100 },
    "--destructive": { h: 360, s: 71.12, l: 60.04 },
    "--destructive-foreground": { h: 0, s: 100, l: 93.31 },
    "--ring": { h: 349, s: 0, l: 69.23 },
    "--radius": "0.5rem",
  },
} as const;

export default monochrome;
