let supportsCSSVariables;

let supportsPassive;

function detectEdgePseudoVarBug(windowObj) {
  // Detect versions of Edge with buggy var() support
  // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11495448/
  const document = windowObj.document;
  const node = document.createElement('div');
  node.className = 'mdc-ripple-surface--test-edge-var-bug';
  document.body.appendChild(node);

  // The bug exists if ::before style ends up propagating to the parent element.
  // Additionally, getComputedStyle returns null in iframes with display: "none" in Firefox,
  // but Firefox is known to support CSS custom properties correctly.
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
  const computedStyle = windowObj.getComputedStyle(node);
  const hasPseudoVarBug = computedStyle !== null && computedStyle.borderTopStyle === 'solid';
  node.remove();
  return hasPseudoVarBug;
}

export function supportsCssVariables(windowObj, forceRefresh = false) {
  if (typeof supportsCSSVariables === 'boolean' && !forceRefresh) {
    return supportsCSSVariables;
  }

  const supportsFunctionPresent = windowObj.CSS && typeof windowObj.CSS.supports === 'function';
  if (!supportsFunctionPresent) {
    return null;
  }

  const explicitlySupportsCssVars = windowObj.CSS.supports('--css-vars', 'yes');
  // See: https://bugs.webkit.org/show_bug.cgi?id=154669
  // See: README section on Safari
  const weAreFeatureDetectingSafari10plus = (
    windowObj.CSS.supports('(--css-vars: yes)') &&
    windowObj.CSS.supports('color', '#00000000')
  );

  if (explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus) {
    supportsCSSVariables = !detectEdgePseudoVarBug(windowObj);
  } else {
    supportsCSSVariables = false;
  }
  return supportsCSSVariables;
}

export function applyPassive(globalObj = window, forceRefresh = false) {
  if (supportsPassive === undefined || forceRefresh) {
    let isSupported = false;
    try {
      globalObj.document.addEventListener('test', null, { get passive() {
        isSupported = true;
      } });
    } catch (e) {
      //
    }

    supportsPassive = isSupported;
  }

  return supportsPassive ? { passive: true } : false;
}

export function getMatchesProperty(HTMLElementPrototype) {
  return [
    'webkitMatchesSelector', 'msMatchesSelector', 'matches',
  ].filter(p => p in HTMLElementPrototype).pop();
}

export function getNormalizedEventCoords(ev, pageOffset, clientRect) {
  const { x, y } = pageOffset;
  const documentX = x + clientRect.left;
  const documentY = y + clientRect.top;

  let normalizedX;
  let normalizedY;
  // Determine touch point relative to the ripple container.
  if (ev.type === 'touchstart') {
    normalizedX = ev.changedTouches[0].pageX - documentX;
    normalizedY = ev.changedTouches[0].pageY - documentY;
  } else {
    normalizedX = ev.pageX - documentX;
    normalizedY = ev.pageY - documentY;
  }

  return { x: normalizedX, y: normalizedY };
}
