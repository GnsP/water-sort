/*
 * Created on Sun Sep 24 2023
 *
 * The MIT License (MIT)
 * Copyright (c) 2023 Ganesh Prasad Sahoo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Helper function to calculate the integral representating the area under a semicircular arc
 * centered at origin (0, 0).
 *
 * @param r number radius of the circle
 * @param x number, value of x at which the integral is evaluated
 * @returns a number, the value of the integral at x
 */
export function arcIntegral(r: number, x: number): number {
  return (x / 2) * Math.sqrt(r * r - x * x) + ((r * r) / 2) * Math.asin(x / r);
}

/**
 * Utility function to calculate the area under a semicircular arc centered at origin (0, 0), between
 * the x coordinates x1 and x2.
 *
 * @param r number, radius of the circle
 * @param x1 number, lower value of x
 * @param x2 number, higher value of x
 * @returns number, the area under the semicircular arc centered at origin between x1 and x2.
 */
export function arcArea(r: number, x1: number, x2: number): number {
  return Math.abs(arcIntegral(r, x2) - arcIntegral(r, x1));
}
/**
 * utility function to find the intersection point of the circle x^2 + y^2 = r^2 and the line y = mx + c
 * where y >= 0.
 *
 * @param r number, radius of the circle
 * @param m number, slope of the line
 * @param c number, y-intercept of the line
 * @returns a number pair, representing the intersection point of the circle and the line on or above the x-axis
 */
export function solveIntersection(
  r: number,
  m: number,
  c: number
): [number, number] {
  const b: number = m * c;
  const a: number = 1 + m * m;
  const p: number = Math.sqrt(r * r * a - c * c);

  const x1: number = (-b + p) / a;
  const x2: number = (-b - p) / a;

  const y1: number = m * x1 + c;
  if (y1 >= 0) return [x1, y1];

  const y2: number = m * x2 + c;
  return [x2, y2];
}

/**
 * Find a number x between left and right, such that the value of the valueFn at x is as close
 * to target value as possible, preferably (and in most valid cases) closer than the distance
 * specified by resolution.
 *
 * @param left number, left boundary of the the range to search
 * @param right number, right boundary of the range to search
 * @param valueFn function, that calculates a value at a given number x
 * @param targetValue number, the target value of the value function
 * @param resolution number, max acceptable distance from target value to terminate the search, default = 0.1
 *
 * @returns number, the number x in range (l, r) for which valueFn(x) is as close to targetValue as specified.
 */
export function binarySearch(
  left: number,
  right: number,
  valueFn: (x: number) => number,
  targetValue: number,
  resolution: number = 0.1
) {
  const MAX_ITERATIONS: number = 32;
  let iteration: number = 0;

  let mid: number = left;
  let diff: number = Infinity;
  do {
    if (diff > 0) {
      left = mid;
    } else {
      right = mid;
    }
    mid = (left + right) / 2;
    diff = targetValue - valueFn(mid);

    iteration += 1;
  } while (Math.abs(diff) > resolution && iteration < MAX_ITERATIONS);

  return mid;
}
