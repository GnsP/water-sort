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

import { Drawable } from "./Drawable";
import { Vector } from "./Vector";
import { Liquid } from "./Liquid";
import { solveIntersection, arcArea, binarySearch } from "./math-utils";
import { EasingFunction, linearEasing, animate } from "./animation-utils";

export enum TesttubePivots {
  LEFT,
  CENTER,
  RIGHT,
}

export class Testtube implements Drawable {
  static OUTLINE_COLOR: string = "white";
  static readonly Pivots = TesttubePivots;

  private readonly height: number;
  private readonly radius: number;
  private filling: string;

  public contents: Liquid[];
  public angle: number;
  public pivot: TesttubePivots;
  public position: Vector;
  public zindex: number;

  constructor(
    height: number = 90,
    radius: number = 8,
    position: Vector = new Vector(0, 0),
    angle: number = 0,
    pivot: TesttubePivots = Testtube.Pivots.CENTER
  ) {
    this.height = height;
    this.radius = radius;
    this.position = position;
    this.angle = angle;
    this.contents = [];
    this.pivot = pivot;
    this.filling = null;
    this.zindex = 0;
  }

  public getTopLeft(): Vector {
    let topLeft: Vector = this.position;
    if (this.pivot === Testtube.Pivots.CENTER) {
      topLeft = this.position.move(-this.radius, this.angle, true);
    } else if (this.pivot === Testtube.Pivots.RIGHT) {
      topLeft = this.position.move(-2 * this.radius, this.angle, true);
    }

    return topLeft;
  }

  public isInside(v: Vector): boolean {
    const topLeft: Vector = this.getTopLeft();
    return (
      v.x >= topLeft.x &&
      v.x <= topLeft.x + this.radius * 2 &&
      v.y >= topLeft.y &&
      v.y <= topLeft.y + this.height
    );
  }

  private maxVol(angle: number = this.angle): number {
    const l = this.height - this.radius;
    const r = this.radius;
    const d = 2 * r;
    const m = Math.tan(Math.abs(angle));
    const withRect = Math.atan(l / d);

    if (Math.abs(angle) <= withRect) {
      const b = d * m;
      const areaOfTriangle = 0.5 * d * b;

      const h = l - b;
      const areaOfRect = h * d;
      const areaOfSemiCircle = (Math.PI * r * r) / 2;

      return areaOfTriangle + areaOfRect + areaOfSemiCircle;
    }

    const pp = l / m;
    const areaOfTriangle = 0.5 * pp * l;
    const x2 = pp - r;
    const c = -x2 * m;

    const [x1, y1] = solveIntersection(r, m, c);
    const areaUnderArc = arcArea(r, -r, x1);
    const areaInArcTriangle = 0.5 * (x1 - x2) * y1;

    return areaOfTriangle + areaUnderArc - areaInArcTriangle;
  }

  public getAngleForVol(vol: number): number {
    return binarySearch(Math.PI / 2, 0, this.maxVol.bind(this), vol);
  }

  private minVolWithRect(): number {
    const l = this.height - this.radius;
    const r = this.radius;
    const d = 2 * r;
    const m = Math.tan(Math.abs(this.angle));

    const withRect = Math.atan(l / d);
    if (Math.abs(this.angle) > withRect) {
      return Infinity;
    }

    const areaOfSemiCircle = (Math.PI * r * r) / 2;
    const areaOfTriangle = 0.5 * d * d * m;

    return areaOfSemiCircle + areaOfTriangle;
  }

  private findLine(vol: number): number {
    const r = this.radius;
    const m = Math.tan(Math.abs(this.angle));

    function calcVol(x: number): number {
      const p = x / m;
      const areaOfTriangle = 0.5 * p * x;

      const x2 = p - r;
      const c = -x2 * m;

      let [x1, y1] = solveIntersection(r, m, c);
      if (x1 > 0) x1 = Math.min(x1, r);
      else x1 = Math.max(x1, -r);

      const areaUnderArc = arcArea(r, -r, x1);
      const areaInArcTriangle = 0.5 * (x1 - x2) * y1;

      return areaOfTriangle + areaUnderArc - areaInArcTriangle;
    }

    return binarySearch(0, 2 * r * m, calcVol, vol);
  }

