//

import Foundation from '../material-base/foundation';
import { cssClasses, strings, numbers } from './constants';
import { getNormalizedEventCoords } from './utils';

const DEACTIVATION_ACTIVATION_PAIRS = {
  mouseup: 'mousedown',
  pointerup: 'pointerdown',
  touchend: 'touchstart',
  keyup: 'keydown',
  blur: 'focus',
};

export default class RippleFoundation extends Foundation {
  static get cssClasses() {
    return cssClasses;
  }

  static get strings() {
    return strings;
  }

  static get numbers() {
    return numbers;
  }

  static get defaultAdapter() {
    return {
      browserSupportsCssVars: () => {},
      isUnbounded: () => {},
      isSurfaceActive: () => {},
      isSurfaceDisabled: () => {},
      addClass: () => {},
      removeClass: () => {},
      registerInteractionHandler: () => {},
      deregisterInteractionHandler: () => {},
      registerResizeHandler: () => {},
      deregisterResizeHandler: () => {},
      updateCssVariable: () => {},
      computeBoundingRect: () => {},
      getWindowPageOffset: () => {},
    };
  }

  // We compute this property so that we are not querying information
  // about the client until the point in time where the foundation
  // requests it.
  // This prevents scenarios where client-side feature-detection may
  // happen too early, such as when components are rendered on
  // the server and then initialized at mount time on the client.
  get isSupported() {
    return this.adapter.browserSupportsCssVars();
  }

  constructor(adapter) {
    super(Object.assign(RippleFoundation.defaultAdapter, adapter));

    this.layoutFrame = 0;

    this.frame = ({ width: 0, height: 0 });

    this.activationStateObj = this.defaultActivationState();

    this.xfDuration = 0;

    this.initialSize = 0;

    this.maxRadius = 0;

    this.listenerInfos = [
      { activate: 'touchstart', deactivate: 'touchend' },
      { activate: 'pointerdown', deactivate: 'pointerup' },
      { activate: 'mousedown', deactivate: 'mouseup' },
      { activate: 'keydown', deactivate: 'keyup' },
      { focus: 'focus', blur: 'blur' },
    ];

    this.listeners = {
      activate: (e) => { this.activateBtn(e); },
      deactivate: (e) => { this.deactivateBtn(e); },
      focus: () => requestAnimationFrame(() => {
        this.adapter.addClass(RippleFoundation.cssClasses.BG_FOCUSED);
      }),
      blur: () => requestAnimationFrame(() => {
        this.adapter.removeClass(RippleFoundation.cssClasses.BG_FOCUSED);
      }),
    };

    this.resizeHandlerFn = () => this.layout();

    this.unboundedCoords = {
      left: 0,
      top: 0,
    };

    this.fgScale = 0;

    this.activationTimer = 0;

    this.fgDeactivationRemovalTimer = 0;

    this.activationAnimationHasEnded = false;

    this.activationTimerCallback = () => {
      this.activationAnimationHasEnded = true;
      this.runDeactivationUXLogicIfReady();
    };
  }

  defaultActivationState() {  // eslint-disable-line class-methods-use-this
    return {
      isActivated: false,
      hasDeactivationUXRun: false,
      wasActivatedByPointer: false,
      wasElementMadeActive: false,
      activationStartTime: 0,
      activationEvent: null,
      isProgrammatic: false,
    };
  }

  init() {
    if (!this.isSupported) {
      return;
    }
    this.addEventListeners();

    const { ROOT, UNBOUNDED } = RippleFoundation.cssClasses;
    requestAnimationFrame(() => {
      this.adapter.addClass(ROOT);
      if (this.adapter.isUnbounded()) {
        this.adapter.addClass(UNBOUNDED);
      }
      this.layoutInternal();
    });
  }

  addEventListeners() {
    this.listenerInfos.forEach((info) => {
      Object.keys(info).forEach((k) => {
        this.adapter.registerInteractionHandler(info[k], this.listeners[k]);
      });
    });
    this.adapter.registerResizeHandler(this.resizeHandlerFn);
  }

