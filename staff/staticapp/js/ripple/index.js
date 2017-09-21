//

import Component from '../material-base/component';
import RippleFoundation from './foundation';
import * as utils from './utils';

export { RippleFoundation };
export { utils };

export class Ripple extends Component {
  static attachTo(root, { isUnbounded = undefined } = {}) {
    const ripple = new Ripple(root);
    // Only override unbounded behavior if option is explicitly specified.
    if (isUnbounded !== undefined) {
      ripple.unbounded = (isUnbounded);
    }
    return ripple;
  }

  static createAdapter(instance) {
    const MATCHES = utils.getMatchesProperty(HTMLElement.prototype);

    return {
      browserSupportsCssVars: () => utils.supportsCssVariables(window),
      isUnbounded: () => instance.unbounded,
      isSurfaceActive: () => instance.rootEl[MATCHES](':active'),
      isSurfaceDisabled: () => instance.disabled,
      addClass: className => instance.rootEl.classList.add(className),
      removeClass: className => instance.rootEl.classList.remove(className),
      registerInteractionHandler: (evtType, handler) =>
        instance.rootEl.addEventListener(evtType, handler, utils.applyPassive()),
      deregisterInteractionHandler: (evtType, handler) =>
        instance.rootEl.removeEventListener(evtType, handler, utils.applyPassive()),
      registerResizeHandler: handler => window.addEventListener('resize', handler),
      deregisterResizeHandler: handler => window.removeEventListener('resize', handler),
      updateCssVariable: (varName, value) => instance.rootEl.style.setProperty(varName, value),
      computeBoundingRect: () => instance.rootEl.getBoundingClientRect(),
      getWindowPageOffset: () => ({ x: window.pageXOffset, y: window.pageYOffset }),
    };
  }

  constructor(...args) {
    super(...args);

    this.disabled = false;

    this.elUnbounded;  // eslint-disable-line no-unused-expressions
  }

  get unbounded() {
    return this.elUnbounded;
  }

  set unbounded(unbounded) {
    const { UNBOUNDED } = RippleFoundation.cssClasses;
    this.elUnbounded = Boolean(unbounded);
    if (this.elUnbounded) {
      this.rootEl.classList.add(UNBOUNDED);
    } else {
      this.rootEl.classList.remove(UNBOUNDED);
    }
  }

  getDefaultFoundation() {
    return new RippleFoundation(Ripple.createAdapter(this));
  }

  activate() {
    this.foundationEl.activate();
  }

  deactivate() {
    this.foundationEl.deactivate();
  }

  layout() {
    this.foundationEl.layout();
  }

  initialSyncWithDOM() {
    this.unbounded = 'rippleIsUnbounded' in this.rootEl.dataset;
  }
}

class RippleCapableSurface {}

RippleCapableSurface.prototype.rootEl;  // eslint-disable-line no-unused-expressions

RippleCapableSurface.prototype.unbounded;  // eslint-disable-line no-unused-expressions

RippleCapableSurface.prototype.disabled;  // eslint-disable-line no-unused-expressions