  private drawContent(
    vol: number,
    color: string,
    ctx: CanvasRenderingContext2D
  ): void {
    const theta = this.angle;
    const r = this.radius;
    const l = this.height - r;
    const d = 2 * r;

    const actualVol = Math.min(vol, this.maxVol());
    const withRect = Math.atan(l / d);

    let topLeft = this.getTopLeft();
    const topRight = topLeft.move(d, theta, true);

    const minVolWithRect = this.minVolWithRect();
    if (actualVol > minVolWithRect && Math.abs(this.angle) <= withRect) {
      const rectVol = actualVol - minVolWithRect;
      const shortSide = rectVol / d;
      const longSide = shortSide + d * Math.tan(Math.abs(this.angle));

      const l1 = this.angle < 0 ? shortSide : longSide;
      const l2 = this.angle < 0 ? longSide : shortSide;

      const p1 = topLeft.move(l - l1, theta - Math.PI / 2, true);
      const p2 = p1.move(d / Math.cos(theta), 0, true);
      const p3 = p2.move(l2, theta - Math.PI / 2, true);
      const circleCenter = p3.move(r, Math.PI + theta, true);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.arc(
        circleCenter.x,
        circleCenter.y,
        r,
        2 * Math.PI - theta,
        Math.PI - theta
      );
      ctx.lineTo(p1.x, p1.y);
      const oldCol = ctx.fillStyle;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = oldCol;

      return;
    } else {
      const l1 = this.findLine(actualVol);
      if (this.angle < 0) {
        const p1 = topRight.move(l - l1, theta - Math.PI / 2, true);
        const p2 = topRight.move(l, theta - Math.PI / 2, true);
        const circleCenter = p2.move(r, Math.PI + theta, true);

        const pp = l1 / Math.tan(Math.abs(theta));
        const x2 = pp - r;
        const m = Math.tan(Math.abs(theta));
        const c = -x2 * m;

        const [xx, yy] = solveIntersection(r, m, c);
        let phi = Math.atan(yy / xx);
        if (phi < 0) phi = Math.PI + phi;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.arc(
          circleCenter.x,
          circleCenter.y,
          r,
          Math.abs(theta),
          Math.PI + Math.abs(theta) - phi
        );
        ctx.lineTo(p1.x, p1.y);
        const oldCol = ctx.fillStyle;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = oldCol;

        return;
      }

      const p1 = topLeft.move(l - l1, theta - Math.PI / 2, true);
      const p2 = topLeft.move(l, theta - Math.PI / 2, true);
      const circleCenter = p2.move(r, theta, true);

      const pp = l1 / Math.tan(theta);
      const x2 = pp - r;
      const m = Math.tan(theta);
      const c = -x2 * m;

      const [xx, yy] = solveIntersection(r, m, c);
      let phi = Math.atan(yy / xx);
      if (phi < 0) phi = Math.PI + phi;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.arc(
        circleCenter.x,
        circleCenter.y,
        r,
        Math.PI - theta,
        2 * Math.PI - theta + phi,
        true
      );
      ctx.lineTo(p1.x, p1.y);
      const oldCol = ctx.fillStyle;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = oldCol;

      return;
    }
  }

  private drawOutline(ctx: CanvasRenderingContext2D): void {
    const theta = this.angle;
    const h = this.height;
    const r = this.radius;
    const d = r * 2;

    let topLeft = this.getTopLeft();
    const topRight = topLeft.move(d, theta, true);
    const bottomRight = topRight.move(h - r, theta - Math.PI / 2, true);
    const circleCenter = bottomRight.move(r, Math.PI + theta, true);

    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.arc(
      circleCenter.x,
      circleCenter.y,
      r,
      2 * Math.PI - theta,
      Math.PI - theta
    );
    ctx.lineTo(topLeft.x, topLeft.y);
    ctx.lineWidth = 2;
    const oldCol = ctx.strokeStyle;
    ctx.strokeStyle = Testtube.OUTLINE_COLOR;
    ctx.stroke();

    if (Math.abs(theta) < 0.1) {
      ctx.beginPath();
      ctx.moveTo(topRight.x - 6, topRight.y + 6);
      ctx.lineTo(bottomRight.x - 6, bottomRight.y - 6);
      ctx.arc(
        circleCenter.x,
        circleCenter.y,
        r - 6,
        2 * Math.PI - theta,
        2 * Math.PI - theta + Math.PI / 2.5
      );
      const oldLineCap = ctx.lineCap;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255, 225, 200, 0.3)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.lineCap = oldLineCap;
      ctx.lineWidth = 2;
    }

