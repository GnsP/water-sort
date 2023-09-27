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
  TESTTUBE_WIDTH,
  TESTTUBE_HEIGHT,
  LIQUID_UNIT,
  LIQUID_COLORS,
  ROW_HEIGHT,
  ROW_TOP_PADDING,
} from "../config/constants";
import { GameState } from "./GameState";
import { Testtube } from "./Testtube";
import { Vector } from "./Vector";
import { GameScreen } from "./GameScreen";
import { Liquid } from "./Liquid";
import { randPickN } from "./random-utils";
import { CANVAS_WIDTH } from "../config/canvas";
import { linearEasing, quadraticEaseIn, quadraticEaseOut, sleep } from "./animation-utils";

export class Game {
  private screen: GameScreen;
  private numberOfTesttubes: number;
  private readonly tubes: Testtube[];
  private colors: string[];
  private selected: number;
  private isAnimating: boolean;
  private gameState: GameState;
  private stateStack: string[];
  private subscriber: () => void;
  private isAutoSolving: boolean;

  constructor(numberOfColors: number) {
    this.screen = new GameScreen();
    this.colors = randPickN(LIQUID_COLORS, numberOfColors);
    this.gameState = new GameState(this.colors, 2);
    this.numberOfTesttubes = numberOfColors + 2;
    this.tubes = Array.from(
      Array(this.numberOfTesttubes).fill(0),
      () => new Testtube(TESTTUBE_HEIGHT, TESTTUBE_WIDTH / 2)
    );
    this.stateStack = [];
    this.gameState.newGame();

    this.placeTesttubes();
    this.initContent();

    this.selected = -1;
    this.isAnimating = false;
    this.isAutoSolving = false;
    this.subscriber = () => {};
  }

  public isSolved(): boolean {
    return this.gameState.isFinal();
  }

  public isSolving(): boolean {
    return this.isAutoSolving;
  }

  public canUndo(): boolean {
    return this.stateStack.length > 1;
  }

  private notifyChange(): void {
    if (this.subscriber !== null) this.subscriber();
  }

  private restoreToState(oldState: string): void {
    this.gameState.decode(oldState);
    this.placeTesttubes();

    for (let i = 0; i < this.numberOfTesttubes; i++) {
      this.tubes[i].setContents(this.gameState.getLiquidContents(i));
    }
    this.selected = -1;
    this.isAnimating = false;

    this.notifyChange();
  }

  private runAnimation = async (fn: () => Promise<void>): Promise<void> => {
    this.isAnimating = true;
    await fn();
    this.isAnimating = false;
  };

  private placeTesttubes(): void {
    const a = Math.ceil(this.numberOfTesttubes / 2);
    const w = CANVAS_WIDTH / a;
    const pad = Math.ceil((w - TESTTUBE_WIDTH) / 2);

    const line1Y = ROW_TOP_PADDING;
    const line2Y = ROW_HEIGHT + ROW_TOP_PADDING;

    for (let i = 0; i < this.numberOfTesttubes; i++) {
      let y = line1Y;
      if (i >= a) y = line2Y;

      const x = (i % a) * w + pad + TESTTUBE_WIDTH / 2;
      this.tubes[i].setPosition(new Vector(x, y));
    }

    this.screen.setObjects(this.tubes);
  }

  async initContent(): Promise<void> {
    for (let i = 0; i < this.numberOfTesttubes; i++) {
      const contents = this.gameState.getLiquidContents(i);
      for (const liq of contents) {
        await this.runAnimation(async (): Promise<void> => {
          await this.tubes[i].addContent(liq, 50);
        });
      }
    }
    this.stateStack.push(this.gameState.encode());
    this.notifyChange();
  }

