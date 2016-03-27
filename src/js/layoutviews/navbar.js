define([
    'backbone',
    'marionette',
    'misc/tpl',
    'itemviews/navigation/logo',
    'itemviews/navigation/user-info'
], function(
    Backbone,
    Mn,
    tpl,
    LogoView,
    UserInfoView
) {
    return Mn.LayoutView.extend({
        className: 'navigation-inner',
        template: tpl('navigation'),
        regions: {
            logo: "#logo-holder",
            userInfo: "#user-info-holder"
        },

        initialize: function() {
            this.logoView = new LogoView();
            this.userInfoView = new UserInfoView({
                currentUser: this.options.currentUser
            });
        },

        onBeforeShow: function() {
            this.showChildView('logo', this.logoView);
            this.showChildView('userInfo', this.userInfoView);
        }
    });
});