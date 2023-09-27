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

export class Vector {
  public x: number;
  public y: number;

  /**
   * Constructs a vector from 2 numbers a and b.
   * If isPolar is true, then a is the magnitude and b is the direction of the vector.
   * If isPolar is false, then a is the x coordinate and b is the y coordinate of the vector
   *
   * @param a number
   * @param b number
   * @param isPolar boolean
   * @returns a Vector
   */
  constructor(a: number, b: number, isPolar: boolean = false) {
    if (!isPolar) {
      this.x = a;
      this.y = b;
      return this;
    }

    this.x = a * Math.cos(b);
    this.y = a * Math.sin(b);
    return this;
  }

  public add(that: Vector): Vector {
    return new Vector(this.x + that.x, this.y + that.y);
  }

  public mirrorY(): Vector {
    return new Vector(this.x, -this.y);
  }

  public move(a: number, b: number = 0, isPolar: boolean = false): Vector {
    return this.add(new Vector(a, b, isPolar).mirrorY());
  }
}
