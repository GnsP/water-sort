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

import { animate, linearEasing, EasingFunction } from "./animation-utils";

export class Liquid {
  static NONE: Liquid = new Liquid();

  public volume: number;
  public readonly color: string;

  constructor(color: string = "", volume: number = 0) {
    this.color = color;
    this.volume = volume;
  }

  public async addVolume(
    volumeToAdd: number,
    duration: number = 0,
    easing: EasingFunction = linearEasing
  ): Promise<boolean> {
    const oldVolume = this.volume;
    await animate((frac: number): void => {
      this.volume = easing(oldVolume, oldVolume + volumeToAdd, frac);
    }, duration);

    return true;
  }

  public clone(): Liquid {
    return new Liquid(this.color, this.volume);
  }

  public setVolume(vol: number): Liquid {
    this.volume = vol;
    return this;
  }
}