  public handleClick = async (event: PointerEvent): Promise<void> => {
    if (this.isAnimating) return;

    const x = event.offsetX;
    const y = event.offsetY;
    const pointer = new Vector(x, y);

    for (let i = 0; i < this.numberOfTesttubes; i++) {
      const tube = this.tubes[i];

      if (tube.isInside(pointer)) {
        const old = this.selected;
        let poured = false;

        if (old !== -1) {
          const oldTube = this.tubes[old];
          if (old !== i) poured = await this.pour(old, i);
          await this.runAnimation(async () => {
            await oldTube.animateTo(
              oldTube.position.move(0, -TESTTUBE_WIDTH),
              0,
              100
            );
          });

          if (poured) this.selected = -1;
          else this.selected = old === i ? -1 : i;
        } else {
          this.selected = i;
        }

        if (this.selected !== -1) {
          const curTube = this.tubes[this.selected];
          await this.runAnimation(async (): Promise<void> => {
            await curTube.animateTo(
              curTube.position.move(0, TESTTUBE_WIDTH),
              0,
              100
            );
          });
        }
        return;
      }
    }

    if (this.selected !== -1) {
      const curTube = this.tubes[this.selected];
      await this.runAnimation(async () => {
        await curTube.animateTo(
          curTube.position.move(0, -TESTTUBE_WIDTH),
          0,
          100
        );
      });
      this.selected = -1;
    }
  };

  async pour(sourceIndex: number, targetIndex: number): Promise<boolean> {
    const source = this.tubes[sourceIndex];
    const target = this.tubes[targetIndex];

    const [colorToPour, unitsToPour] = this.gameState.canTransfer(
      sourceIndex,
      targetIndex
    );
    if (!colorToPour || !unitsToPour) return false;

    const volToPour = unitsToPour * LIQUID_UNIT;
    const startVol = source.getFilledVol();
    const oldPosition = source.position;
    const pourDuration = [0, 300, 500, 650, 750][unitsToPour] || 0;

    let orientation: string = "right";
    if (target.position.x > TESTTUBE_HEIGHT) orientation = "left";
    const directionFactor = orientation === "left" ? -1 : 1;

    await this.runAnimation(async (): Promise<void> => {
      await source
        .setZindex(1)
        .animateTo(
          new Vector(target.position.x, target.position.y - TESTTUBE_WIDTH),
          source.getAngleForVol(startVol) * directionFactor,
          300,
          linearEasing,
          quadraticEaseIn,
        );

      source.setPivot(
        orientation === "left" ? Testtube.Pivots.RIGHT : Testtube.Pivots.LEFT
      );
      source.animateTo(
        source.position,
        source.getAngleForVol(startVol - volToPour) * directionFactor,
        pourDuration
      );
      target.addContent(new Liquid(colorToPour, volToPour), pourDuration, true);
      await sleep(pourDuration);

      source.removeTopContent(volToPour);
      source.setPivot(Testtube.Pivots.CENTER);
      await source.animateTo(oldPosition, 0, 300, linearEasing, quadraticEaseOut);
      source.setZindex(0);
    });

    this.gameState.transfer(sourceIndex, targetIndex, colorToPour, unitsToPour);
    this.stateStack.push(this.gameState.encode());

    this.notifyChange();
    return true;
  }

  public undo = (): void => {
    if (this.stateStack.length <= 1) return;

    this.stateStack.pop();
    this.restoreToState(this.stateStack[this.stateStack.length - 1]);
    this.notifyChange();
  };

  public reset = (): void => {
    if (!this.stateStack.length) return;

    const oldState = this.stateStack[0];
    this.restoreToState(oldState);
    this.stateStack = [oldState];
    this.notifyChange();
  };

  public solve = async (): Promise<void> => {
    this.isAutoSolving = true;
    this.notifyChange();

    await this.runAnimation(async (): Promise<void> => {
      if (this.stateStack.length > 1) {
        while (!this.gameState.graph.recalculate()) this.undo();
      }
      while (true) {
        const step = this.gameState.graph.getBestStep(this.gameState.encode());
        if (!step) break;
        await this.pour(step.source, step.target);
      }
    });

    this.isAutoSolving = false;
    this.notifyChange();
  };

  public onChange(subscriber: () => void): void {
    this.subscriber = subscriber;
  }
}
