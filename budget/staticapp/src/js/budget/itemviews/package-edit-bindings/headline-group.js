import _ from 'underscore';
import jQuery from 'jquery';
import Mn from 'backbone.marionette';

export default Mn.ItemView.extend({
  initialize() {
    this.parentUI = this.options.parentUI || {};
    this.uiElements = this.options.uiElements || {};

    this.extraContext = this.options.extraContext || {};
  },

  getBindings() {
    const bindings = {};

    const model = this.model;
    const ui = this.parentUI;
    const uiElements = this.uiElements;

    bindings[uiElements.headlineGroup] = {
      observe: 'headlineStatus',
      update($el, value, mdl) {
        const variableGroupName = (
            mdl.initialHeadlineStatus === 'voting'
        ) ? mdl.initialHeadlineStatus : 'other';
        const activeGroup = $el.find(`.hl-variable-group[data-mode="${variableGroupName}"]`);
        const closestCollapsibleGroup = jQuery('#headline-fields').closest('.row.can-collapse');
        const additionalInputHeights = ui.headlineVoteSubmissionToggle
                                                .outerHeight(true);
        let newHeight = (
            18 +  // 12px for top spacer, 6 for bottom border/margin.
            activeGroup.height()
        );

        if (mdl.initialHeadlineStatus === 'drafting') {
          newHeight += additionalInputHeights;
        }

        $el.find('.hl-variable-group').removeClass('active');
        activeGroup.addClass('active');

        closestCollapsibleGroup.data('expandedHeight', newHeight);

        if (closestCollapsibleGroup.height() > 0) {
          closestCollapsibleGroup.height(newHeight);
        }
      },
      getVal() {},
    };

    bindings[uiElements.headline1] = {
      observe: 'headlineCandidates',
      onGet: () => model.headlineCandidateCollection,
      update($el, vals) {
        const cID = $el.data('cid');
        const thisVal = (
            cID !== '' && cID !== null
        ) ? vals.get({ cid: cID }) : vals.at(0);
        $el.val(thisVal.get('text'));
      },
      updateModel(val) { return !_.isNull(val); },
      getVal($el) {
        return (
          $el.prop('readonly')
        ) ? null : { text: $el.val(), cid: $el.data('cid') };
      },
      set(attr, value) {
        model.get(attr).get({ cid: value.cid }).set(_.omit(_.clone(value), 'cid'));
      },
      attributes: [
        {
          name: 'data-cid',
          observe: 'headlineCandidates',
          onGet: () => model.headlineCandidateCollection.at(0).cid,
        },
        {
          name: 'readonly',
          observe: 'headlineStatus',
          onGet: () => !(model.initialHeadlineStatus === 'drafting'),
        },
      ],
    };

    bindings[uiElements.headline2] = {
      observe: 'headlineCandidates',
      onGet: () => model.headlineCandidateCollection,
      update($el, vals) {
        const cID = $el.data('cid');
        const thisVal = (
          cID !== '' && cID !== null
        ) ? vals.get({ cid: cID }) : vals.at(1);
        $el.val(thisVal.get('text'));
      },
      updateModel(val) { return !_.isNull(val); },
      getVal($el) {
        return (
          $el.prop('readonly')
        ) ? null : { text: $el.val(), cid: $el.data('cid') };
      },
      set(attr, value) {
        model.get(attr).get({ cid: value.cid }).set(_.omit(_.clone(value), 'cid'));
      },
      attributes: [
        {
          name: 'data-cid',
          observe: 'headlineCandidates',
          onGet: () => model.headlineCandidateCollection.at(1).cid,
        },
        {
          name: 'readonly',
          observe: 'headlineStatus',
          onGet: () => !(model.initialHeadlineStatus === 'drafting'),
        },
      ],
    };

    bindings[uiElements.headline3] = {
      observe: 'headlineCandidates',
      onGet: () => model.headlineCandidateCollection,
      update($el, vals) {
        const cID = $el.data('cid');
        const thisVal = (
            cID !== '' && cID !== null
        ) ? vals.get({ cid: cID }) : vals.at(2);
        $el.val(thisVal.get('text'));
      },
      updateModel(val) { return !_.isNull(val); },
      getVal($el) {
        return (
            $el.prop('readonly')
        ) ? null : { text: $el.val(), cid: $el.data('cid') };
      },
      set(attr, value) {
        model.get(attr).get({ cid: value.cid }).set(_.omit(_.clone(value), 'cid'));
      },
      attributes: [
        {
          name: 'data-cid',
          observe: 'headlineCandidates',
          onGet: () => model.headlineCandidateCollection.at(2).cid,
        },
        {
          name: 'readonly',
          observe: 'headlineStatus',
          onGet: () => !(model.initialHeadlineStatus === 'drafting'),
        },
      ],
    };

    bindings[uiElements.headline4] = {
      observe: 'headlineCandidates',
      onGet: () => model.headlineCandidateCollection,
      update($el, vals) {
        const cID = $el.data('cid');
        const thisVal = (
            cID !== '' && cID !== null
        ) ? vals.get({ cid: cID }) : vals.at(3);
        $el.val(thisVal.get('text'));
      },
      updateModel(val) { return !_.isNull(val); },
      getVal($el) {
        return (
            $el.prop('readonly')
        ) ? null : { text: $el.val(), cid: $el.data('cid') };
      },
      set(attr, value) {
        model.get(attr).get({ cid: value.cid }).set(_.omit(_.clone(value), 'cid'));
      },
      attributes: [
        {
          name: 'data-cid',
          observe: 'headlineCandidates',
          onGet: () => model.headlineCandidateCollection.at(3).cid,
        },
        {
          name: 'readonly',
          observe: 'headlineStatus',
          onGet: () => !(model.initialHeadlineStatus === 'drafting'),
        },
      ],
    };

    bindings[uiElements.headlineVoteSubmissionToggle] = {
      observe: 'headlineStatus',
      update() {},
      getVal() {},
      attributes: [
        {
          name: 'data-visible',
          observe: 'headlineStatus',
          onGet() {
            return (
              model.initialHeadlineStatus === 'drafting'
            ) ? 'true' : 'false';
          },
        },
      ],
    };

    bindings[uiElements.headlineVoteSubmissionToggleInput] = {
      observe: 'headlineStatus',
      update() {},
      updateModel(value) {
        if (model.initialHeadlineStatus === 'drafting') {
          if (model.get('headlineStatus') === 'drafting' && value === 'voting') {
            return true;
          }

          if (model.get('headlineStatus') === 'voting' && value === 'drafting') {
            return true;
          }
        }

        return false;
      },
      getVal($el) {
        return ($el.prop('checked') === true) ? 'voting' : 'drafting';
      },
      attributes: [
        {
          name: 'readonly',
          observe: 'headlineStatus',
          onGet: () => (model.initialHeadlineStatus !== 'drafting'),
        },
        {
          name: 'checked',
          observe: 'headlineStatus',
          onGet: value => (
            (model.initialHeadlineStatus === 'drafting') &&
            (value === 'voting')
          ),
        },
      ],
    };

    return bindings;
  },
});
