// import { MDCRipple } from '@material/ripple/dist/mdc.ripple.min';
import { Ripple } from './ripple/index';


export default ($) => {
  $('.btn').each((i) => { Ripple.attachTo($('.btn')[i]); });
};
