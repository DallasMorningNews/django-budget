const eventTypeMap = {
  animationstart: {
    noPrefix: 'animationstart',
    webkitPrefix: 'webkitAnimationStart',
    styleProperty: 'animation',
  },
  animationend: {
    noPrefix: 'animationend',
    webkitPrefix: 'webkitAnimationEnd',
    styleProperty: 'animation',
  },
  animationiteration: {
    noPrefix: 'animationiteration',
    webkitPrefix: 'webkitAnimationIteration',
    styleProperty: 'animation',
  },
  transitionend: {
    noPrefix: 'transitionend',
    webkitPrefix: 'webkitTransitionEnd',
    styleProperty: 'transition',
  },
};


const cssPropertyMap = {
  animation: {
    noPrefix: 'animation',
    webkitPrefix: '-webkit-animation',
  },
  transform: {
    noPrefix: 'transform',
    webkitPrefix: '-webkit-transform',
  },
  transition: {
    noPrefix: 'transition',
    webkitPrefix: '-webkit-transition',
  },
};


function hasProperShape(windowObj) {
  return (
    (windowObj.document !== undefined) &&
    (typeof windowObj.document.createElement === 'function')
  );
}


function eventFoundInMaps(eventType) {
  return (eventType in eventTypeMap || eventType in cssPropertyMap);
}


function getJavaScriptEventName(eventType, map, el) {
  return (
    map[eventType].styleProperty in el.style
  ) ? (
    map[eventType].noPrefix
  ) : (
    map[eventType].webkitPrefix
  );
}


function getAnimationName(windowObj, eventType) {
  if (!hasProperShape(windowObj) || !eventFoundInMaps(eventType)) {
    return eventType;
  }

  const map = (
    eventType in eventTypeMap ? eventTypeMap : cssPropertyMap
  );
  const el = windowObj.document.createElement('div');
  let eventName = '';

  if (map === eventTypeMap) {
    eventName = getJavaScriptEventName(eventType, map, el);
  } else {
    eventName = (
      map[eventType].noPrefix in el.style
    ) ? (
      map[eventType].noPrefix
    ) : (
      map[eventType].webkitPrefix
    );
  }

  return eventName;
}

// Public functions to access getAnimationName() for JavaScript events or CSS
// property names.

export const transformStyleProperties = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'MSTransform'];


export function getCorrectEventName(windowObj, eventType) {
  return getAnimationName(windowObj, eventType);
}


export function getCorrectPropertyName(windowObj, eventType) {
  return getAnimationName(windowObj, eventType);
}
