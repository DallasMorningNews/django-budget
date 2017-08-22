import stringFn from 'underscore.string';

// Add 'numberWithCommas' filter.
export default rawNumber => stringFn.numberFormat(rawNumber);
