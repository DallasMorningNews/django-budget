import Backbone from 'backbone';
import _ from 'underscore';
import Cookie from 'js-cookie';
import DeepModel from '@kahwee/backbone-deep-model';

export default DeepModel.extend({
  sync(method, model, options) {
    const csrfToken = Cookie.get('csrftoken');
    const csrfSafeMethod = m => /^(GET|HEAD|OPTIONS|TRACE)$/.test(m);
    const newOptions = options;

    if (!_.isUndefined(csrfToken)) {
      newOptions.beforeSend = (xhr, settings) => {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
          xhr.setRequestHeader('X-CSRFToken', csrfToken);
        }
      };
    }

    return Backbone.sync.call(this, method, model, newOptions);
  },
});
