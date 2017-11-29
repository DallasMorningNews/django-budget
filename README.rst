django-budget
=============

*A tool to help newsrooms manage their content, from pitch to planning to production.*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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

#. Install this app into a Django project and virtual environment (more
   information about reaching this stage will also be forthcoming):

   ::

        pip install django-budget

#. Add "budget" to your INSTALLED_APPS setting like this:

   ::

       INSTALLED_APPS = [
           ...
           'budget',
       ]

#. Include the budget URLconf in your project urls.py like this:

   ::

       url(r'^budget/', include('budget.urls')),

#. Run ``python manage.py migrate`` to create the budget models.

#. Start the development server and visit http://127.0.0.1:8000/budget/
   to see your story budget and begin planning stories.

#. Visit http://127.0.0.1:8000/budget/api/ to explore the app's REST
   API.

More information
----------------

Find out more about ``django-budget`` -- including a walkthrough of its configuration settings and of its requirements -- in the **README.md** file at the root of this codebase.