    ctx.strokeStyle = oldCol;
  }

  private drawContents(ctx: CanvasRenderingContext2D): void {
    const drawSequence: [number, string, CanvasRenderingContext2D][] = [];
    let alreadyFilled = 0;

    for (const content of this.contents) {
      alreadyFilled += content.volume;
      drawSequence.unshift([alreadyFilled, content.color, ctx]);
    }

    drawSequence.forEach((args) => this.drawContent.apply(this, args));
  }

  private drawFilling(ctx: CanvasRenderingContext2D): void {
    if (!this.filling) return;

    let topLeft = this.getTopLeft();
    const p1 = topLeft.move(this.radius, 2 * this.radius);

    const oldCol = ctx.fillStyle;
    ctx.fillStyle = this.filling;
    ctx.fillRect(p1.x - 1, p1.y, 2, 2 * this.radius + this.height);
    ctx.fillStyle = oldCol;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.filling) {
      this.drawFilling(ctx);
    }
    this.drawContents(ctx);
    this.drawOutline(ctx);
  }

  public setAngle(theta: number): Testtube {
    this.angle = theta;
    return this;
  }

  public setPosition(pos: Vector): Testtube {
    this.position = pos;
    return this;
  }

  public setPivot(pivot: TesttubePivots): Testtube {
    this.pivot = pivot;
    return this;
  }

  public setZindex(value: number): Testtube {
    this.zindex = value;
    return this;
  }

  public setContents(contents: Liquid[]): Testtube {
    this.contents = contents;
    return this;
  }

  public canGive(): Liquid {
    if (this.contents.length === 0) return Liquid.NONE;
    const top = this.contents[this.contents.length - 1];
    return top.clone();
  }

  public canTake(limit: number): Liquid {
    if (this.contents.length === 0) return new Liquid("", limit);
    const filled = this.getFilledVol();

    if (filled === limit) return Liquid.NONE;

    const top = this.contents[this.contents.length - 1];
    const free = Math.floor(limit - filled);
    return top.clone().setVolume(free);
  }

  public getFilledVol(): number {
    return this.contents.map((x) => x.volume).reduce((a, b) => a + b, 0);
  }

  public async addContent(
    liq: Liquid,
    duration: number,
    isPouring: boolean = false
  ): Promise<void> {
    if (isPouring) this.filling = liq.color;
    const n = this.contents.length;
    if (n === 0 || this.contents[n - 1].color !== liq.color) {
      const addingLiq = liq.clone().setVolume(0);
      this.contents.push(addingLiq);
      await addingLiq.addVolume(liq.volume, duration);
    } else {
      await this.contents[n - 1].addVolume(liq.volume, duration);
    }
    this.filling = null;
  }

  public removeTopContent(volumeToRemove: number): void {
    if (this.contents.length === 0) return;

    const top = this.contents[this.contents.length - 1];
    if (top.volume > volumeToRemove) {
      top.setVolume(top.volume - volumeToRemove);
    } else {
      this.contents.pop();
    }
  }

  public async animateTo(
    targetPosition: Vector,
    targetAngle: number,
    duration: number,
    translationEasing: EasingFunction = linearEasing,
    rotattionEasing: EasingFunction = linearEasing
  ): Promise<void> {
    const startAngle = this.angle;
    const startPosition = this.position;

    await animate((frac: number): void => {
      const curAngle = rotattionEasing(startAngle, targetAngle, frac);
      const curPosition = new Vector(
        translationEasing(startPosition.x, targetPosition.x, frac),
        translationEasing(startPosition.y, targetPosition.y, frac)
      );

      this.setAngle(curAngle).setPosition(curPosition);
    }, duration);
  }
}
