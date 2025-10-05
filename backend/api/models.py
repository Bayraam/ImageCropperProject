from django.db import models



class CropConfig(models.Model):
    scale_down = models.FloatField(default=0.05)
    logo_position = models.CharField(max_length=50)
    logo_image = models.ImageField(upload_to="logos/")

class Image(models.Model):
    file = models.ImageField(upload_to ='images')
    scale_down = models.FloatField(default=0.05)
    logo_position = models.CharField(max_length=50)
    logo_image = models.ImageField(upload_to="images")
    uploaded = models.DateTimeField(auto_now_add = True)

    def __str__(self):
        return str(self.pk)
