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

export const LIQUID_COLORS: string[] = [
  "#9400FF",
  "#FFA1F5",
  "#97FFF3",
  "#0000FF",
  "#FF00FF",
  "#16FF00",
  "#379237",
  "#FCE700",
  "#FF9551",
  "#FF1E1E",
  "#F8F8F8",
  "#7E8A97",
  "#AC4B1C",
  "#AB0072",
];

type Range = [number, number];

export const TESTTUBE_WIDTH: number = 32;
export const TESTTUBE_HEIGHT: number = 152;
export const LIQUID_UNIT: number = 32 * 32;
export const ROW_HEIGHT: number = 240;
export const ROW_TOP_PADDING: number = 64;

export const LEVEL_EASY_RANGE: Range = [6, 8];
export const LEVEL_MEDIUM_RANGE: Range = [9, 12];
export const LEVEL_HARD_RANGE: Range = [13, 14];
