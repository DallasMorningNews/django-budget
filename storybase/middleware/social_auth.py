# Imports from Django.  # NOQA
from django.conf import settings


# Imports from other dependencies.
from social_core.exceptions import AuthForbidden
from social_django.middleware import SocialAuthExceptionMiddleware


class FriendlySocialExceptionMiddleware(SocialAuthExceptionMiddleware):
    """Clearer error messaging when logins from non-allowed URLs fail.

    Subclasses the built-in social auth exception handler to provide
    specialized errors when someone tries to login with a Google account
    whose URL is not in 'SOCIAL_AUTH_GOOGLE_OAUTH2_WHITELISTED_DOMAINS'.
    """
    def get_message(self, request, exception):
        if type(exception) == AuthForbidden:
            allowed_backends = '/'.join([
                '@{}'.format(_)
                for _
                in settings.SOCIAL_AUTH_GOOGLE_OAUTH2_WHITELISTED_DOMAINS
            ])

            return (
                ''.join([
                    'DataLab requires a {} Google account, not a personal',
                    '@gmail.com account. Select your company Google account',
                    'during login or sign out of your personal Gmail account',
                    'to log in.'
                ]).format(allowed_backends)
            )

        return super(
            FriendlySocialExceptionMiddleware,
            self
        ).get_message(
            request,
            exception
        )
