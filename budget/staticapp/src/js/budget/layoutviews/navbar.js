import Mn from 'backbone.marionette';

import LogoView from '../itemviews/navigation/logo';
import UserInfoView from '../itemviews/navigation/user-info';

export default Mn.LayoutView.extend({
  className: 'navigation-inner',
  template: 'budget/navigation',
  regions: {
    logo: '#logo-holder',
    userInfo: '#user-info-holder',
  },

  initialize() {
    this.logoView = new LogoView();
    this.userInfoView = new UserInfoView({
      currentUser: this.options.currentUser,
    });
  },

  onBeforeShow() {
    this.showChildView('logo', this.logoView);
    this.showChildView('userInfo', this.userInfoView);
  },
});
