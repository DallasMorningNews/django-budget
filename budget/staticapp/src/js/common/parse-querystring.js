export default querystring =>
    querystring
        // Strip leading question mark, if exists.
        .replace(/^\?/, '')
        // Separate params at the ampersand.
        .split('&')
        // Split keys from values.
        .map(param => param.split('='))
        // Condense [[key, value], ...] to an object.
        .reduce((result, [key, val]) =>
              Object.assign(result, { [key]: val }), {});
