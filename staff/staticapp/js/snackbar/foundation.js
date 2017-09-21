//

import Foundation from '../material-base/foundation';
import { cssClasses, strings, numbers } from './constants';


export default class SnackbarFoundation extends Foundation {
  constructor(adapter) {
    super(Object.assign(SnackbarFoundation.defaultAdapter, adapter));

    this.activeV = false;
    this.actionWasClicked = false;
    this.dismissOnActionV = true;
    this.firstFocus = true;
    this.pointerDownRecognized = false;
    this.snackbarHasFocus = false;
    this.snackbarData = null;
    this.queue = [];
    this.actionClickHandler = () => {
      this.actionWasClicked = true;
      this.invokeAction();
    };
    this.visibilitychangeHandler = () => {
      clearTimeout(this.timeoutId);
      this.snackbarHasFocus = true;

      if (!this.adapter.visibilityIsHidden()) {
        setTimeout(
          this.cleanup.bind(this),
          // eslint-disable-next-line comma-dangle
          this.snackbarData.timeout || numbers.MESSAGE_TIMEOUT
        );
      }
    };
    this.interactionHandler = (evt) => {
      if (evt.type === 'touchstart' || evt.type === 'mousedown') {
        this.pointerDownRecognized = true;
      }
      this.handlePossibleTabKeyboardFocus(evt);

      if (evt.type === 'focus') {
        this.pointerDownRecognized = false;
      }
    };
    this.blurHandler = () => {
      clearTimeout(this.timeoutId);
      this.snackbarHasFocus = false;
      this.timeoutId = setTimeout(
        this.cleanup.bind(this),
        // eslint-disable-next-line comma-dangle
        this.snackbarData.timeout || numbers.MESSAGE_TIMEOUT
      );
    };
  }

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
      setAriaHidden: () => {},
      unsetAriaHidden: () => {},
      setActionAriaHidden: () => {},
      unsetActionAriaHidden: () => {},
      setActionText: () => {},
      setMessageText: () => {},
      setFocus: () => {},
      visibilityIsHidden: () => false,
      registerCapturedBlurHandler: () => {},
      deregisterCapturedBlurHandler: () => {},
      registerVisibilityChangeHandler: () => {},
      deregisterVisibilityChangeHandler: () => {},
      registerCapturedInteractionHandler: () => {},
      deregisterCapturedInteractionHandler: () => {},
      registerActionClickHandler: () => {},
      deregisterActionClickHandler: () => {},
      registerTransitionEndHandler: () => {},
      deregisterTransitionEndHandler: () => {},
    };
  }

  get active() {
    return this.activeV;
  }

  init() {
    this.adapter.registerActionClickHandler(this.actionClickHandler);
    this.adapter.setAriaHidden();
    this.adapter.setActionAriaHidden();
  }

  destroy() {
    this.adapter.deregisterActionClickHandler(this.actionClickHandler);
    this.adapter.deregisterCapturedBlurHandler(this.blurHandler);
    this.adapter.deregisterVisibilityChangeHandler(this.visibilitychangeHandler);
    ['touchstart', 'mousedown', 'focus'].forEach((evtType) => {
      this.adapter.deregisterCapturedInteractionHandler(evtType, this.interactionHandler);
    });
  }

  dismissesOnAction() {
    return this.dismissOnActionV;
  }

  setDismissOnAction(dismissOnAction) {
    this.dismissOnActionV = !!dismissOnAction;
  }

  show(data) {
    if (!data) {
      throw new Error(
        'Please provide a data object with at least a message to display.');
    }
    if (!data.message) {
      throw new Error('Please provide a message to be displayed.');
    }
    if (data.actionHandler && !data.actionText) {
      throw new Error('Please provide action text with the handler.');
    }
    if (this.active) {
      this.queue.push(data);
      return;
    }
    clearTimeout(this.timeoutId);
    this.snackbarData = data;
    this.firstFocus = true;
    this.adapter.registerVisibilityChangeHandler(this.visibilitychangeHandler);
    this.adapter.registerCapturedBlurHandler(this.blurHandler);
    ['touchstart', 'mousedown', 'focus'].forEach((evtType) => {
      this.adapter.registerCapturedInteractionHandler(evtType, this.interactionHandler);
    });

    const { ACTIVE, MULTILINE, ACTION_ON_BOTTOM } = cssClasses;

    this.adapter.setMessageText(this.snackbarData.message);

    if (this.snackbarData.multiline) {
      this.adapter.addClass(MULTILINE);
      if (this.snackbarData.actionOnBottom) {
        this.adapter.addClass(ACTION_ON_BOTTOM);
      }
    }

    if (this.snackbarData.actionHandler) {
      this.adapter.setActionText(this.snackbarData.actionText);
      this.actionHandlerFn = this.snackbarData.actionHandler;
      this.setActionHidden(false);
    } else {
      this.setActionHidden(true);
      this.actionHandlerFn = null;
      this.adapter.setActionText(null);
    }

    this.activeV = true;
    this.adapter.addClass(ACTIVE);
    this.adapter.unsetAriaHidden();

    this.timeoutId = setTimeout(
      this.cleanup.bind(this),
      // eslint-disable-next-line comma-dangle
      this.snackbarData.timeout || numbers.MESSAGE_TIMEOUT
    );
  }

  handlePossibleTabKeyboardFocus() {
    const hijackFocus =
      this.firstFocus && !this.pointerDownRecognized;

    if (hijackFocus) {
      this.setFocusOnAction();
    }

    this.firstFocus = false;
  }

  setFocusOnAction() {
    this.adapter.setFocus();
    this.snackbarHasFocus = true;
    this.firstFocus = false;
  }

  invokeAction() {
    try {
      if (!this.actionHandlerFn) {
        return;
      }

      this.actionHandlerFn();
    } finally {
      if (this.dismissOnActionV) {
        this.cleanup();
      }
    }
  }

  cleanup() {
    const allowDismissal = !this.snackbarHasFocus || this.actionWasClicked;

    if (allowDismissal) {
      const { ACTIVE, MULTILINE, ACTION_ON_BOTTOM } = cssClasses;

      this.adapter.removeClass(ACTIVE);

      const handler = () => {
        clearTimeout(this.timeoutId);
        this.adapter.deregisterTransitionEndHandler(handler);
        this.adapter.removeClass(MULTILINE);
        this.adapter.removeClass(ACTION_ON_BOTTOM);
        this.setActionHidden(true);
        this.adapter.setAriaHidden();
        this.activeV = false;
        this.snackbarHasFocus = false;
        this.showNext();
      };

      this.adapter.registerTransitionEndHandler(handler);
    }
  }

  showNext() {
    if (!this.queue.length) {
      return;
    }
    this.show(this.queue.shift());
  }

  setActionHidden(isHidden) {
    if (isHidden) {
      this.adapter.setActionAriaHidden();
    } else {
      this.adapter.unsetActionAriaHidden();
    }
  }
}
