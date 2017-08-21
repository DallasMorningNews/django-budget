# Imports from Django.  # NOQA
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View
from django.views.generic.edit import CreateView, UpdateView  # NOQA
from django.shortcuts import render_to_response, get_object_or_404  # NOQA
from django.http import JsonResponse
from django.urls import reverse_lazy


# Imports from staff.
from staff.models import Staffer, Hub, Vertical, slack_user_search  # NOQA


class Staffers(LoginRequiredMixin, View):
    def get(self, request):
        staff = Staffer.objects.all()
        last_add = Staffer.objects.order_by('-pk').first()
        return render_to_response(
            'staff/staffers.html',
            {
                'last_add': last_add,
                'staff': staff
            }
        )


class StaffCreate(LoginRequiredMixin, CreateView):
    template_name = 'staff/staffer_new.html'
    model = Staffer
    fields = ['email']
    success_url = reverse_lazy('staff-staffers')


class StaffUpdate(LoginRequiredMixin, UpdateView):
    template_name = 'staff/staffer_edit.html'
    model = Staffer
    fields = ['email', 'first_name', 'last_name', 'active', 'image_url']
    success_url = reverse_lazy('staff-staffers')


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
        staff = Staffer.objects.filter(email=email).first()
        if staff:
            return JsonResponse(staff.as_object(), safe=False)
        else:
            staffer = slack_user_search(email)
            if staffer:
                new_staffer = Staffer.objects.create(email=email)
                new_staffer.save()
                return JsonResponse(new_staffer.as_object(), safe=False)
            return JsonResponse({'msg': 'No staff member found.'})


class StaffRescrape(View):
    def get(self, request, email):
        staffer = get_object_or_404(Staffer, email=email)
        staffer.fetch_slack_details()
        staffer.save()
        return JsonResponse({'msg': 'RESCRAPE OK'})


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