  activateBtn(e) {
    if (this.adapter.isSurfaceDisabled()) {
      return;
    }

    const { activationStateObj: activationState } = this;
    if (activationState.isActivated) {
      return;
    }

    activationState.isActivated = true;
    activationState.isProgrammatic = e === null;
    activationState.activationEvent = e;
    activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : (
      e.type === 'mousedown' || e.type === 'touchstart' || e.type === 'pointerdown'
    );
    activationState.activationStartTime = Date.now();

    requestAnimationFrame(() => {
      // This needs to be wrapped in an rAF call b/c web browsers
      // report active states inconsistently when they're called within
      // event handling code:
      // - https://bugs.chromium.org/p/chromium/issues/detail?id=635971
      // - https://bugzilla.mozilla.org/show_bug.cgi?id=1293741
      activationState.wasElementMadeActive = (e && e.type === 'keydown') ? this.adapter.isSurfaceActive() : true;
      if (activationState.wasElementMadeActive) {
        this.animateActivation();
      } else {
        // Reset activation state immediately if element was not made active.
        this.activationStateObj = this.defaultActivationState();
      }
    });
  }

  activate() {
    this.activateBtn(null);
  }

  animateActivation() {
    const {
      VAR_FG_TRANSLATE_START,
      VAR_FG_TRANSLATE_END,
    } = RippleFoundation.strings;
    const {
      BG_ACTIVE_FILL,
      FG_DEACTIVATION,
      FG_ACTIVATION,
    } = RippleFoundation.cssClasses;
    const { DEACTIVATION_TIMEOUT_MS } = RippleFoundation.numbers;

    let translateStart = '';
    let translateEnd = '';

    if (!this.adapter.isUnbounded()) {
      const { startPoint, endPoint } = this.getFgTranslationCoordinates();
      translateStart = `${startPoint.x}px, ${startPoint.y}px`;
      translateEnd = `${endPoint.x}px, ${endPoint.y}px`;
    }

    this.adapter.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
    this.adapter.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
    // Cancel any ongoing activation/deactivation animations
    clearTimeout(this.activationTimer);
    clearTimeout(this.fgDeactivationRemovalTimer);
    this.rmBoundedActivationClasses();
    this.adapter.removeClass(FG_DEACTIVATION);

    // Force layout in order to re-trigger the animation.
    this.adapter.computeBoundingRect();
    this.adapter.addClass(BG_ACTIVE_FILL);
    this.adapter.addClass(FG_ACTIVATION);
    this.activationTimer = setTimeout(() => {
      this.activationTimerCallback();
    }, DEACTIVATION_TIMEOUT_MS);
  }

  getFgTranslationCoordinates() {
    const { activationStateObj: activationState } = this;
    const { activationEvent, wasActivatedByPointer } = activationState;

    let startPoint;
    if (wasActivatedByPointer) {
      startPoint = getNormalizedEventCoords(
        (activationEvent),
        this.adapter.getWindowPageOffset(),
        this.adapter.computeBoundingRect()  // eslint-disable-line comma-dangle
      );
    } else {
      startPoint = {
        x: this.frame.width / 2,
        y: this.frame.height / 2,
      };
    }
    // Center the element around the start point.
    startPoint = {
      x: startPoint.x - (this.initialSize / 2),
      y: startPoint.y - (this.initialSize / 2),
    };

    const endPoint = {
      x: (this.frame.width / 2) - (this.initialSize / 2),
      y: (this.frame.height / 2) - (this.initialSize / 2),
    };

    return { startPoint, endPoint };
  }

  runDeactivationUXLogicIfReady() {
    const { FG_DEACTIVATION } = RippleFoundation.cssClasses;
    const { hasDeactivationUXRun, isActivated } = this.activationStateObj;
    const activationHasEnded = hasDeactivationUXRun || !isActivated;
    if (activationHasEnded && this.activationAnimationHasEnded) {
      this.rmBoundedActivationClasses();
      this.adapter.addClass(FG_DEACTIVATION);
      this.fgDeactivationRemovalTimer = setTimeout(() => {
        this.adapter.removeClass(FG_DEACTIVATION);
      }, numbers.FG_DEACTIVATION_MS);
    }
  }

  rmBoundedActivationClasses() {
    const { BG_ACTIVE_FILL, FG_ACTIVATION } = RippleFoundation.cssClasses;
    this.adapter.removeClass(BG_ACTIVE_FILL);
    this.adapter.removeClass(FG_ACTIVATION);
    this.activationAnimationHasEnded = false;
    this.adapter.computeBoundingRect();
  }

