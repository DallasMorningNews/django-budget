export default class Foundation {
  static get cssClasses() {
    return {};
  }

  static get strings() {
    return {};
  }

  static get numbers() {
    return {};
  }

  static get defaultAdapter() {
    return {};
  }

  constructor(adapter = {}) {
    this.adapter = adapter;
  }

  init() {}  // eslint-disable-line class-methods-use-this

  destroy() {}  // eslint-disable-line class-methods-use-this
}
