//

import Component from '../material-base/component';

import { Tab, TabFoundation } from './index-tab';
import TabBarFoundation from './foundation';

export { TabBarFoundation };

export class TabBar extends Component {
  static attachTo(root) {
    return new TabBar(root);
  }

  get tabs() {
    return this.tabsObj;
  }

  get activeTab() {
    const activeIndex = this.foundationEl.getActiveTabIndex();
    return this.tabs[activeIndex];
  }

  set activeTab(tab) {
    this.setActiveTab(tab, false);
  }

  get activeTabIndex() {
    return this.foundationEl.getActiveTabIndex();
  }

  set activeTabIndex(index) {
    this.setActiveTabIndex(index, false);
  }

  getDefaultFoundation() {
    return new TabBarFoundation({
      addClass: className => this.rootEl.classList.add(className),
      removeClass: className => this.rootEl.classList.remove(className),
      bindOnTabSelectedEvent: () => this.listen(
        TabFoundation.strings.SELECTED_EVENT,
        this.tabSelectedHandler  // eslint-disable-line comma-dangle
      ),
      unbindOnTabSelectedEvent: () => this.unlisten(
        TabFoundation.strings.SELECTED_EVENT,
        this.tabSelectedHandler  // eslint-disable-line comma-dangle
      ),
      registerResizeHandler: handler => window.addEventListener('resize', handler),
      deregisterResizeHandler: handler => window.removeEventListener('resize', handler),
      getOffsetWidth: () => this.rootEl.offsetWidth,
      setStyleForIndicator: (propertyName, value) => this.indicator.style.setProperty(
        propertyName,
        value  // eslint-disable-line comma-dangle
      ),
      getOffsetWidthForIndicator: () => this.indicator.offsetWidth,
      notifyChange: evtData => this.emit(TabBarFoundation.strings.CHANGE_EVENT, evtData),
      getNumberOfTabs: () => this.tabs.length,
      isTabActiveAtIndex: index => this.tabs[index].isActive,
      setTabActiveAtIndex: (index, isActive) => {
        this.tabs[index].isActive = isActive;
      },
      isDefaultPreventedOnClickForTabAtIndex: index => this.tabs[index].preventDefaultOnClick,
      setPreventDefaultOnClickForTabAtIndex: (index, preventDefaultOnClick) => {
        this.tabs[index].preventDefaultOnClick = preventDefaultOnClick;
      },
      measureTabAtIndex: index => this.tabs[index].measureSelf(),
      getComputedWidthForTabAtIndex: index => this.tabs[index].computedWidth,
      getComputedLeftForTabAtIndex: index => this.tabs[index].computedLeft,
    });
  }

  setActiveTabIndex(activeTabIndex, notifyChange) {
    this.foundationEl.switchToTabAtIndex(activeTabIndex, notifyChange);
  }

  setActiveTab(activeTab, notifyChange) {
    const indexOfTab = this.tabs.indexOf(activeTab);
    if (indexOfTab < 0) {
      throw new Error('Invalid tab component given as activeTab: Tab not found within this component\'s tab list');
    }
    this.setActiveTabIndex(indexOfTab, notifyChange);
  }

  layout() {
    this.foundationEl.layout();
  }

  gatherTabs(tabFactory) {
    const tabElements = [].slice.call(
      // eslint-disable-next-line comma-dangle
      this.rootEl.querySelectorAll(TabBarFoundation.strings.TAB_SELECTOR)
    );
    return tabElements.map(el => tabFactory(el));
  }

  initialize(tabFactory = el => new Tab(el)) {
    this.indicator = this.rootEl.querySelector(TabBarFoundation.strings.INDICATOR_SELECTOR);
    this.tabsObj = this.gatherTabs(tabFactory);
    this.tabSelectedHandler = ({ detail }) => {
      const { tab } = detail;
      this.setActiveTab(tab, true);
    };
  }
}
