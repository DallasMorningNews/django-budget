//

import Component from '../material-base/component';
import { Ripple } from '../ripple/index';

import { cssClasses } from './constants-tab';
import TabFoundation from './foundation-tab';

export { TabFoundation };

export class Tab extends Component {
  static attachTo(root) {
    return new Tab(root);
  }

  constructor(...args) {
    super(...args);

    this.ripple = Ripple.attachTo(this.rootEl);
  }

  get computedWidth() {
    return this.foundationEl.getComputedWidth();
  }

  get computedLeft() {
    return this.foundationEl.getComputedLeft();
  }

  get isActive() {
    return this.foundationEl.isActive();
  }

  set isActive(isActive) {
    this.foundationEl.setActive(isActive);
  }

  get preventDefaultOnClick() {
    return this.foundationEl.preventsDefaultOnClick();
  }

  set preventDefaultOnClick(preventDefaultOnClick) {
    this.foundationEl.setPreventDefaultOnClick(preventDefaultOnClick);
  }

  getDefaultFoundation() {
    return new TabFoundation({
      addClass: (className) => { this.rootEl.classList.add(className); },
      removeClass: (className) => { this.rootEl.classList.remove(className); },
      registerInteractionHandler: (type, handler) => {
        this.rootEl.addEventListener(type, handler);
      },
      deregisterInteractionHandler: (type, handler) => {
        this.rootEl.removeEventListener(type, handler);
      },
      getOffsetWidth: () => this.rootEl.offsetWidth,
      getOffsetLeft: () => this.rootEl.offsetLeft,
      notifySelected: () => this.emit(
        TabFoundation.strings.SELECTED_EVENT,
        { tab: this },
        true  // eslint-disable-line comma-dangle
      ),
    });
  }

  destroy() {
    this.ripple.destroy();
    super.destroy();
  }

  initialSyncWithDOM() {
    this.isActive = this.rootEl.classList.contains(cssClasses.ACTIVE);
  }

  measureSelf() {
    this.foundationEl.measureSelf();
  }
}