  deactivateBtn(e) {
    const { activationStateObj: activationState } = this;
    // This can happen in scenarios such as when you have a keyup event that blurs the element.
    if (!activationState.isActivated) {
      return;
    }
    // Programmatic deactivation.
    if (activationState.isProgrammatic) {
      const evtObject = null;
      const state = (Object.assign({}, activationState));
      requestAnimationFrame(() => this.animateDeactivation(evtObject, state));
      this.activationStateObj = this.defaultActivationState();
      return;
    }

    const actualActivationType = DEACTIVATION_ACTIVATION_PAIRS[e.type];
    const expectedActivationType = activationState.activationEvent.type;
    // NOTE: Pointer events are tricky - https://patrickhlauke.github.io/touch/tests/results/
    // Essentially, what we need to do here is decouple the deactivation UX from the actual
    // deactivation state itself. This way, touch/pointer events in sequence do not trample one
    // another.
    const needsDeactivationUX = actualActivationType === expectedActivationType;
    let needsActualDeactivation = needsDeactivationUX;
    if (activationState.wasActivatedByPointer) {
      needsActualDeactivation = e.type === 'mouseup';
    }

    const state = (Object.assign({}, activationState));
    requestAnimationFrame(() => {
      if (needsDeactivationUX) {
        this.activationStateObj.hasDeactivationUXRun = true;
        this.animateDeactivation(e, state);
      }

      if (needsActualDeactivation) {
        this.activationStateObj = this.defaultActivationState();
      }
    });
  }

  deactivate() {
    this.deactivateBtn(null);
  }

  animateDeactivation(e, { wasActivatedByPointer, wasElementMadeActive }) {
    const { BG_FOCUSED } = RippleFoundation.cssClasses;
    if (wasActivatedByPointer || wasElementMadeActive) {
      // Remove class left over by element being focused
      this.adapter.removeClass(BG_FOCUSED);
      this.runDeactivationUXLogicIfReady();
    }
  }

  destroy() {
    if (!this.isSupported) {
      return;
    }
    this.removeEventListeners();

    const { ROOT, UNBOUNDED } = RippleFoundation.cssClasses;
    requestAnimationFrame(() => {
      this.adapter.removeClass(ROOT);
      this.adapter.removeClass(UNBOUNDED);
      this.removeCssVars();
    });
  }

  removeEventListeners() {
    this.listenerInfos.forEach((info) => {
      Object.keys(info).forEach((k) => {
        this.adapter.deregisterInteractionHandler(info[k], this.listeners[k]);
      });
    });
    this.adapter.deregisterResizeHandler(this.resizeHandlerFn);
  }

  removeCssVars() {
    const { stringVars } = RippleFoundation;
    Object.keys(stringVars).forEach((k) => {
      if (k.indexOf('VAR_') === 0) {
        this.adapter.updateCssVariable(stringVars[k], null);
      }
    });
  }

  layout() {
    if (this.layoutFrame) {
      cancelAnimationFrame(this.layoutFrame);
    }
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutInternal();
      this.layoutFrame = 0;
    });
  }

  layoutInternal() {
    this.frame = this.adapter.computeBoundingRect();

    const maxDim = Math.max(this.frame.height, this.frame.width);
    const surfaceDiameter = Math.sqrt((
      this.frame.width * this.frame.width
    ) + (
      this.frame.height * this.frame.height
    ));
    // const surfaceDiameter = 0;

    // 60% of the largest dimension of the surface
    this.initialSize = maxDim * RippleFoundation.numbers.INITIAL_ORIGIN_SCALE;

    // Diameter of the surface + 10px
    this.maxRadius = surfaceDiameter + RippleFoundation.numbers.PADDING;
    this.fgScale = this.maxRadius / this.initialSize;
    this.xfDuration = 1000 * Math.sqrt(this.maxRadius / 1024);
    this.updateLayoutCssVars();
  }

  updateLayoutCssVars() {
    const {
      VAR_SURFACE_WIDTH, VAR_SURFACE_HEIGHT, VAR_FG_SIZE,
      VAR_LEFT, VAR_TOP, VAR_FG_SCALE,
    } = RippleFoundation.strings;

    this.adapter.updateCssVariable(VAR_SURFACE_WIDTH, `${this.frame.width}px`);
    this.adapter.updateCssVariable(VAR_SURFACE_HEIGHT, `${this.frame.height}px`);
    this.adapter.updateCssVariable(VAR_FG_SIZE, `${this.initialSize}px`);
    this.adapter.updateCssVariable(VAR_FG_SCALE, this.fgScale);

    if (this.adapter.isUnbounded()) {
      this.unboundedCoords = {
        left: Math.round((this.frame.width / 2) - (this.initialSize / 2)),
        top: Math.round((this.frame.height / 2) - (this.initialSize / 2)),
      };

      this.adapter.updateCssVariable(VAR_LEFT, `${this.unboundedCoords.left}px`);
      this.adapter.updateCssVariable(VAR_TOP, `${this.unboundedCoords.top}px`);
    }
  }
}
