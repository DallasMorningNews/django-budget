     ____            _            _   _
    | __ ) _   _  __| | __ _  ___| |_(_)_ __   __ _
    |  _ \| | | |/ _` |/ _` |/ _ \ __| | '_ \ / _` |
    | |_) | |_| | (_| | (_| |  __/ |_| | | | | (_| |
    |____/ \__,_|\__,_|\__, |\___|\__|_|_| |_|\__, |
                       |___/                  |___/


# DMN-Budgeting

An internal story-budgeting tool for the staff of The Dallas Morning News.

More information TK here.

<img src="http://www.dallasnews.com/resrsc/premium/www/img/logo-black.png" width="200px">


# Installation

To set up this repo and begin serving files, follow these steps.

**First, clone this repo:**

    git clone <this repo's URL> .

**Then, install `node` and `npm` with the following:**

    curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
    sudo apt-get install -y nodejs

Note: You may also need to install `build-essential` during this step.

**Next, install Bower and gulp:**

    sudo npm install -g gulp
    sudo npm install -g bower
    npm install gulp

**Finally, install NPM and Bower dependencies:**

    npm install
    bower install

That's it! You should now have a working version of the code deployed on your computer/VM/server.


# Errata

## Dependency fixes

At press time (March 27, 2016), there's a scoping error in the current version of Zurb Foundation 6 (known to the publisher as foundation-sites).

This error triggers a `TypeError` ("Cannot read property 'find' of undefined") tracing to line 661 of `foundation-transpiled.js` whenever a user opens a modal window in the app.

That `TypeError` doesn't appear to affect functionality, but can still be easily remedied by one minor change to a dependency file.

The makers of Foundation are aware of the error, and a patch has been submitted by a community member. You can follow its progress by looking at the status of [this GitHub ticket](https://github.com/zurb/motion-ui/issues/75); once the patch is accepted the problem should go away.

In the meantime, you can change one line in `bower_components/foundation-sites/js/foundation.reveal.js` to mirror the patch in [this commit](https://github.com/akrawchyk/foundation-sites/commit/da82763a78c9117dd4cb2fb5ae4239abb38697a1) (which is referenced in the GitHub ticket mentioned earlier).

## Known issues with this app

There's currently a slight scoping error in modal windows that keeps them from being fully deleted.

This is only evident in the saving-progress and deleting-progress modals. When one of these is called, you must reload the page to see other modals. This issue is being investigated -- a temporary fix (at least) will come in the next day, and a more permanent one later this week once I have a chance to review the non-AMD structure of the Foundation 6 dependency.
