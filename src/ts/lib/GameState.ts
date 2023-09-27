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

import { LIQUID_UNIT } from "../config/constants";
import { GameGraph } from "./GameGraph";
import { Liquid } from "./Liquid";
import { randPick } from "./random-utils";

export class GameState {
  private colorsMap: Map<string, number>;
  private reverseColorsMap: Map<number, string>;
  private state: Uint8Array;
  private numberOfTubes: number;
  public readonly graph: GameGraph;

  constructor(colors: string[], extraTubes: number = 2) {
    this.makeColorsMap(colors);
    this.numberOfTubes = colors.length + extraTubes;
    this.state = new Uint8Array(this.numberOfTubes * 4);
    this.graph = new GameGraph(this);
  }

  public getNumberOfTubes(): number {
    return this.numberOfTubes;
  }

  private makeColorsMap(colors: string[]): void {
    const cmap = new Map<string, number>();
    const rmap = new Map<number, string>();
    colors.forEach((color: string, index: number): void => {
      cmap.set(color, index + 1);
      rmap.set(index + 1, color);
    });
    this.colorsMap = cmap;
    this.reverseColorsMap = rmap;
  }

  private getTube(i: number): number[] {
    return Array.from(this.state.slice(i * 4, i * 4 + 4));
  }

  private makeNewGame(): boolean {
    const reserve: [string, number][] = Array.from(
      this.colorsMap.entries()
    ).map((c) => [c[0], 4]);
    const N = reserve.length;

    for (let i = 0; i < N * 4; i++) {
      const [liq, ind] = randPick(reserve);
      const ttInd = Math.floor(i / 4);

      if (liq[1] === 1) {
        reserve.splice(ind, 1);
      } else {
        reserve[ind][1] -= 1;
      }

      this.add(ttInd, liq[0], 1);
    }

    return this.graph.recalculate();
  }

  public newGame(): void {
    while (!this.makeNewGame()) {}
  }

  public getLiquidContents(i: number, unit: number = LIQUID_UNIT): Liquid[] {
    const tube = this.getTube(i);
    let prev = 0;
    const arr: Liquid[] = [];

    for (let p = 0; p < 4; p++) {
      if (tube[p] === 0) return arr;
      if (tube[p] === prev) {
        const top = arr[arr.length - 1];
        top.setVolume(top.volume + unit);
      } else {
        prev = tube[p];
        arr.push(new Liquid(this.reverseColorsMap.get(prev), unit));
      }
    }

    return arr;
  }

  public canTake(i: number): [string, number] {
    const tube = this.getTube(i);
    if (tube[0] === 0) return [null, 4];
    if (tube[3] !== 0) return [this.reverseColorsMap.get(tube[3]), 0];

    let count = 0;
    for (let p = 3; p >= 0; p--) {
      if (tube[p] === 0) {
        count = count + 1;
      } else {
        return [this.reverseColorsMap.get(tube[p]), count];
      }
    }

    return [null, 0];
  }

  public canGive(i: number): [string, number] {
    const tube = this.getTube(i);
    if (tube[0] === 0) return [null, 0];

    let count = 0;
    let top = 0;
    for (let p = 3; p >= 0; p--) {
      if (top === 0) {
        top = tube[p];
        count = 1;
      } else {
        if (top === tube[p]) {
          count = count + 1;
        } else {
          break;
        }
      }
    }

    return [this.reverseColorsMap.get(top), count];
  }

  public canTransfer(i: number, j: number): [string, number, number?] {
    const [sColor, sUnits] = this.canGive(i);
    if (!sColor) return [null, 0, 0];

    const [tColor, tUnits] = this.canTake(j);
    if (!tUnits) return [null, 0, 0];
    if (tColor && tColor !== sColor) return [null, 0, 0];

    const isISingle = this.isTubeSingleColor(i);
    const isJSingle = this.isTubeSingleColor(j);
    const [_, tgUnits] = this.canGive(j);

    let shouldTransfer = 1;
    if (this.isTubeFinal(i)) shouldTransfer = 0;
    else if (sUnits > tUnits) shouldTransfer = 0;
    else if (isISingle && tUnits === 4) shouldTransfer = 0;
    else if (isISingle && isJSingle) {
      if (tgUnits < sUnits) shouldTransfer = 0;
    } else if (isISingle) shouldTransfer = 0.4;
    else if (tUnits === 4) shouldTransfer = 0.5;
    else if (isJSingle && tgUnits + sUnits === 4) shouldTransfer = 3;
    else if (isJSingle) shouldTransfer = 2;
    else shouldTransfer = 1;

    return [sColor, Math.min(sUnits, tUnits), shouldTransfer];
  }

  public add(i: number, color: string, units: number): void {
    const l = i * 4;
    const r = l + 4;
    const c = this.colorsMap.get(color);
    let p = 0;

    for (let j = l; j < r; j++) {
      if (this.state[j] === 0) {
        this.state[j] = c;
        p = p + 1;
        if (p === units) break;
      }
    }
  }

  public remove(i: number, color: string, units: number): void {
    const l = i * 4;
    const r = l + 4;
    const c = this.colorsMap.get(color);
    let p = 0;

    for (let j = r - 1; j >= l; j--) {
      if (this.state[j] === 0) {
        continue;
      } else {
        if (this.state[j] === c) {
          this.state[j] = 0;
          p = p + 1;
          if (p === units) break;
        } else {
          break;
        }
      }
    }
  }

  public transfer(
    source: number,
    target: number,
    color: string,
    units: number
  ): void {
    this.remove(source, color, units);
    this.add(target, color, units);
  }

  public isFinal(): boolean {
    for (let i = 0; i < this.numberOfTubes; i++) {
      if (!(this.isTubeEmpty(i) || this.isTubeFinal(i))) return false;
    }

    return true;
  }

  public isTubeFinal(index: number): boolean {
    const tube = this.getTube(index);
    let val = tube[0];
    if (val === 0) return false;

    for (let i = 1; i < 4; i++) {
      if (tube[i] !== val) return false;
    }

    return true;
  }

  public isTubeSingleColor(index: number): boolean {
    const tube = this.getTube(index);
    let val = tube[0];
    if (val === 0) return false;

    for (let i = 1; i < 4; i++) {
      if (tube[i] !== val && tube[i] !== 0) return false;
    }

    return true;
  }

  public isTubeEmpty(index: number): boolean {
    const tube = this.getTube(index);
    for (let i = 0; i < 4; i++) {
      if (tube[i] !== 0) return false;
    }

    return true;
  }

  public encode(): string {
    return btoa(String.fromCharCode.apply(null, this.state));
  }

  public decode(b64: string): void {
    this.state = new Uint8Array(
      atob(b64)
        .split("")
        .map((x) => x.charCodeAt(0))
    );
  }
}
