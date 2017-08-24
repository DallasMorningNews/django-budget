import _ from 'underscore';
import Backbone from 'backbone';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';
import 'daterange-picker-ex';
import 'timedropper-ex';

export default Mn.ItemView.extend({
  initialize() {
    this.radio = Backbone.Wreqr.radio.channel('global');

    this.callbacks = this.options.callbacks || {};

    this.config = {
      modalTitle: 'Web publishing info',
      innerID: 'package-web-info',
      contentClassName: 'package-modal',
      escapeButtonCloses: false,
      overlayClosesOnClick: false,
      buttons: [
        {
          buttonID: 'package-web-info-save-button',
          buttonClass: 'flat-button save-action ' +
                        'expand-past-button save-trigger',
          innerLabel: 'Save',
          clickCallback: (modalContext) => {
            // First, add animation classes to the modal:
            modalContext.$el.parent()
                .addClass('waiting')
                .addClass('save-waiting');

            modalContext.$el.append(
              '<div class="loading-animation save-loading-animation">' +
                  '<div class="loader">' +
                      '<svg class="circular" viewBox="25 25 50 50">' +
                          '<circle class="path" cx="50" cy="50" r="20" ' +
                                  'fill="none" stroke-width="2" ' +
                                  'stroke-miterlimit="10"/>' +
                      '</svg>' +
                      '<i class="fa fa-cloud-upload fa-2x fa-fw"></i>' +
                  '</div>' +
                  '<p class="loading-text">Saving content...</p>' +
              '</div>'  // eslint-disable-line comma-dangle
            );

            setTimeout(() => {
              modalContext.$el.find('.loading-animation')
                                          .addClass('active');
            }, 600);  // eslint-disable-line no-extra-bind

            setTimeout(() => {
              modalContext.$el.find('.modal-inner').css({
                visibility: 'hidden',
              });
            }, 450);

            setTimeout(() => {
              modalContext.$el.parent()
                  .addClass('waiting')
                  .addClass('save-waiting')
                  .removeClass('waiting-transition')
                  .removeClass('save-waiting-transition');
            }, 500);

            const packageSave = this.model.save(
              undefined,
              {
                xhrFields: {
                  withCredentials: true,
                },
                deepLoad: false,
              }  // eslint-disable-line comma-dangle
            );

            packageSave.done(() => {
              setTimeout(() => {
                // Resume polling.
                this.callbacks.resumePolling();

                this.callbacks.success();
              }, 1500);
            });

            packageSave.fail(() => {
              setTimeout(() => {
                // Resume polling.
                this.callbacks.resumePolling();

                this.callbacks.error();
              }, 1500);
            });
          },
        },
        {
          buttonID: 'package-web-info-cancel-button',
          buttonClass: 'flat-button primary-action cancel-trigger',
          innerLabel: 'Cancel',
          clickCallback: () => {
            // Resume polling.
            this.callbacks.resumePolling();

            this.callbacks.close();
          },
        },
      ],
    };
  },

  extendConfig(configToAdd) {
    this.config = _.extend(this.config, configToAdd);
  },

  getConfig() {
    return this.config;
  },

  getBindings() {
    const webAttributeBindings = {};

    const moment = this.radio.reqres.request('getSetting', 'moment');
    const defaultTimezone = this.radio.reqres.request(
      'getSetting',
      'defaultTimezone'  // eslint-disable-line comma-dangle
    );
    const timePickerOptions = this.radio.reqres.request(
      'getSetting',
      'timePickerOptions'  // eslint-disable-line comma-dangle
    );

    const formatEndTime = (endTimestamp, resolution, formatString) => {
      let endDate;

      if (resolution === 't') {
        endDate = moment(endTimestamp);
      } else {
        endDate = moment.tz(endTimestamp, defaultTimezone);
      }

      endDate.subtract({ seconds: 1 });

      return endDate.format(formatString);
    };

    webAttributeBindings['#published-url'] = {
      observe: 'publishedUrl',
    };

    webAttributeBindings['#publish-date'] = {
      observe: ['publishDateResolution', 'publishDate'],
      events: ['updatePublishDate'],
      initialize: ($el, mdl, opts) => {
        this.model = mdl;

        const datePickerHolder = jQuery('<div class="date-range-picker">');
        $el.parent().append(datePickerHolder);

        this.datePickerObj = $el.dateRangePicker({
          format: 'MMM D, YYYY',
          watchValueChange: true,
          container: datePickerHolder,
          singleDate: true,
          singleMonth: true,
          getValue: () => {
            if ($el.val()) {
              return $el.val();
            }

            return '';
          },
          setValue: (formattedValue) => {
            $el.val(formattedValue);

            $el.trigger(opts.events[0]);
          },
          customArrowNextSymbol: '<i class="fa fa-arrow-circle-right"></i>',
          customArrowPrevSymbol: '<i class="fa fa-arrow-circle-left"></i>',
        });
      },
      update: ($el, value, mdl) => {
        $el.val(formatEndTime(
          mdl.get('publishDate')[1],
          mdl.get('publishDateResolution'),
          'MMM D, YYYY'  // eslint-disable-line comma-dangle
        ));
      },
      getVal($el) {
        if ($el.val() === '') { return ['t', null]; }

        return [
          't',
          [
            $el.val(),
            this.model.generateFormattedPublishDate('t')[1],
          ].join(' '),
        ];
      },
      set(attr, values) {
        this.model.set({ publishDateResolution: 't' });
        this.model.updatePublishDate(...values);
      },
    };

    webAttributeBindings['#publish-time'] = {
      observe: ['publishDateResolution', 'publishDate'],
      events: ['updatePublishTime'],
      initialize($el, mdl, opts) {
        jQuery.TDExLang.en.am = 'a.m.';
        jQuery.TDExLang.en.pm = 'p.m.';

        const timePickerHolder = jQuery('<div class="time-picker">');
        $el.parent().append(timePickerHolder);

        $el.timeDropper(
          _.defaults(
            {
              container: timePickerHolder,
              fetchTime: () => {
                const localizedDate = moment($el.val(), 'h:mm a');

                return localizedDate
                          .locale('en')
                          .format('h:mm a');
              },
              putTime: (s) => {
                const formattedTime = moment(s, 'h:mm a')
                        .format('h:mm a');

                if (formattedTime !== $el.val()) {
                  $el.val(formattedTime).change();

                  $el.trigger(opts.events[0]);
                }
              },
            },
            timePickerOptions  // eslint-disable-line comma-dangle
          )  // eslint-disable-line comma-dangle
        );
      },
      update($el, values, mdl) {
        $el.val(formatEndTime(
          mdl.get('publishDate')[1],
          mdl.get('publishDateResolution'),
          'h:mm a'  // eslint-disable-line comma-dangle
        ));
      },
      getVal($el) {
        if (
          (_.isUndefined(this.model.get('publishDate'))) ||
          (_.isEmpty(this.model.get('publishDate')))
        ) { return null; }

        return [
          't',
          [
            this.model.generateFormattedPublishDate('t')[0],
            $el.val(),
          ].join(' '),
        ];
      },
      set: (attr, values) => {
        this.model.set({ publishDateResolution: 't' });
        this.model.updatePublishDate(...values);
      },
    };

    return webAttributeBindings;
  },
});
