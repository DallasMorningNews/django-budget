//

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
