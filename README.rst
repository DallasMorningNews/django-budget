django-budget
=============

--------------

*A tool to help newsrooms manage their content, from pitch to planning to production.*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

--------------

A project of *The Dallas Morning News*
''''''''''''''''''''''''''''''''''''''

--------------

``django-budget`` is a Django and JavaScript app that can track stories
as they are conceived, assembled and published.

It includes an approachable interface that can handle all the daily
demands of planning and assembling content across news organizations
large and small, based on a standards-compliant API that can be used by
other consumers — from chatbots to full-screen displays to many other
applications.

Detailed documentation (including a user guide) will be added at a later
date.

Quick start
-----------

1. Install this app into a Django project and virtual environment (more
   information about reaching this stage will also be forthcoming):

   ::

        pip install django-budget

2. Add "budget" to your INSTALLED_APPS setting like this:

   ::

       INSTALLED_APPS = [
           ...
           'budget',
       ]

3. Include the budget URLconf in your project urls.py like this:

   ::

       url(r'^budget/', include('budget.urls')),

4. Run ``python manage.py migrate`` to create the budget models.

5. Start the development server and visit http://127.0.0.1:8000/budget/
   to see your story budget and begin planning stories.

6. Visit http://127.0.0.1:8000/budget/api/ to explore the app’s REST
   API.

Requirements
------------

``django-budget`` is designed to work with Django 1.11 and 2.0, and is
compatible with Python 2.7 and Python 3.6+.

It uses Django’s specific enhancements for the PostgreSQL database
manager, along with the ``psycopg2`` library as an interface to
Postgres.

It relies heavily on a related app, ```django-editorial-staff```_, that
stores user byline data and the organizational scheme of a newsroom —
needed to tie budgeted content to individual staffers and departments.

Front-end development
---------------------

``django-budget`` front-end pages are built using ES6 and SCSS, and this
app includes a Gulp installation that converts files written in these
dialects to plain JavaScript and CSS, respectively.

When developing on the front-end, you’ll need to run this Gulp
installation yourself. Follow these steps to get started.

1. Open a terminal window and navigate to the root of this app.

2. Within the app, navigate to ``./budget/staticapp``.

3. If this is your first time running Gulp on this project, run
   ``npm install`` to install JS dependencies. This may take several
   minutes.

4. Once your dependencies are installed, run ``gulp`` to begin local
   development.

5. When your Gulp server says it’s up and running, visit
   http://127.0.0.1:3000/budget/ for a live preview of your front-end
   files.

6. Proceed to modify your front-end interface by changing files in
   ``./budget/staticapp/src/``. Your changes will be applied to the Gulp
   server URL without the need for to reload the page manually.

.. _``django-editorial-staff``: https://github.com/DallasMorningNews/django-editorial-staff/
