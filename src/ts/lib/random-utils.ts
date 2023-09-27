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
 * Utility function to generate a pseudo random integer between l [inclusive]
 * and r [inclusive].
 *
 * @param l Number, must be an integer. Otherwise rounded to floor.
 * @param r Number, must be an integer. Otherwise rounded to ceil.
 * @returns a pseudo random interger in range [ floor(l), ceil(r) ]
 */
export function randint(l: number, r: number): number {
  const L: number = Math.floor(l);
  const R: number = Math.ceil(r);

  return Math.floor(L + (R - L + 1) * Math.random());
}

/**
 * Utility function to pick a random element from an array
 *
 * @param arr An array of elements of type T
 * @returns a tuple [element, index] where element is the random element picked
 *          and index is the index of the element in the array
 */
export function randPick<T>(arr: T[]): [T, number] {
  const index: number = randint(0, arr.length - 1);

  return [arr[index], index];
}

/**
 * Utility function to pick n random elements from an array.
 *
 * @param arr An array of elements of type T
 * @param n an integer, the number of elements to choose from arr
 * @returns an array of n random elements picked from arr
 */
export function randPickN<T>(arr: T[], n: number): T[] {
  const copy: T[] = [...arr];
  if (n > arr.length) return copy;

  const ans: T[] = [];
  for (let i = 0; i < n; i++) {
    const [val, ind] = randPick<T>(copy);
    ans.push(val);
    copy.splice(ind, 1);
  }

  return ans;
}
