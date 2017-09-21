# Imports from Django.  # NOQA
from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic.base import RedirectView
from django.views.generic import View
from django.views.generic.edit import CreateView, UpdateView  # NOQA
from django.shortcuts import render_to_response  # NOQA
from django.urls import reverse_lazy


# Imports from staff.
from staff.models import Staffer  # NOQA


class Staffers(LoginRequiredMixin, View):
    def get(self, request):
        staff = Staffer.objects.all()

        latest_additions = Staffer.objects.order_by('-created')[:10]

        return render_to_response(
            'staff/staffer_list.html',
            {
                'latest_additions': latest_additions,
                'staff': staff
            }
        )


class StafferCreate(LoginRequiredMixin, CreateView):
    template_name = 'staff/staffer_create.html'
    model = Staffer
    fields = ['email', 'first_name', 'last_name', 'active', 'image_url']

    def get_context_data(self, *args, **kwargs):
        """Add 'STAFF_EMAIL_DOMAIN' setting to context."""
        context = super(StafferCreate, self).get_context_data(*args, **kwargs)

        email_domain = getattr(settings, 'STAFF_EMAIL_DOMAIN', 'example.com')

        context.update({'mainEmailDomain': email_domain})

        return context

    def get_success_url(self):
        submit_action = self.request.POST.get('submit', '_save')

        if submit_action == '_continue':
            return reverse_lazy('staff:staffer-edit', kwargs={
                'pk': self.object.id,
            })

        return reverse_lazy('staff:staffer-list')


class StafferDetail(LoginRequiredMixin, RedirectView):
    permanent = False
    query_string = True
    pattern_name = 'staff:staffer-edit'


class StafferUpdate(LoginRequiredMixin, UpdateView):
    template_name = 'staff/staffer_edit.html'
    model = Staffer
    fields = ['email', 'first_name', 'last_name', 'active', 'image_url']

    def get_success_url(self):
        submit_action = self.request.POST.get('submit', '_save')

        if submit_action == '_continue':
            return reverse_lazy('staff:staffer-edit', kwargs=self.kwargs)

        return reverse_lazy('staff:staffer-list')
