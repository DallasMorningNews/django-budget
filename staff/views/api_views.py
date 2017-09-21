# Imports from Django.  # NOQA
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.module_loading import import_string
from django.views.generic import View


# Imports from staff.
from staff.models import Staffer, Hub, Vertical  # NOQA


PROVIDER_MODULE = getattr(settings, 'STAFF_DATA_PROVIDER', None)

DATA_PROVIDER = None
if PROVIDER_MODULE is not None:
    try:
        DataProviderClass = import_string(PROVIDER_MODULE)
        DATA_PROVIDER = DataProviderClass()
    except ImportError:
        pass


class StaffList(View):
    def get(self, request):
        staff = [
            s.as_object() for s in Staffer.objects.all()
        ]
        return JsonResponse(staff, safe=False)


class StaffFetch(View):
    def get(self, request, email):
        """Return a user instance.

        If user not found, query slack and create user if email exists.
        """
        staffer = Staffer.objects.filter(email=email).first()
        if staffer:
            # TODO(ajv): This should return a response that includes, at its
            # top level:
            #   - 'status': 200 (normal execution)
            #   - 'staffer': { .. } (value of staffer.as_object())
            return JsonResponse(staffer.as_object(), safe=False)
        else:
            print('A')
            print(email)

            if DATA_PROVIDER is not None:
                staffer_raw = DATA_PROVIDER.get_staffer(email)

                if staffer_raw is not None:
                    staffer_fmt = DATA_PROVIDER.format_staffer(staffer_raw)

                    new_staffer = Staffer.objects.create(**staffer_fmt)
                    new_staffer.save()

                    # TODO(ajv): This should return a response that includes,
                    # at its top level:
                    #   - 'status': 201 (record created)
                    #   - 'staffer': { .. } (value of new_staffer.as_object())
                    return JsonResponse(new_staffer.as_object(), safe=False)

            return JsonResponse({
                'status': 404,
                'msg': 'No staff member found.',
            })


class StaffRescrape(View):
    def get(self, request, email):
        if DATA_PROVIDER is not None:
            staffer_raw = DATA_PROVIDER.get_staffer(email)

            if staffer_raw is not None:
                staffer_fmt = DATA_PROVIDER.format_staffer(staffer_raw)

                return JsonResponse({
                    'status': 200,
                    'staffer': staffer_fmt,
                    'details': staffer_raw,
                })
            return JsonResponse({
                'status': 404,
                'msg': 'Staffer not found.',
            })

        return JsonResponse({
            'status': 501,
            'msg': ' '.join([
                'Rescraping requires a valid option in',
                '`settings.STAFF_DATA_PROVIDER`.'
            ])
        })


class HubList(View):
    def get(self, request):
        hubs = [
            h.as_object() for h in Hub.objects.all()
        ]
        return JsonResponse(hubs, safe=False)


class HubFetch(View):
    def get(self, request, slug):
        hub = Hub.objects.filter(slug=slug).first()
        if hub:
            return JsonResponse(hub.as_object(), safe=False)
        return JsonResponse({'msg': 'No hub found.'})


class VerticalList(View):
    def get(self, request):
        verticals = [
            v.as_object() for v in Vertical.objects.all()
        ]
        return JsonResponse(verticals, safe=False)


class VerticalFetch(View):
    def get(self, request, slug):
        vertical = Vertical.objects.filter(slug=slug).first()
        if vertical:
            return JsonResponse(vertical.as_object(), safe=False)
        return JsonResponse({'msg': 'No vertical found.'})
