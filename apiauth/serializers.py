# Imports from Django.  # NOQA
from django.contrib.auth.models import User


# Imports from other dependencies.
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.ReadOnlyField(source='get_full_name')

    class Meta:  # NOQA
        model = User
        fields = ('id', 'url', 'username', 'first_name', 'last_name',
                  'display_name', 'email', 'is_staff', 'is_active',)
