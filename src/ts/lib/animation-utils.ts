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

import {
  CANVAS_2D_CONTEXT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "../config/canvas";

/**
 * Utility function to return a promise that resolves after a given time
 *
 * @param ms number, miliseconds to sleep
 * @returns a promise that resolves after ms miliseconds
 */
export function sleep(ms: number): Promise<boolean> {
  return new Promise<boolean>((resolve) =>
    window.setTimeout(() => resolve(true), ms)
  );
}

/**
 * Utility function to clear the game canvas.
 */
export function clear(): void {
  CANVAS_2D_CONTEXT.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export type EasingFunction = (
  start: number,
  end: number,
  frac: number
) => number;

/**
 * Utility function to find the number in a range that's frac*100 percent away from the
 * start of the range. It's the linear easing utility function for animations
 *
 * @param start number, start of the range
 * @param end  number, end of the range
 * @param frac number. fraction of the distance between start and end. fraction must be in [0, 1].
 * @returns a number in the range [start, end] that's at frac fraction of the distance from start to end
 */
export const linearEasing: EasingFunction = (
  start: number,
  end: number,
  frac: number
): number => {
  return start + (end - start) * frac;
};

/**
 * quadratic easing in function
 *
 * @param start number, start of the range
 * @param end  number, end of the range
 * @param frac number. fraction of the distance between start and end. fraction must be in [0, 1].
 * @returns a number in the range [start, end]
 */
export const quadraticEaseIn: EasingFunction = (
    start: number,
    end: number,
    frac: number
  ): number => {
    return start + (end - start) * frac * frac;
  };

/**
 * quadratic easing out function
 *
 * @param start number, start of the range
 * @param end  number, end of the range
 * @param frac number. fraction of the distance between start and end. fraction must be in [0, 1].
 * @returns a number in the range [start, end]
 */
export const quadraticEaseOut: EasingFunction = (
    start: number,
    end: number,
    frac: number
  ): number => {
    return start + (start - end) * frac * (frac - 2);
  };

/**
 * Async function to run an animation for a given duration
 *
 * @param action function that takes a fractional number between 0 and 1 and performs some action
 * @param duration number duration of the animation in miliseconds
 *
 * @returns a promise that resolves when the animation is finished , i.e. after duration miliseconds
 */
export async function animate(
  action: (t: number) => void,
  duration: number
): Promise<void> {
  let started: number = 0;

  function step(ts: number): void {
    if (!started) {
      started = ts;
    }

    if (ts >= started + duration) {
      return;
    }

    const ellapsed: number = ts - started;
    const frac: number = ellapsed / duration;

    action(frac);
    window.requestAnimationFrame(step);
  }

  window.requestAnimationFrame(step);
  if (duration !== Infinity) await sleep(duration + 10);
  action(1);
}
