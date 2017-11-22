# Imports from python.  # NOQA
# import os
import sys


# Imports from Django.
import django
# from django.conf import settings
from django.test.runner import DiscoverRunner


# Imports from other dependencies.
from dotenv import find_dotenv
from dotenv import load_dotenv


def runtests():
    print('mk5.3')
    load_dotenv(find_dotenv())
    django.setup()

    test_runner = DiscoverRunner(verbosity=1)
    failures = test_runner.run_tests([
        # 'budget.tests.models',
        # 'budget.tests.misc',
    ])
    if failures:
        sys.exit(failures)

    sys.exit(bool(failures))


if __name__ == '__main__':
    runtests()
