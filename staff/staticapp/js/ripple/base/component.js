import Foundation from './foundation';

/**
 * @template F
 */
export default class Component {
  static attachTo(root) {
    return new Component(root, new Foundation());
  }

  constructor(root, foundation = undefined, ...args) {
    this.rootEl = root;
    this.initialize(...args);
    this.foundationEl = (
      foundation === undefined
    ) ? (
      this.getDefaultFoundation()
    ) : (
      foundation
    );
    this.foundationEl.init();
    this.initialSyncWithDOM();
  }

  initialize() {}  // eslint-disable-line class-methods-use-this

  getDefaultFoundation() {  // eslint-disable-line class-methods-use-this
    throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
      'foundation class');
  }

  initialSyncWithDOM() {}  // eslint-disable-line class-methods-use-this

  destroy() {
    this.foundationEl.destroy();
  }

  listen(evtType, handler) {
    this.rootEl.addEventListener(evtType, handler);
  }

  unlisten(evtType, handler) {
    this.rootEl.removeEventListener(evtType, handler);
  }

  emit(evtType, evtData, shouldBubble = false) {
    let evt;
    if (typeof CustomEvent === 'function') {
      evt = new CustomEvent(evtType, {
        detail: evtData,
        bubbles: shouldBubble,
      });
    } else {
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(evtType, shouldBubble, false, evtData);
    }

    this.rootEl.dispatchEvent(evt);
  }
}
