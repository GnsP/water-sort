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
  MODAL_OVERLAY,
  MODAL_HEADING,
  MODAL_TEXT,
  MODAL_ACTION_BUTTON,
  MODAL_ACTION_ICON,
  MODAL_ACTION_TEXT,
  MODAL_CANCEL_BUTTON,
} from "../config/ui-elements";

export class ModalController {
  private isOpen: boolean;
  private action: () => void;

  constructor() {
    this.close();
    this.addEventHandlers();
  }

  private addEventHandlers(): void {
    MODAL_ACTION_BUTTON.addEventListener("click", this.handleAction.bind(this));
    MODAL_CANCEL_BUTTON.addEventListener("click", this.close.bind(this));
  }

  public open(
    heading: string,
    text: string,
    action: () => void = this.close.bind(this),
    actionText: string = "YES",
    actionIcon: string = "done",
  ): void {
    this.isOpen = true;
    this.action = action;

    MODAL_HEADING.innerText = heading;
    MODAL_TEXT.innerText = text;
    MODAL_ACTION_TEXT.innerText = actionText;
    MODAL_ACTION_ICON.innerText = actionIcon;

    MODAL_OVERLAY.style.display = "flex";
  }

  public close(): void {
    this.isOpen = false;
    this.action = this.close.bind(this);
    MODAL_OVERLAY.style.display = "none";
  }

  private handleAction(): void {
    if (this.isOpen) {
        this.action();
        this.close();
    }
  }
}
