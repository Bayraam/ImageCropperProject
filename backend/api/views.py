from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Image 
from .models import CropConfig
from .serializers import CropConfigSerializer
from PIL import Image
import io
import base64
import ast

def main_view(request):
    # Get the latest image if it exists, otherwise use None
    try:
        obj = Image.objects.get(pk=1)
    except Image.DoesNotExist:
        obj = None
    
    context = {'obj': obj}
    return render(request, 'main.html', context)




class ImagePreviewView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        print("=== DEBUG: ImagePreviewView called ===")
        print("Request data:", request.data)
        print("Request files:", request.FILES)
        print("Request POST:", request.POST)
        
        # 1. Uzmi sliku iz requesta
        image_file = request.FILES.get('image')
        crop_coords = request.data.get('crops')
        
        print("Image file:", image_file)
        print("Crop coords:", crop_coords)
        print("Crop coords type:", type(crop_coords))
        
        # 2. Validacija
        if not image_file or not crop_coords:
            print("ERROR: Missing image or crops")
            return Response({"error": "image and crops required"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Pretvori crop_coords u tuple/listu (sa stringa)
        try:
            print("Converting crop coords...")
            if isinstance(crop_coords, str):
                coords = ast.literal_eval(crop_coords)
            else:
                coords = crop_coords
            # Pretvori u tuple (x1, y1, x2, y2)
            coords = tuple(map(int, coords))
            print("Converted coords:", coords)
        except Exception as e:
            print("ERROR converting crops:", str(e))
            return Response({"error": f"Invalid crops: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Otvori sliku
        try:
            print("Opening image...")
            image = Image.open(image_file)
            print("Image opened successfully, size:", image.size)
        except Exception as e:
            print("ERROR opening image:", str(e))
            return Response({"error": f"Invalid image: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # 4.5. Validacija crop koordinata
        img_width, img_height = image.size
        x1, y1, x2, y2 = coords
        
        print(f"Received coords: {coords}")
        print(f"Image size: {img_width}x{img_height}")
        
        # Validacija crop koordinata
        if x1 < 0 or y1 < 0 or x2 > img_width or y2 > img_height:
            print(f"ERROR: Crop coordinates out of bounds. Image: {img_width}x{img_height}, Crop: {coords}")
            return Response({"error": f"Crop coordinates out of bounds. Image size: {img_width}x{img_height}"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Proveri da li je crop area validna
        if x1 >= x2 or y1 >= y2:
            print(f"ERROR: Invalid crop area. Crop: {coords}")
            return Response({"error": "Invalid crop area"}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Crop validation passed. Image: {img_width}x{img_height}, Crop: {coords}")

        # 5. Cropaj sliku
        try:
            print("Cropping image...")
            cropped = image.crop(coords)
            print("Image cropped successfully, size:", cropped.size)
        except Exception as e:
            print("ERROR cropping image:", str(e))
            return Response({"error": f"Crop failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # 6. Smanji na 5%
        try:
            print("Resizing image...")
            new_size = (int(cropped.size[0]*0.05), int(cropped.size[1]*0.05))
            preview = cropped.resize(new_size)
            print("Image resized successfully, new size:", new_size)
        except Exception as e:
            print("ERROR resizing image:", str(e))
            return Response({"error": f"Resize failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # 7. Vrati kao response
        try:
            print("Encoding image...")
            buffer = io.BytesIO()
            preview.save(buffer, format="PNG")
            img_str = base64.b64encode(buffer.getvalue()).decode()
            print("Image encoded successfully, length:", len(img_str))
            return Response({"image": img_str}, status=status.HTTP_200_OK)
        except Exception as e:
            print("ERROR encoding image:", str(e))
            return Response({"error": f"Encoding failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class CropConfigView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # 1. Validacija podataka
        scale_down = request.data.get('scaleDown', 0.05)
        logo_position = request.data.get('logoPosition', 'bottom-right')
        logo_image = request.FILES.get('logoImage')
        
        # 2. Validacija scale_down (max 0.25)
        if scale_down > 0.25:
            return Response({"error": "scaleDown cannot exceed 0.25"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Kreiraj konfiguraciju
        config = CropConfig.objects.create(
            scale_down=scale_down,
            logo_position=logo_position,
            logo_image=logo_image
        )
        
        # 4. Vrati serializer
        serializer = CropConfigSerializer(config)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ImageGenerateView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # 1. Uzmi sliku iz requesta
        image_file = request.FILES.get('image')
        crop_coords = request.data.get('crops')
        config_id = request.data.get('config_id')  # Dodajemo config_id za logo overlay
        
        # 2. Validacija
        if not image_file or not crop_coords:
            return Response({"error": "image and crops required"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Pretvori crop_coords u tuple/listu (sa stringa)
        try:
            if isinstance(crop_coords, str):
                coords = ast.literal_eval(crop_coords)
            else:
                coords = crop_coords
            # Pretvori u tuple (x1, y1, x2, y2)
            coords = tuple(map(int, coords))
        except Exception as e:
            return Response({"error": f"Invalid crops: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Otvori sliku
        try:
            image = Image.open(image_file)
        except Exception as e:
            return Response({"error": f"Invalid image: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # 4.5. Validacija crop koordinata
        img_width, img_height = image.size
        x1, y1, x2, y2 = coords
        
        # Validacija crop koordinata
        if x1 < 0 or y1 < 0 or x2 > img_width or y2 > img_height:
            return Response({"error": f"Crop coordinates out of bounds. Image size: {img_width}x{img_height}"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Proveri da li je crop area validna
        if x1 >= x2 or y1 >= y2:
            return Response({"error": "Invalid crop area"}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Cropaj sliku (bez smanjenja - high quality)
        cropped = image.crop(coords)

        # 6. LOGO OVERLAY FUNKCIONALNOST - NOVA FUNKCIONALNOST
        try:
            if config_id:
                # Uzmi konfiguraciju iz baze
                config = CropConfig.objects.get(pk=config_id)
                
                # Ako postoji logo slika, dodaj je na cropped sliku
                if config.logo_image and hasattr(config.logo_image, 'path'):
                    logo = Image.open(config.logo_image.path)
                    
                    # Resize logo prema scale_down parametru
                    logo_width = int(cropped.width * config.scale_down)
                    logo_height = int(cropped.height * config.scale_down)
                    logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
                    
                    # Pozicioni logo na cropped sliku
                    if config.logo_position == 'top-left':
                        position = (0, 0)
                    elif config.logo_position == 'top-right':
                        position = (cropped.width - logo_width, 0)
                    elif config.logo_position == 'bottom-left':
                        position = (0, cropped.height - logo_height)
                    elif config.logo_position == 'bottom-right':
                        position = (cropped.width - logo_width, cropped.height - logo_height)
                    else:  # center
                        position = ((cropped.width - logo_width) // 2, (cropped.height - logo_height) // 2)
                    
                    # Konvertuj u RGBA ako nije
                    if cropped.mode != 'RGBA':
                        cropped = cropped.convert('RGBA')
                    if logo.mode != 'RGBA':
                        logo = logo.convert('RGBA')
                    
                    # Paste logo na cropped sliku
                    cropped.paste(logo, position, logo)
                    
        except CropConfig.DoesNotExist:
            # Ako konfiguracija ne postoji, nastavi bez logo overlay-a
            pass
        except Exception as e:
            # Ako ima grešku sa logo overlay-om, nastavi bez njega
            print(f"Logo overlay error: {str(e)}")
            pass

        # 7. Vrati kao response (high quality, no scaling)
        buffer = io.BytesIO()
        cropped.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return Response({"image": img_str}, status=status.HTTP_200_OK)

class CropConfigListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """GET endpoint za sve konfiguracije"""
        configs = CropConfig.objects.all()
        serializer = CropConfigSerializer(configs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CropConfigUpdateView(APIView):
    permission_classes = [AllowAny]
    
    def put(self, request, pk):
        try:
            config = CropConfig.objects.get(pk=pk)
        except CropConfig.DoesNotExist:
            return Response({"error": "Configuration not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # 1. Validacija podataka
        scale_down = request.data.get('scaleDown', config.scale_down)
        logo_position = request.data.get('logoPosition', config.logo_position)
        logo_image = request.FILES.get('logoImage', config.logo_image)
        
        # 2. Validacija scale_down (max 0.25)
        if scale_down > 0.25:
            return Response({"error": "scaleDown cannot exceed 0.25"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Ažuriraj konfiguraciju
        config.scale_down = scale_down
        config.logo_position = logo_position
        if logo_image:
            config.logo_image = logo_image
        config.save()
        
        # 4. Vrati serializer
        serializer = CropConfigSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)