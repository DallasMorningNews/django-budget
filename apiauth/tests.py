# Imports from python.  # NOQA
import json


# Imports from Django.
from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase, override_settings  # NOQA


# Imports from other dependencies.
from rest_framework.test import APIClient


@override_settings(ROOT_URLCONF='apiauth.urls', LOGIN_URL='/login/')
class UserEndpointTestCase(TestCase):
    def test_authed_user(self):
        """Authed users should have their user info returned by the /me/
        endpoint"""
        user = User.objects.create_user('user', email='a@b.com')
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.get('/api/users/me/', {'format': 'json'})
        self.assertEqual(response.status_code, 200)

        json_response = json.loads(response.content)
        self.assertEqual(json_response['username'], 'user')
        self.assertEqual(json_response['email'], 'a@b.com')

    def test_anon_user(self):
        """Anonymous users trying to access the /me/ endoint should get a 403
        and the site's LOGIN_URL"""
        client = APIClient()
        response = client.get('/api/users/me/', {'format': 'json'})
        self.assertEqual(response.status_code, 403)

        expect = {
            'loginUrl': 'http://testserver%s' % settings.LOGIN_URL,
            'loginRedirectUrl': None,
            'detail': 'Login required'
        }
        self.assertJSONEqual(response.content, expect)

    def test_anon_user_with_referral(self):
        """When an anonymous user is denied access, and there's a referrer
        present, return a login URL that redirects to the referrer"""
        client = APIClient()
        response = client.get('/api/users/me/', {'format': 'json'},
                              HTTP_REFERER='http://c.com')
        self.assertEqual(response.status_code, 403)

        expected_login_url = ''.join((
            'http://testserver',
            settings.LOGIN_URL,
            '?next=/redirect/?to=http%3A%2F%2Fc.com'
        ))
        expect = {
            'loginUrl': 'http://testserver%s' % settings.LOGIN_URL,
            'loginRedirectUrl': expected_login_url,
            'detail': 'Login required'
        }
        self.assertJSONEqual(response.content, expect)


@override_settings(ROOT_URLCONF='apiauth.urls', LOGIN_URL='/login/')
class ExternalRedirectTestCase(TestCase):
    def setUp(self):
        user = User.objects.create_user('user')
        self.client.force_login(
            user, backend='django.contrib.auth.backends.ModelBackend')

    def test_missing_to_param(self):
        """Should return a bad request error if there's no 'to' URL param"""
        response = self.client.get('/redirect/')
        self.assertEqual(response.status_code, 400)

    def test_not_in_whitelist(self):
        """Should throw a forbidden error if the requested redirect URL isn't
        in the APIAUTH_WHITELIST"""
        response = self.client.get('/redirect/?to=http://google.com/')
        self.assertEqual(response.status_code, 403)

    @override_settings(APIAUTH_WHITELIST='google.com')
    def test_successful_redirect(self):
        """Should do a 302 redirection if the requested domain is in the
        whitelist"""
        response = self.client.get('/redirect/?to=http://google.com/')
        self.assertRedirects(
            response, 'http://google.com/', status_code=302,
            fetch_redirect_response=False)
