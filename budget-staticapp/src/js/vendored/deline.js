// Deline.js, v1.0.4
// Published by Airbnb (https://github.com/airbnb/deline)

// Vendored because the package is distributed as raw ES6 — which breaks
// gulp-uglify because that library does not yet support spread params
// (even though they are part of the ES2015 spec).

// When gulp-uglify adds this support, we will revert to using deline as
// a separate, npm-managed dependency.

function deline(strings, ...values) {
    let raw;
    if (typeof strings === 'string') {
        raw = [strings];
    } else {
        raw = strings.raw;
    }
    const resultArr = [];

    for (let i = 0; i < raw.length; i += 1) {
        resultArr.push(raw[i].replace(/\\\n[ \t]*/g, '').replace(/\\`/g, '`'));
        if (i < values.length) {
            resultArr.push(values[i]);
        }
    }

    const result = resultArr.join('').trim();

    const lines = result.split('\n');
    const ret = lines.reduce((accumulator, line, idx) => {
        const lineTrimmed = line.trim();
        if (accumulator.length > 0 && lineTrimmed === '' && accumulator[accumulator.length] === '\n') {
            return accumulator;
        }
        if (lineTrimmed === '') {
            accumulator.push(accumulator.pop().slice(0, -1));
            accumulator.push('\n');
        } else {
            accumulator.push(`${lineTrimmed}${idx !== lines.length - 1 ? ' ' : ''}`);
        }

        return accumulator;
    }, []);

    return ret.join('').trim().replace(/\\n/g, '\n');
}

module.exports = deline;
