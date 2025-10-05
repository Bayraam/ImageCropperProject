from rest_framework import serializers
from .models import CropConfig

class CropConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CropConfig
        fields = "__all__"