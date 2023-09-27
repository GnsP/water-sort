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

import { GameState } from "./GameState";

type StepDef = {
  source: number;
  target: number;
  color: string;
  units: number;
};

type NextStatesMap = {
  [key: string]: {
    isFinal: boolean;
    step: StepDef;
    isBestStep: boolean;
    heuristic: number;
  };
};

type GameStateGraph = {
  [key: string]: {
    next: NextStatesMap;
    prev: string;
  };
};

export class GameGraph {
  private readonly state: GameState;
  private initialState: string;
  private graph: GameStateGraph;

  constructor(state: GameState) {
    this.state = state;
    this.initialState = this.state.encode();
    this.graph = {};
    this.makeGraph();
  }

  public recalculate(): boolean {
    this.initialState = this.state.encode();
    return this.makeGraph();
  }

  public getBestStep(state: string): StepDef {
    if (!this.graph[state]) return null;
    for (const edge of Object.values(this.graph[state].next)) {
      if (edge.isBestStep) return edge.step;
    }

    return null;
  }

  private makeGraph(): boolean {
    const MAX_NODES_TO_VISIT = 2000;

    const q: [string, string][] = [[this.initialState, null]];
    const visited = new Set<string>();
    visited.add(this.initialState);

    while (q.length) {
      const [curState, prevState] = q.pop();
      this.state.decode(curState);
      this.graph[curState] = {
        next: this.getNextStates(),
        prev: prevState,
      };

      const nextObj = this.graph[curState].next;
      const nextStates = Object.keys(nextObj);
      nextStates.sort((a, b) => {
        const h = nextObj[a].heuristic - nextObj[b].heuristic;
        if (h !== 0) return h;
        const v = nextObj[a].step.units - nextObj[b].step.units;
        if (v !== 0) return -v;
        else return Math.random() < 0.5 ? -1 : 1;
      });

      for (const nextState of nextStates) {
        if (!visited.has(nextState)) {
          q.push([nextState, curState]);
          visited.add(nextState);

          if (this.graph[curState].next[nextState].isBestStep) {
            this.propagateBestStep(curState);

            this.state.decode(this.initialState);
            return true;
          }
        }
      }
      if (visited.size > MAX_NODES_TO_VISIT) {
        break;
      }
    }

    this.state.decode(this.initialState);
    return false;
  }

  private propagateBestStep(state: string): void {
    let cur = state;
    let prev = this.graph[cur].prev;
    while (prev) {
      if (!this.hasBestStep(prev)) {
        this.graph[prev].next[cur].isBestStep = true;
        cur = prev;
        prev = this.graph[cur].prev;
      } else {
        break;
      }
    }
  }

  private hasBestStep(state: string): boolean {
    const candidates = Object.values(this.graph[state].next);
    for (const candidate of candidates) {
      if (candidate.isBestStep) return true;
    }

    return false;
  }

  private getNextStates(): NextStatesMap {
    const result: NextStatesMap = {};
    const original = this.state.encode();
    const n = this.state.getNumberOfTubes();

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const [tColor, tUnits, shouldTransfer] = this.state.canTransfer(i, j);
          if (!shouldTransfer) continue;

          this.state.transfer(i, j, tColor, tUnits);
          const nextState = this.state.encode();
          const isFinal = this.state.isFinal();
          result[nextState] = {
            isFinal,
            step: {
              source: i,
              target: j,
              color: tColor,
              units: tUnits,
            },
            isBestStep: isFinal,
            heuristic: shouldTransfer,
          };

          this.state.decode(original);
        }
      }
    }

    return result;
  }
}
