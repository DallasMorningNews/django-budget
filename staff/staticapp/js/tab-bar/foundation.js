//

import Foundation from '../material-base/foundation';
import { getCorrectPropertyName } from '../material-animations/index';

import { cssClasses, strings } from './constants';

export default class TabBarFoundation extends Foundation {
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
      bindOnTabSelectedEvent: () => {},
      unbindOnTabSelectedEvent: () => {},
      registerResizeHandler: () => {},
      deregisterResizeHandler: () => {},
      getOffsetWidth: () => 0,
      setStyleForIndicator: () => {},
      getOffsetWidthForIndicator: () => 0,
      notifyChange: () => {},
      getNumberOfTabs: () => 0,
      isTabActiveAtIndex: () => false,
      setTabActiveAtIndex: () => {},
      isDefaultPreventedOnClickForTabAtIndex: () => false,
      setPreventDefaultOnClickForTabAtIndex: () => {},
      measureTabAtIndex: () => {},
      getComputedWidthForTabAtIndex: () => 0,
      getComputedLeftForTabAtIndex: () => 0,
    };
  }

  constructor(adapter) {
    super(Object.assign(TabBarFoundation.defaultAdapter, adapter));

    this.isIndicatorShown = false;
    this.computedWidth = 0;
    this.computedLeft = 0;
    this.activeTabIndexV = 0;
    this.layoutFrame = 0;
    this.resizeHandlerFn = () => this.layout();
  }

  init() {
    this.adapter.addClass(cssClasses.UPGRADED);
    this.adapter.bindOnTabSelectedEvent();
    this.adapter.registerResizeHandler(this.resizeHandlerFn);
    const activeTabIndex = this.findActiveTabIndex();
    if (activeTabIndex >= 0) {
      this.activeTabIndexV = activeTabIndex;
    }
    this.layout();
  }

  destroy() {
    this.adapter.removeClass(cssClasses.UPGRADED);
    this.adapter.unbindOnTabSelectedEvent();
    this.adapter.deregisterResizeHandler(this.resizeHandlerFn);
  }

  layoutInternal() {
    this.forEachTabIndex(index => this.adapter.measureTabAtIndex(index));
    this.computedWidth = this.adapter.getOffsetWidth();
    this.layoutIndicator();
  }

  layoutIndicator() {
    const isIndicatorFirstRender = !this.isIndicatorShown;

    // Ensure that indicator appears in the right position immediately for correct first render.
    if (isIndicatorFirstRender) {
      this.adapter.setStyleForIndicator('transition', 'none');
    }

    const translateAmtForActiveTabLeft = this.adapter.getComputedLeftForTabAtIndex(
      this.activeTabIndexV  // eslint-disable-line comma-dangle
    );
    const scaleAmtForActiveTabWidth = this.adapter.getComputedWidthForTabAtIndex(
      this.activeTabIndexV  // eslint-disable-line comma-dangle
    ) / this.adapter.getOffsetWidth();

    const transformValue = `translateX(${translateAmtForActiveTabLeft}px) scale(${scaleAmtForActiveTabWidth}, 1)`;
    this.adapter.setStyleForIndicator(
      getCorrectPropertyName(window, 'transform'),
      transformValue  // eslint-disable-line comma-dangle
    );

    if (isIndicatorFirstRender) {
      // Force layout so that transform styles to take effect.
      this.adapter.getOffsetWidthForIndicator();
      this.adapter.setStyleForIndicator('transition', '');
      this.adapter.setStyleForIndicator('visibility', 'visible');
      this.isIndicatorShown = true;
    }
  }

  findActiveTabIndex() {
    let activeTabIndex = -1;
    this.forEachTabIndex((index) => {
      if (this.adapter.isTabActiveAtIndex(index)) {
        activeTabIndex = index;
        return true;
      }
      return false;
    });
    return activeTabIndex;
  }

  forEachTabIndex(iterator) {
    const numTabs = this.adapter.getNumberOfTabs();
    for (let index = 0; index < numTabs; index += 1) {
      const shouldBreak = iterator(index);
      if (shouldBreak) {
        break;
      }
    }
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

  switchToTabAtIndex(index, shouldNotify) {
    if (index === this.activeTabIndexV) {
      return;
    }

    if (index < 0 || index >= this.adapter.getNumberOfTabs()) {
      throw new Error(`Out of bounds index specified for tab: ${index}`);
    }

    const prevActiveTabIndex = this.activeTabIndexV;
    this.activeTabIndexV = index;
    requestAnimationFrame(() => {
      if (prevActiveTabIndex >= 0) {
        this.adapter.setTabActiveAtIndex(prevActiveTabIndex, false);
      }
      this.adapter.setTabActiveAtIndex(this.activeTabIndexV, true);
      this.layoutIndicator();
      if (shouldNotify) {
        this.adapter.notifyChange({ activeTabIndex: this.activeTabIndexV });
      }
    });
  }

  getActiveTabIndex() {
    return this.findActiveTabIndex();
  }
}
