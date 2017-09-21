//

import Component from '../material-base/component';
import SnackbarFoundation from './foundation';
import { getCorrectEventName } from '../material-animations/index';


export { SnackbarFoundation };

export class Snackbar extends Component {
  static attachTo(root) {
    return new Snackbar(root);
  }

  get dismissesOnAction() {
    return this.foundationEl.dismissesOnAction();
  }

  set dismissesOnAction(dismissesOnAction) {
    this.foundationEl.setDismissOnAction(dismissesOnAction);
  }

  getDefaultFoundation() {
    const {
      TEXT_SELECTOR,
      ACTION_BUTTON_SELECTOR,
    } = SnackbarFoundation.strings;
    const getText = () => this.rootEl.querySelector(TEXT_SELECTOR);
    const getActionButton = () => this.rootEl.querySelector(ACTION_BUTTON_SELECTOR);

    /* eslint brace-style: "off" */
    return new SnackbarFoundation({
      addClass: className => this.rootEl.classList.add(className),
      removeClass: className => this.rootEl.classList.remove(className),
      setAriaHidden: () => this.rootEl.setAttribute('aria-hidden', 'true'),
      unsetAriaHidden: () => this.rootEl.removeAttribute('aria-hidden'),
      setActionAriaHidden: () => getActionButton().setAttribute('aria-hidden', 'true'),
      unsetActionAriaHidden: () => getActionButton().removeAttribute('aria-hidden'),
      setActionText: (text) => { getActionButton().textContent = text; },
      setMessageText: (text) => { getText().textContent = text; },
      setFocus: () => getActionButton().focus(),
      visibilityIsHidden: () => document.hidden,
      registerCapturedBlurHandler: handler =>
        getActionButton().addEventListener('blur', handler, true),
      deregisterCapturedBlurHandler: handler =>
        getActionButton().removeEventListener('blur', handler, true),
      registerVisibilityChangeHandler: handler =>
        document.addEventListener('visibilitychange', handler),
      deregisterVisibilityChangeHandler: handler =>
        document.removeEventListener('visibilitychange', handler),
      registerCapturedInteractionHandler: (evt, handler) =>
        document.body.addEventListener(evt, handler, true),
      deregisterCapturedInteractionHandler: (evt, handler) =>
        document.body.removeEventListener(evt, handler, true),
      registerActionClickHandler: handler =>
        getActionButton().addEventListener('click', handler),
      deregisterActionClickHandler: handler =>
        getActionButton().removeEventListener('click', handler),
      registerTransitionEndHandler: handler =>
        this.rootEl.addEventListener(
          getCorrectEventName(window, 'transitionend'),
          handler  // eslint-disable-line comma-dangle
        ),
      deregisterTransitionEndHandler: handler =>
        this.rootEl.removeEventListener(
          getCorrectEventName(window, 'transitionend'),
          handler  // eslint-disable-line comma-dangle
        ),
    });
  }

  show(data) {
    this.foundationEl.show(data);
  }
}
