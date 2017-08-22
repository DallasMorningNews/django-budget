# Imports from Django.  # NOQA
from django.contrib.auth import logout
from django.views.generic import RedirectView


class LogoutView(RedirectView):
    """A view that logs the user out and redirects to the homepage."""
    permanent = False
    query_string = True
    pattern_name = 'home'

    def get_redirect_url(self, *args, **kwargs):
        """Log the user out and redirect them to the target url."""
        if self.request.user.is_authenticated():
            logout(self.request)
        return super(LogoutView, self).get_redirect_url(*args, **kwargs)
