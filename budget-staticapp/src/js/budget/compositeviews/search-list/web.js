import _ from 'underscore';

import settings from '../../../common/settings';

import BaseSearchList from './base';
import DateFilterView from '../../itemviews/list-components/date-filter';
import PackageItemWebView from '../../itemviews/packages/package-web-info';
import SearchBoxView from '../../itemviews/list-components/search-box';

export default BaseSearchList.extend({
    template: 'budget/package-search-list-web',

    filterViews: [
        {
            elementID: 'date-filter',
            slug: 'dateFilter',
            ViewClass: DateFilterView,
        },
        {
            elementID: 'search-box',
            slug: 'searchBox',
            ViewClass: SearchBoxView,
        },
    ],

    childView: PackageItemWebView,
    outerClass: 'web-archive',
    stateKey: 'webSearchList',
    urlBase: '/',

    queryTerms: [
        {
            apiQuery: 'search',
            urlSlug: 'fullText',
        },
        {
            formatQueryValue: initialValue => initialValue.split('.hub')[0],
            urlSlug: 'hub',
        },
        {
            urlSlug: 'person',
        },
        {
            formatQueryValue: initialValue => initialValue.split('.v')[0],
            urlSlug: 'vertical',
        },
        {
            apiQuery: 'content_type',
            formatQueryValue: initialValue => initialValue.split('.ct')[0],
            urlSlug: 'contentType',
        },
    ],

    generateCollectionFetchOptions() {
        const dateRange = this.radio.reqres.request(
            'getState',
            this.stateKey,
            'dateRange'
        );
        const currentTerms = this.radio.reqres.request(
            'getState',
            this.stateKey,
            'queryTerms'
        );

        // The API's results are exclusive of the end date.
        // In order to continue using an inclusive range in this interface
        // (for a more user-friendly experience), we add a day to the end
        // of the stored date range before querying.
        const newEnd = settings.moment(
            dateRange.end,
            'YYYY-MM-DD'
        ).add({ days: 1 }).format('YYYY-MM-DD');

        const queryOptions = {
            data: {
                has_primary: 1,
                ordering: 'publish_date',
                publish_date: [dateRange.start, newEnd].join(','),
            },
            deepLoad: false,
            muteConsole: true,
            xhrFields: {
                withCredentials: true,
            },
        };

        currentTerms.each((filter) => {
            let filterConfig;
            let returnKey = filter.get('type');
            let returnValue = filter.get('value');

            if (_.contains(_.pluck(this.queryTerms, 'urlSlug'), filter.get('type'))) {
                filterConfig = _.findWhere(
                    this.queryTerms,
                    { urlSlug: filter.get('type') }
                );

                if (_.has(filterConfig, 'apiQuery')) {
                    returnKey = filterConfig.apiQuery;
                }

                if (_.has(filterConfig, 'formatQueryValue')) {
                    returnValue = filterConfig.formatQueryValue(filter.get('value'));
                }

                queryOptions.data[returnKey] = returnValue;
            }
        });

        return queryOptions;
    },

    generateDefaultDateRange() {
        const currentDate = settings.moment().tz('America/Chicago').startOf('day');

        return {
            start: currentDate.format('YYYY-MM-DD'),
            end: currentDate.format('YYYY-MM-DD'),
            // end: currentDate.clone().add({ days: 3 }).format('YYYY-MM-DD'),
        };
    },
});
