import { Snackbar } from './snackbar';

export default ($, sel) => {
  const selector = (typeof sel === 'string') ? sel : '.snackbar';
  const selectorEls = $(selector);

  return selectorEls.map(i => new Snackbar(selectorEls[i]));
};
