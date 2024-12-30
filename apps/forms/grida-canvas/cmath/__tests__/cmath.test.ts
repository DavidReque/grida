import { cmath } from "..";

describe("cmath.quantize", () => {
  it("should quantize to the nearest multiple of the step", () => {
    expect(cmath.quantize(15, 10)).toBe(20);
    expect(cmath.quantize(14, 10)).toBe(10);
    expect(cmath.quantize(16, 10)).toBe(20);
  });

  it("should quantize with decimal step sizes", () => {
    expect(cmath.quantize(0.1123, 0.1)).toBe(0.1);
    expect(cmath.quantize(0.15, 0.1)).toBe(0.2);
    expect(cmath.quantize(0.05, 0.1)).toBe(0.1);
  });

  it("should handle finer step sizes", () => {
    expect(cmath.quantize(7.35, 0.25)).toBe(7.25);
    expect(cmath.quantize(7.4, 0.25)).toBe(7.5);
    expect(cmath.quantize(7.1, 0.25)).toBe(7.0);
  });

  it("should return the value if step size is 1", () => {
    expect(cmath.quantize(5, 1)).toBe(5);
    expect(cmath.quantize(7.3, 1)).toBe(7);
    expect(cmath.quantize(7.8, 1)).toBe(8);
  });

  it("should throw an error if step is zero or negative", () => {
    expect(() => cmath.quantize(15, 0)).toThrow(
      "Step size must be a positive number."
    );
    expect(() => cmath.quantize(15, -10)).toThrow(
      "Step size must be a positive number."
    );
  });

  it("should handle very small step sizes", () => {
    expect(cmath.quantize(0.123456, 0.0001)).toBeCloseTo(0.1235);
    expect(cmath.quantize(0.123456, 0.00001)).toBeCloseTo(0.12346);
    expect(cmath.quantize(0.123456, 0.000001)).toBeCloseTo(0.123456);
  });
});
