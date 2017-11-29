# Imports from python.  # NOQA
import os
from setuptools import find_packages
from setuptools import setup


REPO_URL = 'https://github.com/DallasMorningNews/django-budget/'

PYPI_VERSION = '0.7.5'


with open(os.path.join(os.path.dirname(__file__), 'README.rst')) as readme:
    README = readme.read()


# allow setup.py to be run from any path
os.chdir(os.path.normpath(os.path.join(os.path.abspath(__file__), os.pardir)))

setup(
    name='django-budget',
    version=PYPI_VERSION,
    packages=find_packages(),
    # packages=find_packages(exclude=['demo']),
    include_package_data=True,
    license='AGPLv3',
    description=' '.join([
        'A tool to help newsrooms manage their content,',
        'from pitch to planning to production.'
    ]),
    long_description=README,
    url=REPO_URL,
    download_url='{repo_url}archive/{version}.tar.gz'.format(**{
        'repo_url': REPO_URL,
        'version': PYPI_VERSION,
    }),
    author='Allan James Vestal, The Dallas Morning News',
    author_email='newsapps@dallasnews.com',
    classifiers=[
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: GNU Affero General Public License v3',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        # Replace these appropriately if you are stuck on Python 2.
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
    ],
    install_requires=[
        'Django>=1.9.0,<2.0',
        'django-admin-sortable2~=0.6.16',
        'django-editorial-staff>=0.5.2',
        'django-filter~=1.0.0',
        'djangorestframework~=3.6.0',
        'djangorestframework-camel-case~=0.2.0',
        'psycopg2~=2.6.1',
        'python-dateutil~=2.6.1',
        'pytz~=2017.2',
        'requests~=2.18.4',
        'six~=1.11.0',
    ],
    test_suite='runtests.runtests',
    tests_require=[
        'python-dotenv~=0.7.1',
        'dj-database-url~=0.4.2',
    ],
)
