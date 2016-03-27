define(
    [
        'jquery',
        'backbone',
        'marionette',
        'foundation',
        // 'collections/posts',
        // 'collections/candidates',
        // 'models/nav-state',
        // 'models/blog',
        // 'models/quiz',
        // 'models/question',
        // 'models/answer',
        // 'collections/answers',
        // 'itemviews/answer',
        // 'itemviews/question',
        // 'itemviews/quiz',
        // 'itemviews/nav',
        // 'itemviews/nav-bottom',
        // 'itemviews/share-tray',
        // 'layoutviews/quiz',
        // 'regions/animated',
        // 'misc/router',
        // 'misc/settings'
        'layoutviews/root-view',
        'collections/hubs',
        'collections/packages',
        'collections/query-terms',
        'collections/search-options',
        'collections/staffers',
        'misc/router',
        'misc/settings'
    ],
    function(
        $,
        Backbone,
        Mn,
        Foundation,
        // PostsCollection,
        // CandidatesCollection,
        // NavStateModel,
        // BlogModel,
        // QuizModel,
        // QuestionModel,
        // AnswerModel,
        // AnswersCollection,
        // AnswerView,
        // QuestionView,
        // QuizView,
        // NavView,
        // NavBottomView,
        // ShareTrayView,
        // QuizLayoutView,
        // AnimatedRegion,
        // Router,
        // settings
        RootView,
        HubCollection,
        PackageCollection,
        QueryTermCollection,
        SearchOptionCollection,
        StafferCollection,
        Router,
        settings
    ) {
        'use strict';

        // Enable Marionette Inspector
        if (window.__agent) {
            window.__agent.start(Backbone, Marionette);
        }

        return Mn.Application.extend({
            initialize: function(opts) {
                // Hook into our global Wreqr channel.
                this._radio = Backbone.Wreqr.radio.channel('global');

                // Add a ReqRes handler to allow controllers to fetch data of
                // our app instance.
                this._radio.reqres.setHandler('data', function(type){
                    return this.data[type];
                }, this);

                this._radio.commands.setHandler(
                    'pushQueryTerm',
                    function(queryObject) {
                        this.state.queryTerms.push(queryObject);

                        this.data.packages.filterAnd(
                            this.state.queryTerms,
                            {
                                hubs: this.data.hubs
                            }
                        );
                    },
                    this
                );

                this._radio.commands.setHandler(
                    'popQueryTerm',
                    function(queryValue) {
                        this.state.queryTerms.remove(
                            this.state.queryTerms.where({
                                value: queryValue
                            })
                        );

                        this.data.packages.filterAnd(
                            this.state.queryTerms,
                            {
                                hubs: this.data.hubs
                            }
                        );
                    },
                    this
                );

                this._radio.commands.setHandler(
                    'specifyEditedPackage',
                    function(packageID) {
                        this.state.editedPackageID = packageID;
                    },
                    this
                );


            },

            bootstrapData: function() {
                /**
                 * Bootstrap app data
                 */
                this.data = {};

                /**
                 * Instantiate collections and models, storing our data
                 * on the app class for later access w/ reqres.
                 */
                this.data.hubs = new HubCollection();
                this.data.packages = new PackageCollection();
                this.data.searchOptions = new SearchOptionCollection();
                this.data.staffers = new StafferCollection();

                /**
                 * Return a deferred object for when all the data's loaded.
                 */
                return $.when(
                    this.data.hubs.fetch(),
                    this.data.packages.fetch(),
                    this.data.searchOptions.fetch(),
                    this.data.staffers.fetch()
                );
            },

            onBeforeStart: function() {
                /**
                 * Instantiate the root view.
                 */
                this.state = {
                    selectizeType: 'and',
                    editedPackageID: null
                };

                this.state.queryTerms = new QueryTermCollection();

                this.rootView = new RootView({
                    currentUser: this.options.currentUser,
                    data: this.data,
                    state: this.state,
                });
            },

            onStart: function() {
                this.rootView.render();

                this.router = new Router();

                /**
                 * Add a Wreqr command to allow other modules to trigger navigation
                 */
                this._radio.commands.setHandler('navigate', function(path, options){
                    this.router.navigate(path, options);
                }, this);

                Backbone.history.start();
            }
        });
    }
);