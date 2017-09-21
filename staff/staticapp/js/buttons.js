//

import { Ripple } from './ripple/index';


export default ($) => {
  $('.btn').each((i) => { Ripple.attachTo($('.btn')[i]); });
};
