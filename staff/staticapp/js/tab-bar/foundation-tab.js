//

import Foundation from '../material-base/foundation';
import { cssClasses, strings } from './constants-tab';

export default class TabFoundation extends Foundation {
  static get cssClasses() {
    return cssClasses;
  }

  static get strings() {
    return strings;
  }

  static get defaultAdapter() {
    return {
      addClass: () => {},
      removeClass: () => {},
      registerInteractionHandler: () => {},
      deregisterInteractionHandler: () => {},
      getOffsetWidth: () => 0,
      getOffsetLeft: () => 0,
      notifySelected: () => {},
    };
  }

  constructor(adapter = {}) {
    super(Object.assign(TabFoundation.defaultAdapter, adapter));

    this.computedWidth = 0;
    this.computedLeft = 0;
    this.isActiveFn = false;
    this.preventDefaultOnClickFn = false;

    this.clickHandler = (evt) => {
      if (this.preventDefaultOnClickFn) {
        evt.preventDefault();
      }
      this.adapter.notifySelected();
    };

    this.keydownHandler = (evt) => {
      if (evt.key && (evt.key === 'Enter' || evt.keyCode === 13)) {
        this.adapter.notifySelected();
      }
    };
  }

  init() {
    this.adapter.registerInteractionHandler('click', this.clickHandler);
    this.adapter.registerInteractionHandler('keydown', this.keydownHandler);
  }

  destroy() {
    this.adapter.deregisterInteractionHandler('click', this.clickHandler);
    this.adapter.deregisterInteractionHandler('keydown', this.keydownHandler);
  }

  getComputedWidth() {
    return this.computedWidth;
  }

  getComputedLeft() {
    return this.computedLeft;
  }

  isActive() {
    return this.isActiveFn;
  }

  setActive(isActive) {
    this.isActiveFn = isActive;
    if (this.isActiveFn) {
      this.adapter.addClass(cssClasses.ACTIVE);
    } else {
      this.adapter.removeClass(cssClasses.ACTIVE);
    }
  }

  preventsDefaultOnClick() {
    return this.preventDefaultOnClickFn;
  }

  setPreventDefaultOnClick(preventDefaultOnClick) {
    this.preventDefaultOnClickFn = preventDefaultOnClick;
  }

  measureSelf() {
    this.computedWidth = this.adapter.getOffsetWidth();
    this.computedLeft = this.adapter.getOffsetLeft();
  }
}
