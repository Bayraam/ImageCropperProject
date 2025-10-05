from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    path("image/preview", csrf_exempt(views.ImagePreviewView.as_view())),
    path("image/generate", csrf_exempt(views.ImageGenerateView.as_view())),
    path("config", csrf_exempt(views.CropConfigView.as_view())),
    path("config/", csrf_exempt(views.CropConfigListView.as_view())),  # GET sve konfiguracije
    path("config/<int:pk>", csrf_exempt(views.CropConfigUpdateView.as_view())),
]