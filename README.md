# django-budget
****
### _A tool to help newsrooms manage their content, from pitch to planning to production._
****
##### A project of _The Dallas Morning News_
****

`django-budget` is a Django and JavaScript app that can track stories as they are conceived, assembled and published.

It includes an approachable interface that can handle all the daily demands of planning and assembling content across news organizations large and small, based on a standards-compliant API that can be used by other consumers — from chatbots to full-screen displays to many other applications.

Detailed documentation (including a user guide) will be added at a later date.


## Quick start

1. Install this app into a Django project and virtual environment (more information about reaching this stage will also be forthcoming):

        pip install django-budget

2.  Add \"budget\" to your INSTALLED\_APPS setting like this:

        INSTALLED_APPS = [
            ...
            'budget',
        ]

3.  Include the budget URLconf in your project urls.py like this:

        url(r'^budget/', include('budget.urls')),

4.  Run `python manage.py migrate` to create the budget models.

4.  Start the development server and visit
    <http://127.0.0.1:8000/budget/> to see your story budget and begin planning stories.

5.  Visit <http://127.0.0.1:8000/budget/api/> to explore the app's REST API.


## Configuration settings

`django-budget` provides sane defaults for many install use cases, but can be customized further via Django's `settings.py` convention.

There are several categories of settings you can override, one by one or all together. Here's a list of what you can change easily.

#### API options

| Setting | Description |
| :-- | :-- |
| BUDGET_API_MAX_ITEMS | **Optional.** The maximum number of results that can be returned by one query to the API. Defaults to 500. |
| BUDGET_API_CONFIGS | **Optional.** Can be used to specify different root URLs for the Budget or Staff APIs. Read more about how to set this option below. Defaults to the reversed URLs for `budget:api-root` and `editorial_staff:api:v1:root`, respectively. |

###### Overriding `BUDGET_API_CONFIGS`

If needed, the `BUDGET_API_CONFIGS` setting is configured as a dictionary. This dictionary can have any of the following keys:

```python
BUDGET_API_CONFIGS = {
  'budget': '',  # The root URL of the budget API.
  'staff': '',  # The root URL of the editorial-staff API.
  'auth': '',  # The root URL of the user-authentication API (pending deprecation).
}
```

Each of these keys can have a hard-coded path string value (expressed as a relative or absolute URL), or can reference a function for URL reversing. In order to avoid registry-timing errors, API configs that are callable functions are passed Django's `django.urls.reverse()` method as their only parameter.


#### Branding options

| Setting | Description |
| :-- | :-- |
| BUDGET_ORGANIZATION_NAME | **Optional, but customization recommended.** The name of the organization using this Budget installation. For now, only used as alt-text for the organizational logo. Defaults to the text "Your organization here". |
| BUDGET_ORGANIZATION_LOGO_PATH | **Optional, but customization recommended.** The logo for the organization running this Budget installation, to be surfaced at the top-left of every budget view. Defaults to a stylized "Your organization here" image. |
| BUDGET_TOOL_NAME | **Optional.** The public-facing name for this budget installation, to be used in the front-end's HTML `<title>` element and in the alt-text for its logo. Defaults to "Budget". Able to be customized in case organizations want to call their iteration of this tool something more individualized than "Budget." |
| BUDGET_TOOL_LOGO_PATH | **Optional.** The wordmark for this budget installation, to be surfaced at the top-left of every budget view. Defaults to the standard "Budget" wordmark. Able to be customized in case organizations want to call their iteration of this tool something more individualized than "Budget." |


#### Per-install functional options

| Setting | Description |
| :-- | :-- |
| BUDGET_ADMIN_EMAIL | **Optional.** The email address of the primary technical contact for this budget installation. Used in various error-reporting devices throughout the app's front-end UI. Defaults to the email address of the first entry in Django's built-in `ADMINS` setting. |
| BUDGET_EXTERNAL_URLS | **Optional.** A dictionary of functionality-enhancing URLs that can be passed from Django to the front-end UI. For now, the only external URL that is specifically supported in the UI is `addVisualsRequest` — if set it will render a "Request visuals" button on budgeted graphics, photos and videos. More custom external URLs may be added at a later date. Defaults to an empty dict. |
| BUDGET_PRINT_SLUG_NAME | **Optional.** What to label the `external_slug` field when it's rendered in the front-end UI. Defaults to `None`, which also keeps the front-end from rendering this field. |
| BUDGET_SHOW_HEADLINES | **Optional.** Whether or not to show the still-under-development headline planning features. Defaults to False. |



#### Cross-domain options

These options should only be set when setting up `django-budget`'s frontend to be served from a different domain/subdomain from the APIs it consumes.

| Setting | Description |
| :-- | :-- |
| BUDGET_ALIASED_ORIGINS | **Optional.** A list of subdomains and domains where the budget app will be served from the URL root, rather than a subdomain (such as the recommended-by-default `/budget/`). Such domains typically require extra server-side setup. Defaults to an empty list. |
| BUDGET_ALIASED_API_URL | **Optional.** A common root URL that will be prepended onto the root API URLs for the budget and staff APIs (as set by `BUDGET_API_CONFIGS`). Defaults to '', which does not change the `BUDGET_API_CONFIGS` values at all. |


## Requirements

`django-budget` is designed to work with Django 1.11 and 2.0, and is compatible with Python 2.7 and Python 3.6+.

It uses Django's specific enhancements for the PostgreSQL database manager, along with the `psycopg2` library as an interface to Postgres.

It relies heavily on a related app, [`django-editorial-staff`](https://github.com/DallasMorningNews/django-editorial-staff/), that stores user byline data and the organizational scheme of a newsroom — needed to tie budgeted content to individual staffers and departments.


## Front-end development

`django-budget` front-end pages are built using ES6 and SCSS, and this app includes a Gulp installation that converts files written in these dialects to plain JavaScript and CSS, respectively.

When developing on the front-end, you'll need to run this Gulp installation yourself. Follow these steps to get started.

1.  Open a terminal window and navigate to the root of this app.

2.  Within the app, navigate to `./budget/staticapp`.

3.  If this is your first time running Gulp on this project, run `npm install` to install JS dependencies. This may take several minutes.

4.  Once your dependencies are installed, run `gulp` to begin local development.

5.  When your Gulp server says it's up and running, visit <http://127.0.0.1:3000/budget/> for a live preview of your front-end files.

6.  Proceed to modify your front-end interface by changing files in `./budget/staticapp/src/`. Your changes will be applied to the Gulp server URL without the need for to reload the page manually.
