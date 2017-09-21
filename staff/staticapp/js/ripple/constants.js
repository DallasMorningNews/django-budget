// export const cssClasses = {
//   // Ripple is a special case where the "root" component is really a "mixin" of sorts,
//   // given that it's an 'upgrade' to an existing component. That being said it is the root
//   // CSS class that all other CSS classes derive from.
//   ROOT: 'mdc-ripple-upgraded',
//   UNBOUNDED: 'mdc-ripple-upgraded--unbounded',
//   BG_FOCUSED: 'mdc-ripple-upgraded--background-focused',
//   BG_ACTIVE_FILL: 'mdc-ripple-upgraded--background-active-fill',
//   FG_ACTIVATION: 'mdc-ripple-upgraded--foreground-activation',
//   FG_DEACTIVATION: 'mdc-ripple-upgraded--foreground-deactivation',
// };

export const cssClasses = {
  // Ripple is a special case where the "root" component is really a "mixin" of sorts,
  // given that it's an 'upgrade' to an existing component. That being said it is the root
  // CSS class that all other CSS classes derive from.
  ROOT: 'has-js',
  UNBOUNDED: 'ripple--unbounded',
  BG_FOCUSED: 'ripple--background-focused',
  BG_ACTIVE_FILL: 'ripple--background-active-fill',
  FG_ACTIVATION: 'ripple--foreground-activation',
  FG_DEACTIVATION: 'ripple--foreground-deactivation',
};

// export const strings = {
//   VAR_SURFACE_WIDTH: '--mdc-ripple-surface-width',
//   VAR_SURFACE_HEIGHT: '--mdc-ripple-surface-height',
//   VAR_FG_SIZE: '--mdc-ripple-fg-size',
//   VAR_LEFT: '--mdc-ripple-left',
//   VAR_TOP: '--mdc-ripple-top',
//   VAR_FG_SCALE: '--mdc-ripple-fg-scale',
//   VAR_FG_TRANSLATE_START: '--mdc-ripple-fg-translate-start',
//   VAR_FG_TRANSLATE_END: '--mdc-ripple-fg-translate-end',
// };

export const strings = {
  VAR_SURFACE_WIDTH: '--ripple-surface-width',
  VAR_SURFACE_HEIGHT: '--ripple-surface-height',
  VAR_FG_SIZE: '--ripple-foreground-size',
  VAR_LEFT: '--ripple-left',
  VAR_TOP: '--ripple-top',
  VAR_FG_SCALE: '--ripple-foreground-scale',
  VAR_FG_TRANSLATE_START: '--ripple-foreground-translate-start',
  VAR_FG_TRANSLATE_END: '--ripple-foreground-translate-end',
};

export const numbers = {
  PADDING: 10,
  INITIAL_ORIGIN_SCALE: 0.6,
  DEACTIVATION_TIMEOUT_MS: 300,
  FG_DEACTIVATION_MS: 83,
};
