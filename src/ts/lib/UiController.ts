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
  PREV_LEVEL_BUTTON,
  NEXT_LEVEL_BUTTON,
  RESET_BUTTON,
  UNDO_BUTTON,
  SOLVE_BUTTON,
  LEVEL_TEXT,
  NEW_GAME_BUTTON,
} from "../config/ui-elements";
import { CANVAS } from "../config/canvas";
import {
  LEVEL_EASY_RANGE,
  LEVEL_MEDIUM_RANGE,
  LEVEL_HARD_RANGE,
} from "../config/constants";
import { Game } from "./Game";
import { randint } from "./random-utils";
import { ModalController } from "./ModalController";

enum GameLevels {
  EASY,
  MEDIUM,
  HARD,
}

export class UiController {
  private game: Game;
  private level: GameLevels;
  private modal: ModalController;

  constructor() {
    this.modal = new ModalController();
    this.updateLevel(GameLevels.MEDIUM);
    this.addEventListeners();
    this.startNewGame();
  }

  private updateLevel(lvl: GameLevels): void {
    this.level = lvl;

    LEVEL_TEXT.innerText = this.getLevelText();
    NEXT_LEVEL_BUTTON.disabled = false;
    PREV_LEVEL_BUTTON.disabled = false;

    if (this.level === GameLevels.EASY) {
      PREV_LEVEL_BUTTON.disabled = true;
    }

    if (this.level === GameLevels.HARD) {
      NEXT_LEVEL_BUTTON.disabled = true;
    }
  }

  private handleNewGame(): void {
    if (!this.game.isSolved()) {
      this.modal.open(
        "New Game",
        "You have not finished the current game yet. Do you want to start a new game ?",
        this.startNewGame.bind(this),
      );
    } else {
      this.startNewGame();
    }
  }

  private startNewGame(): void {  
    const numberOfColors = randint(...this.getLevelRannge());
    this.game = new Game(numberOfColors);
    this.addGameSubscriber();
  }

  private addGameSubscriber(): void {
    this.game.onChange(() => {
      RESET_BUTTON.disabled = !this.game.canUndo() || this.game.isSolving();
      UNDO_BUTTON.disabled = !this.game.canUndo() || this.game.isSolving();

      SOLVE_BUTTON.disabled = this.game.isSolving() || this.game.isSolved(); 
    });
  }

  private getLevelRannge(): [number, number] {
    switch (this.level) {
      case GameLevels.EASY:
        return LEVEL_EASY_RANGE;
      case GameLevels.MEDIUM:
        return LEVEL_MEDIUM_RANGE;
      case GameLevels.HARD:
        return LEVEL_HARD_RANGE;
      default:
        return [8, 14];
    }
  }

  private getLevelText(): string {
    switch (this.level) {
      case GameLevels.EASY:
        return "EASY";
      case GameLevels.MEDIUM:
        return "MEDIUM";
      case GameLevels.HARD:
        return "HARD";
      default:
        return "";
    }
  }

  private addEventListeners(): void {
    PREV_LEVEL_BUTTON.addEventListener(
      "click",
      this.handlePrevLevel.bind(this)
    );
    NEXT_LEVEL_BUTTON.addEventListener(
      "click",
      this.handleNextLevel.bind(this)
    );
    RESET_BUTTON.addEventListener("click", this.handleReset.bind(this));
    UNDO_BUTTON.addEventListener("click", this.handleUndo.bind(this));
    SOLVE_BUTTON.addEventListener("click", this.handleSolve.bind(this));
    CANVAS.addEventListener("click", this.handleCanvas.bind(this));
    NEW_GAME_BUTTON.addEventListener("click", this.handleNewGame.bind(this));
  }

  private handlePrevLevel(): void {
    switch (this.level) {
      case GameLevels.MEDIUM:
        return this.updateLevel(GameLevels.EASY);
      case GameLevels.HARD:
        return this.updateLevel(GameLevels.MEDIUM);
      default:
        return;
    }
  }

  private handleNextLevel(): void {
    switch (this.level) {
      case GameLevels.EASY:
        return this.updateLevel(GameLevels.MEDIUM);
      case GameLevels.MEDIUM:
        return this.updateLevel(GameLevels.HARD);
      default:
        return;
    }
  }

  private handleReset(): void {
    this.game.reset();
  }

  private handleUndo(): void {
    this.game.undo();
  }

  private handleSolve(): void {
    this.game.solve();
  }

  private handleCanvas(e: PointerEvent): void {
    this.game.handleClick(e);
  }
}
