define([
    'jquery',
    'moment',
    'underscore',
], function(
    $,
    moment,
    _
) {
    var pluginName = 'timepicker',
        autoInitSelector = '.timepicker-here',
        $body,
        $timepickersContainer,
        containerBuilt = false,
        baseTemplate = '' +
            '<div class="timepicker">' +
            '<i class="timepicker--pointer"></i>' +
            '<nav class="timepicker--nav"></nav>' +
            '<div class="timepicker--content"></div>' +
            '</div>',
        defaults = {
            classes: '',
            inline: false,
            language: 'en_us_apstyle',
            startTime: '',
            keyboardNav: true,

            position: 'bottom left',
            offset: 12,

            view: '12h',

            minTime: null,
            maxTime: null,

            nowButton: false,
            clearButton: false,

            showEvent: 'focus',
            autoClose: false,

            // navigation
            prevHtml: '<svg><path d="M 17,12 l -5,5 l 5,5"></path></svg>',
            nextHtml: '<svg><path d="M 14,12 l 5,5 l -5,5"></path></svg>',
            navTitle: 'Choose a time',

            // timepicker
            timeFormat: '',
            hoursStep: 1,
            minutesStep: 1,
            secondsStep: 1,
        },
        timepicker,
        Timepicker = function(el, options) {
            this.el = el;
            this.$el = $(el);

            this.opts = $.extend(true, {}, defaults, options, this.$el.data());

            if ($body === undefined) {
                $body = $('body');
            }

            if (!this.opts.startTime) {
                /* TK. */
                this.opts.startTime = moment('12:00 p.m.', 'h:mm a');
            }

            if (this.el.nodeName === 'INPUT') {
                this.elIsInput = true;
            }

            this.inited = false;
            this.visible = false;
            this.silent = false; // Need to prevent unnecessary rendering

            this.currentTime = this.opts.startTime;
            this.currentView = this.opts.view;
            this._createShortCuts();
            this.selectedTime = null;
            this.views = {};
            this.keys = [];
            this.minRange = '';
            this.maxRange = '';

            this.init();
        },
        bodyTemplates = {
            '12h': '' +
            '<div class="timepicker--body timepicker--12h">' +
            '   <input class="timepicker--hours-input timepicker--component-input" ' +
                    'data-component="hour" type="text" />' +
            '   <span class="timepicker--time-separator">:</span>' +
            '   <input class="timepicker--minutes-input timepicker--component-input" ' +
                    'data-component="minute" type="text" />' +
            '   <span class="timepicker--spacer"></span>' +
            '   <input class="timepicker--meridiem-input timepicker--component-input" ' +
                    'data-component="meridiem" type="text" />' +
            '   <span class="timepicker--clearer"></span>' +
            '</div>',
            '12h_seconds': '' +
            '<div class="timepicker--body timepicker--12h-seconds">' +
            '   <input class="timepicker--hours-input timepicker--component-input" ' +
                    'data-component="hour" type="text" />' +
            '   <span class="timepicker--time-separator">:</span>' +
            '   <input class="timepicker--minutes-input timepicker--component-input" ' +
                    'data-component="minute" type="text" />' +
            '   <span class="timepicker--time-separator">:</span>' +
            '   <input class="timepicker--seconds-input timepicker--component-input" ' +
                    'data-component="second" type="text" />' +
            '   <span class="timepicker--spacer"></span>' +
            '   <input class="timepicker--meridiem-input timepicker--component-input" ' +
                    'data-component="meridiem" type="text" />' +
            '   <span class="timepicker--clearer"></span>' +
            '</div>',
            '24h': '' +
            '<div class="timepicker--body timepicker--24h">' +
            '   <input class="timepicker--hours-input timepicker--component-input" ' +
                    'data-component="hour" type="text" />' +
            '   <span class="timepicker--time-separator">:</span>' +
            '   <input class="timepicker--minutes-input timepicker--component-input" ' +
                    'data-component="minute" type="text" />' +
            '   <span class="timepicker--clearer"></span>' +
            '</div>',
            '24h_seconds': '' +
            '<div class="timepicker--body timepicker--24h-seconds">' +
            '   <input class="timepicker--hours-input timepicker--component-input" ' +
                    'data-component="hour" type="text" />' +
            '   <span class="timepicker--time-separator">:</span>' +
            '   <input class="timepicker--minutes-input timepicker--component-input" ' +
                    'data-component="minute" type="text" />' +
            '   <span class="timepicker--time-separator">:</span>' +
            '   <input class="timepicker--seconds-input timepicker--component-input" ' +
                    'data-component="second" type="text" />' +
            '   <span class="timepicker--clearer"></span>' +
            '</div>',
        };

    timepicker = Timepicker;

    timepicker.prototype = {
        viewIndexes: ['12h', '24h'],

        init: function() {
            var startTimeCandidate;

            if (!containerBuilt && !this.opts.inline && this.elIsInput) {
                this._buildTimepickersContainer();
            }
            this._buildBaseHtml();
            this._defineLocale(this.opts.language);

            // If there's already a value in the input field, attempt to use
            // that instead of the default start time.
            if (this.elIsInput && (this.$el.val() !== '')) {
                startTimeCandidate = moment(this.$el.val(), this.loc.timeFormat);

                if (startTimeCandidate.isValid()) {
                    this.currentTime = startTimeCandidate;
                }
            }

            this._syncWithMinMaxTimes();

            if (this.elIsInput) {
                if (!this.opts.inline) {
                    // Set extra classes for proper transitions.
                    this._setPositionClasses(this.opts.position);
                    this._bindEvents();
                }
                if (this.opts.keyboardNav) {
                    this._bindKeyboardEvents();
                }
                this.$timepicker.on('mousedown', this._onMouseDownTimepicker.bind(this));
                this.$timepicker.on('mouseup', this._onMouseUpTimepicker.bind(this));
            }

            if (this.opts.classes) {
                this.$timepicker.addClass(this.opts.classes);
            }

            /* TK. */
            this.views[this.currentView] = new $.fn.timepicker.Body(
                this,
                this.currentView,
                this.opts
            );

            this.views[this.currentView].show();
            this.view = this.currentView;


            this.inited = true;
        },

        _createShortCuts: function() {
            this.minTime = !_.isNull(
                this.opts.minTime
            ) ? moment(this.opts.minTime, this.loc.timeFormat) : moment('12:00 a.m.', 'h:mm a');
            this.maxTime = !_.isNull(
                this.opts.maxTime
            ) ? moment(this.opts.maxTime, this.loc.timeFormat) : moment('11:59 p.m.', 'h:mm a');
        },

        _bindEvents: function() {
            this.$el.on(this.opts.showEvent + '.atp', this._onShowEvent.bind(this));
            this.$el.on('mouseup.atp', this._onMouseUpEl.bind(this));
            this.$el.on('blur.atp', this._onBlur.bind(this));
            this.$el.on('keyup.atp', this._onKeyUpGeneral.bind(this));
            $(window).on('resize.atp', this._onResize.bind(this));
            $('body').on('mouseup.atp', this._onMouseUpBody.bind(this));
        },

        _bindKeyboardEvents: function() {
            this.$el.on('keydown.atp', this._onKeyDown.bind(this));
            this.$el.on('keyup.atp', this._onKeyUp.bind(this));
        },

        _defineLocale: function(lang) {
            var boundary;

            if (typeof lang === 'string') {
                this.loc = $.fn.timepicker.language[lang];
                if (!this.loc) {
                    console.warn(  // eslint-disable-line no-console
                        'Can\'t find language "' + lang +
                        '" in Timepicker.language, will use "en" instead.'
                    );
                    this.loc = $.extend(true, {}, $.fn.timepicker.language.en);
                }

                this.loc = $.extend(
                    true,
                    {},
                    $.fn.timepicker.language.en,
                    $.fn.timepicker.language[lang]
                );
            } else {
                this.loc = $.extend(true, {}, $.fn.timepicker.language.en, lang);
            }

            if (this.opts.timeFormat) {
                this.loc.timeFormat = this.opts.timeFormat;
            }

            boundary = this._getWordBoundaryRegExp;

            if (
                (this.loc.timeFormat.match(boundary('a'))) ||
                (this.loc.timeFormat.match(boundary('A')))
            ) {
                this.ampm = true;
            }
        },

        _buildTimepickersContainer: function() {
            containerBuilt = true;
            $body.append('<div class="timepickers-container" id="timepickers-container"></div>');
            $timepickersContainer = $('#timepickers-container');
        },

        _buildBaseHtml: function() {
            var $appendTarget,
                $inline = $('<div class="timepicker-inline">');

            if (this.el.nodeName === 'INPUT') {
                if (!this.opts.inline) {
                    $appendTarget = $timepickersContainer;
                } else {
                    $appendTarget = $inline.insertAfter(this.$el);
                }
            } else {
                $appendTarget = $inline.appendTo(this.$el);
            }

            this.$timepicker = $(baseTemplate).appendTo($appendTarget);
            this.$content = $('.timepicker--content', this.$timepicker);
            this.$nav = $('.timepicker--nav', this.$timepicker);
        },

        _getWordBoundaryRegExp: function(sign) {
            return new RegExp('\\b(?=[a-zA-Z0-9äöüßÄÖÜ<])' + sign + '(?![>a-zA-Z0-9äöüßÄÖÜ])');
        },

        selectTime: function(time) {
            var _this = this,  // eslint-disable-line no-underscore-dangle
                opts = _this.opts,
                // d = _this.parsedDate,
                selectedTime = _this.selectedTime,  // eslint-disable-line no-unused-vars
                newTime = moment(time, this.loc.timeFormat);

            if (!newTime.isValid()) return;

            if (newTime) {
                _this.silent = true;
                _this.time = newTime;
                _this.silent = false;
            }

            _this.selectedTime = newTime;

            _this._setInputValue();  // eslint-disable-line no-underscore-dangle

            if (opts.autoClose) {
                _this.hide();
            }

            _this.views[this.currentView]._render();  // eslint-disable-line no-underscore-dangle
        },

        // removeDate: function(date) {
        //     var selected = this.selectedDates,
        //         _this = this;

        //     if (!(date instanceof Date)) return;

        //     return selected.some(function(curDate, i) {
        //         if (timepicker.isSame(curDate, date)) {
        //             selected.splice(i, 1);

        //             if (!_this.selectedDates.length) {
        //                 _this.minRange = '';
        //                 _this.maxRange = '';
        //                 _this.lastSelectedDate = '';
        //             } else {
        //                 _this.lastSelectedDate = _this.selectedDates[
        //                     _this.selectedDates.length - 1
        //                 ];
        //             }

        //             _this.views[_this.currentView]._render();
        //             _this._setInputValue();

        //             return true;
        //         }
        //     })
        // },

        // today: function() {
        //     this.silent = true;
        //     this.view = this.opts.minView;
        //     this.silent = false;
        //     this.date = new Date();

        //     if (this.opts.todayButton instanceof Date) {
        //         this.selectTime(this.opts.todayButton);
        //     }
        // },

        clear: function() {
            this.selectedTime = null;
            this.minRange = '';
            this.maxRange = '';
            /* TK. */
            this.views[this.currentView]._render();  // eslint-disable-line no-underscore-dangle
            this._setInputValue();
        },

        /**
         * Updates timepicker options
         * @param {String|Object} param - parameter's name to update.
         * If object then it will extend current options
         * @param {String|Number|Object} [value] - new param value
         */
        update: function(param, value) {
            var len = arguments.length;

            if (len === 2) {
                this.opts[param] = value;
            } else if (len === 1 && typeof param === 'object') {
                this.opts = $.extend(true, this.opts, param);
            }

            this._createShortCuts();
            this._syncWithMinMaxTimes();
            this._defineLocale(this.opts.language);
            this.views[this.currentView]._render();  // eslint-disable-line no-underscore-dangle

            if (this.elIsInput && !this.opts.inline) {
                this._setPositionClasses(this.opts.position);
                if (this.visible) {
                    this.setPosition(this.opts.position);
                }
            }

            if (this.opts.classes) {
                this.$timepicker.addClass(this.opts.classes);
            }

            this._setInputValue();

            return this;
        },

        _syncWithMinMaxTimes: function() {
            var curTime = this.currentTime;
            this.silent = true;

            if (curTime.isBefore(this.minTime)) {
                this.time = this.minTime;
            }

            if (curTime.isAfter(this.maxTime)) {
                this.time = this.maxTime;
            }

            this.silent = false;
        },

        _setInputValue: function() {
            var _this = this,  // eslint-disable-line no-underscore-dangle
                opts = _this.opts,  // eslint-disable-line no-unused-vars
                format = _this.loc.timeFormat,
                value = _this.selectedTime.format(format);

            this.$el.val(value);
        },

        _getDimensions: function($el) {
            var offset = $el.offset();

            return {
                width: $el.outerWidth(),
                height: $el.outerHeight(),
                left: offset.left,
                top: offset.top,
            };
        },

        _setPositionClasses: function(pos) {
            var newPos = pos.split(' '),
                main = newPos[0],
                sec = newPos[1],
                classes = 'timepicker -' + main + '-' + sec + '- -from-' + main + '-';

            if (this.visible) classes += ' active';

            this.$timepicker
                .removeAttr('class')
                .addClass(classes);
        },

        setPosition: function(position) {
            var newPosition = position || this.opts.position,
                dims = this._getDimensions(this.$el),
                selfDims = this._getDimensions(this.$timepicker),
                pos = newPosition.split(' '),
                top,
                left,
                offset = this.opts.offset,
                main = pos[0],
                secondary = pos[1];

            switch (main) {
            case 'top':
                top = dims.top - selfDims.height - offset;
                break;
            case 'right':
                left = dims.left + dims.width + offset;
                break;
            case 'bottom':
                top = dims.top + dims.height + offset;
                break;
            case 'left':
                left = dims.left - selfDims.width - offset;
                break;
            default:
                break;
            }

            switch (secondary) {
            case 'top':
                top = dims.top;
                break;
            case 'right':
                left = dims.left + dims.width - selfDims.width;
                break;
            case 'bottom':
                top = dims.top + dims.height - selfDims.height;
                break;
            case 'left':
                left = dims.left;
                break;
            case 'center':
                if (/left|right/.test(main)) {
                    top = dims.top + (dims.height / 2) - (selfDims.height / 2);
                } else {
                    left = dims.left + (dims.width / 2) - (selfDims.width / 2);
                }
                break;
            default:
                break;
            }

            this.$timepicker
                .css({
                    left: left,
                    top: top,
                });
        },

        show: function() {
            var firstComponentInput;

            this.setPosition(this.opts.position);
            this.$timepicker.addClass('active');
            this.visible = true;

            firstComponentInput = this.$content.find('.timepicker--component-input:first');

            this.views[this.currentView]._selectComponent(  // eslint-disable-line no-underscore-dangle,max-len
                firstComponentInput.data('component')
            );
        },

        hide: function() {
            this.$timepicker
                .removeClass('active')
                .css({
                    left: '-100000px',
                });

            this.keys = [];

            this.inFocus = false;
            this.visible = false;
            this.$el.blur();
        },

        _registerKey: function(key) {
            var exists = this.keys.some(function(curKey) {
                return curKey === key;
            });

            if (!exists) {
                this.keys.push(key);
            }
        },

        _unRegisterKey: function(key) {
            var index = this.keys.indexOf(key);

            this.keys.splice(index, 1);
        },

        _trigger: function(event, args) {
            this.$el.trigger(event, args);
        },

        destroy: function() {
            var _this = this;  // eslint-disable-line no-underscore-dangle
            _this.$el
                .off('.atp')
                .data('timepicker', '');

            _this.selectedDates = [];
            _this.views = {};
            _this.keys = [];
            _this.minRange = '';
            _this.maxRange = '';

            if (_this.opts.inline || !_this.elIsInput) {
                _this.$timepicker.closest('.timepicker-inline').remove();
            } else {
                _this.$timepicker.remove();
            }
        },

        _onShowEvent: function(e) {  // eslint-disable-line no-unused-vars
            if (!this.visible) {
                this.show();
            }
        },

        _onBlur: function() {
            if (!this.inFocus && this.visible) {
                this.hide();
            }
        },

        _onMouseDownTimepicker: function(e) {  // eslint-disable-line no-unused-vars
            this.inFocus = true;
        },

        _onMouseUpTimepicker: function(e) {
            this.inFocus = false;
            e.originalEvent.inFocus = true;  // eslint-disable-line no-param-reassign
        },

        _onKeyUpGeneral: function(e) {  // eslint-disable-line no-unused-vars
            var val = this.$el.val(),
                outerInput,
                currentView,
                component;

            if (!val) {
                this.clear();
            } else {
                // If a user has manually entered a date, apply that value
                // internally and re-highlight the present component.
                if (val !== this.currentTime.format(this.loc.timeFormat)) {
                    outerInput = this.$el[0];
                    currentView = this.views[this.currentView];
                    component = currentView.$el.find(
                        '.timepicker--component-input.timepicker--active-component-input'
                    ).data('component');

                    this.selectTime(val);

                    outerInput.setSelectionRange.apply(
                        outerInput,
                        currentView._getComponentPosition(component)  // eslint-disable-line no-underscore-dangle,max-len
                    );
                }
            }
        },

        _onResize: function() {
            if (this.visible) {
                this.setPosition();
            }
        },

        _onMouseUpBody: function(e) {
            if (e.originalEvent.inFocus) return;

            if (this.visible && !this.inFocus) {
                this.hide();
            }
        },

        _onMouseUpEl: function(e) {
            e.originalEvent.inFocus = true;  // eslint-disable-line no-param-reassign
            setTimeout(this._onKeyUpGeneral.bind(this), 4);
        },

        _switchComponent: function(direction, currentComponentEl) {
            var newComponent;

            switch (direction) {
            case 'previous':
                newComponent = currentComponentEl.prevAll(
                    '.timepicker--component-input:first'
                ).data('component');
                break;
            case 'next':
                newComponent = currentComponentEl.nextAll(
                    '.timepicker--component-input:first'
                ).data('component');
                break;
            default:
                newComponent = null;
                break;
            }

            if (!_.isUndefined(newComponent) && !_.isNull(newComponent)) {
                this.views[this.currentView]._selectComponent(  // eslint-disable-line no-underscore-dangle,max-len
                    newComponent
                );
            } else {
                this.hide();
            }
        },

        _onKeyDown: function(e) {
            var code = e.which,
                activeComponent,
                pressedKeys;

            this._registerKey(code);

            activeComponent = this.views[this.currentView].$el.find(
                '.timepicker--component-input.timepicker--active-component-input'
            );

            // Arrows
            if (code === 37 || code === 39) {
                e.preventDefault();

                if (code === 37) {
                    this._switchComponent('previous', activeComponent);
                } else if (code === 39) {
                    this._switchComponent('next', activeComponent);
                }
            }

            if (code === 38 || code === 40) {
                e.preventDefault();

                switch (code) {
                case 38:
                    this._adjustTime(activeComponent.data('component'), '-');
                    break;
                case 40:
                    this._adjustTime(activeComponent.data('component'), '+');
                    break;
                default:
                    break;
                }
            }

            // Tab and Shift+Tab
            if (code === 9) {
                pressedKeys = this.keys.sort();

                if (_.contains(pressedKeys, 9) && _.contains(pressedKeys, 16)) {
                    if (
                        activeComponent.prevAll(
                            '.timepicker--component-input:first'
                        ).length !== 0
                    ) {
                        e.preventDefault();

                        this._switchComponent('previous', activeComponent);
                    }
                } else {
                    if (
                        activeComponent.nextAll(
                            '.timepicker--component-input:first'
                        ).length !== 0
                    ) {
                        e.preventDefault();

                        this._switchComponent('next', activeComponent);
                    }
                }
            }

            // // Enter
            if (code === 13) {
                this.hide();
            }

            // Esc
            if (code === 27) {
                this.hide();
            }
        },

        _onKeyUp: function(e) {
            var code = e.which;
            this._unRegisterKey(code);
        },

        _adjustTime: function(component, direction) {
            var timeDupe = this.currentTime.clone(),
                directionalOffset = (direction === '+') ? 1 : -1,
                outerInput = this.$el[0],
                currentView = this.views[this.currentView],
                finalOffset;

            switch (component) {
            case 'hour':
                finalOffset = directionalOffset * this.opts.hoursStep;

                if (
                    (this.currentTime.hours() < 12) &&
                    (this.currentTime.hours() + finalOffset) < 0
                ) {
                    timeDupe.hours(this.currentTime.hours() + finalOffset + 12);
                } else if (
                    (this.currentTime.hours() < 12) &&
                    (this.currentTime.hours() + finalOffset) >= 12
                ) {
                    timeDupe.hours(this.currentTime.hours() + finalOffset - 12);
                } else if (
                    (this.currentTime.hours() >= 12) &&
                    (this.currentTime.hours() + finalOffset) < 12
                ) {
                    timeDupe.hours(this.currentTime.hours() + finalOffset + 12);
                } else if (
                    (this.currentTime.hours() >= 12) &&
                    (this.currentTime.hours() + finalOffset) > 23
                ) {
                    timeDupe.hours(this.currentTime.hours() + finalOffset - 12);
                } else {
                    timeDupe.hours(this.currentTime.hours() + finalOffset);
                }

                break;
            case 'minute':
                finalOffset = directionalOffset * this.opts.minutesStep;

                if ((this.currentTime.minutes() + finalOffset) < 0) {
                    timeDupe.minutes(this.currentTime.minutes() + finalOffset + 60);
                } else if ((this.currentTime.minutes() + finalOffset) > 59) {
                    timeDupe.minutes(this.currentTime.minutes() + finalOffset - 60);
                } else {
                    timeDupe.minutes(this.currentTime.minutes() + finalOffset);
                }

                break;
            case 'second':
                finalOffset = directionalOffset * this.opts.secondsStep;

                if ((this.currentTime.minutes() + finalOffset) < 0) {
                    timeDupe.minutes(this.currentTime.minutes() + finalOffset + 60);
                } else if ((this.currentTime.minutes() + finalOffset) > 59) {
                    timeDupe.minutes(this.currentTime.minutes() + finalOffset - 60);
                } else {
                    timeDupe.minutes(this.currentTime.minutes() + finalOffset);
                }

                break;
            case 'meridiem':
                finalOffset = timeDupe.hours() < 12 ? 12 : -12;

                timeDupe.hours(this.currentTime.hours() + finalOffset);
                break;
            default:
                break;
            }

            this.selectTime(timeDupe.format(this.loc.timeFormat));

            outerInput.setSelectionRange.apply(
                outerInput,
                currentView._getComponentPosition(  // eslint-disable-line no-underscore-dangle,max-len
                    component
                )
            );
        },

        // _onClickInput: function(e) {},

        get parsedTime() {
            return timepicker.getParsedTime(this.time);
        },

        set time(val) {
            var newTime = moment(val, this.loc.timeFormat);
            if (!newTime.isValid()) return;

            this.currentTime = newTime;

            if (this.inited && !this.silent) {
                this.views[this.view]._render();  // eslint-disable-line no-underscore-dangle
                /* TK. */
                if (this.visible && this.elIsInput) {
                    this.setPosition();
                }
            }

            // return val;
        },

        get time() {
            return this.currentTime.isValid() ? this.currentTime.format(this.loc.timeFormat) : '';
        },

        set view(val) {
            this.viewIndex = this.viewIndexes.indexOf(val);

            if (this.viewIndex < 0) {
                return;
            }

            this.prevView = this.currentView;
            this.currentView = val;

            if (this.inited) {
                if (!this.views[val]) {
                    this.views[val] = new $.fn.timepicker.Body(this, val, this.opts);
                } else {
                    this.views[val]._render();  // eslint-disable-line no-underscore-dangle
                }

                this.views[this.prevView].hide();
                this.views[val].show();

                if (this.elIsInput && this.visible) this.setPosition();
            }

            // return val;
        },

        get view() {
            return this.currentView;
        },
    };

    //  Utils
    // -------------------------------------------------

    timepicker.getParsedTime = function(time) {
        var parsedTime = moment(time, 'h:mm a');

        return parsedTime.isValid() ? parsedTime : null;
    };

    timepicker.template = function(str, data) {
        return str.replace(/#\{([\w]+)\}/g, function(source, match) {
            if (data[match] || data[match] === 0) {
                return data[match];
            }

            return null;
        });
    };

    $.fn.timepicker = function(options) {  // eslint-disable-line no-param-reassign
        var _this;  // eslint-disable-line no-underscore-dangle

        return this.each(function() {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName,
                    new Timepicker(this, options));
            } else {
                _this = $.data(this, pluginName);

                _this.opts = $.extend(true, _this.opts, options);
                // _this.update();
            }
        });
    };

    $.fn.timepicker.Constructor = Timepicker;  // eslint-disable-line no-param-reassign

    $.fn.timepicker.language = {  // eslint-disable-line no-param-reassign
        en_us_apstyle: {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            daysMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            months: [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
            ],
            monthsShort: [
                'Jan.', 'Feb.', 'March', 'April', 'May', 'June',
                'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
            ],
            today: 'Today',
            clear: 'Clear',
            dateFormat: 'M d, yyyy',
            timeFormat: 'hh:ii aa',
            firstDay: 1,
        },
    };

    $(function() {
        $(autoInitSelector).timepicker();
    });

    $.fn.timepicker.Body = function(t, type, opts) {  // eslint-disable-line no-param-reassign
        this.t = t;
        this.opts = opts;

        this.init();
    };

    $.fn.timepicker.Body.prototype = {  // eslint-disable-line no-param-reassign
        init: function() {
            var cleanedFormat = this.t.loc.timeFormat.replace(/\[.*?\]\s*/g, ''),
                hourFormats = ['HH', 'H', 'hh', 'h', 'kk', 'k'],
                minuteFormats = ['mm', 'm'],
                secondFormats = ['ss', 's'],
                meridiemFormats = ['A', 'a'];

            this.timeComponents = {};

            this.timeComponents.hour = _(hourFormats)
                .chain()
                    .filter(function(fmt) {
                        return cleanedFormat.indexOf(fmt) > -1;
                    })
                    .first()
                .value();

            this.timeComponents.minute = _(minuteFormats)
                .chain()
                    .filter(function(fmt) {
                        return cleanedFormat.indexOf(fmt) > -1;
                    })
                    .first()
                .value();

            this.timeComponents.second = _(secondFormats)
                .chain()
                    .filter(function(fmt) {
                        return cleanedFormat.indexOf(fmt) > -1;
                    })
                    .first()
                .value();

            this.timeComponents.meridiem = _(meridiemFormats)
                .chain()
                    .filter(function(fmt) {
                        return cleanedFormat.indexOf(fmt) > -1;
                    })
                    .first()
                .value();

            this.type = (_.isUndefined(this.timeComponents.meridiem)) ? '24h' : '12h';

            this._buildBaseHtml();
            this._render();

            this._bindEvents();
        },

        _bindEvents: function() {
            this.$el.on(
                'mousedown',
                '.timepicker--component-input',
                $.proxy(this._onClickInput, this)
            );
        },

        _buildBaseHtml: function() {
            this.$el = $(bodyTemplates[this.type]).appendTo(this.t.$content);
            this.$hours = $('.timepicker--hours-input', this.$el);
            this.$minutes = $('.timepicker--minutes-input', this.$el);
            this.$seconds = $('.timepicker--seconds-input', this.$el);
            this.$meridiem = $('.timepicker--meridiem-input', this.$el);
        },

        _getComponentPosition: function(component) {
            var currentComponentText = this.t.currentTime.format(
                    this.timeComponents[component]
                ),
                componentPlaceholderRaw = _(currentComponentText.length)
                        .chain()
                            .range()
                            .reduce(
                                function(m, n) {  // eslint-disable-line no-unused-vars
                                    return m + '#';
                                },
                                ''
                            )
                        .value(),
                componentPlaceholder = '[' + componentPlaceholderRaw + ']',
                substitutedTime = this.t.currentTime.format(
                    this.t.loc.timeFormat.replace(
                        this.timeComponents[component],
                        componentPlaceholder
                    )
                );

            return [
                substitutedTime.indexOf(componentPlaceholderRaw),
                (
                    substitutedTime.indexOf(  // eslint-disable-line indent
                        componentPlaceholderRaw
                    ) + componentPlaceholderRaw.length
                ),
            ];
        },

        _selectComponent: function(component) {
            var outerInput = this.t.$el[0];

            this.$el.find(
                '.timepicker--component-input.timepicker--active-component-input'
            ).removeClass('timepicker--active-component-input');
            this.$el.find(
                '.timepicker--component-input[data-component="' + component + '"]'
            ).addClass('timepicker--active-component-input');

            outerInput.setSelectionRange.apply(
                outerInput,
                this._getComponentPosition(component)
            );
        },

        _renderTypes: {
            '12h': function() {
                var hourText,
                    minuteText,
                    meridiemText;

                if (!_.isNull(this.t.currentTime) && this.t.currentTime.isValid()) {
                    hourText = (
                        !_.isUndefined(this.timeComponents.hour)
                    ) ? this.t.currentTime.format(this.timeComponents.hour) : '';

                    minuteText = (
                        !_.isUndefined(this.timeComponents.minute)
                    ) ? this.t.currentTime.format(this.timeComponents.minute) : '';

                    meridiemText = (
                        !_.isUndefined(this.timeComponents.meridiem)
                    ) ? this.t.currentTime.format(this.timeComponents.meridiem) : '';

                    this.$hours.val(hourText);
                    this.$minutes.val(minuteText);
                    this.$meridiem.val(meridiemText);
                }
            },
            '12h_seconds': function() {
                var hourText,
                    minuteText,
                    secondText,
                    meridiemText;

                if (!_.isNull(this.t.currentTime) && this.t.currentTime.isValid()) {
                    hourText = (
                        !_.isUndefined(this.timeComponents.hour)
                    ) ? this.t.currentTime.format(this.timeComponents.hour) : '';

                    minuteText = (
                        !_.isUndefined(this.timeComponents.minute)
                    ) ? this.t.currentTime.format(this.timeComponents.minute) : '';

                    secondText = (
                        !_.isUndefined(this.timeComponents.second)
                    ) ? this.t.currentTime.format(this.timeComponents.second) : '';

                    meridiemText = (
                        !_.isUndefined(this.timeComponents.meridiem)
                    ) ? this.t.currentTime.format(this.timeComponents.meridiem) : '';

                    this.$hours.val(hourText);
                    this.$minutes.val(minuteText);
                    this.$seconds.val(secondText);
                    this.$meridiem.val(meridiemText);
                }
            },
            '24h': function() {
                var hourText,
                    minuteText;

                if (!_.isNull(this.t.currentTime) && this.t.currentTime.isValid()) {
                    hourText = (
                        !_.isUndefined(this.timeComponents.hour)
                    ) ? this.t.currentTime.format(this.timeComponents.hour) : '';

                    minuteText = (
                        !_.isUndefined(this.timeComponents.minute)
                    ) ? this.t.currentTime.format(this.timeComponents.minute) : '';

                    this.$hours.val(hourText);
                    this.$minutes.val(minuteText);
                }
            },
            '24h_seconds': function() {
                var hourText,
                    minuteText,
                    secondText;

                if (!_.isNull(this.t.currentTime) && this.t.currentTime.isValid()) {
                    hourText = (
                        !_.isUndefined(this.timeComponents.hour)
                    ) ? this.t.currentTime.format(this.timeComponents.hour) : '';

                    minuteText = (
                        !_.isUndefined(this.timeComponents.minute)
                    ) ? this.t.currentTime.format(this.timeComponents.minute) : '';

                    secondText = (
                        !_.isUndefined(this.timeComponents.second)
                    ) ? this.t.currentTime.format(this.timeComponents.second) : '';

                    this.$hours.val(hourText);
                    this.$minutes.val(minuteText);
                    this.$seconds.val(secondText);
                }
            },
        },

        _render: function() {
            this._renderTypes[this.type].bind(this)();
        },

        _update: function() {},

        show: function() {
            this.$el.addClass('active');
            this.active = true;
        },

        hide: function() {
            this.$el.removeClass('active');
            this.active = false;
        },

        _onClickInput: function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();

            this._selectComponent($(e.target).data('component'));
        },
    };
});
