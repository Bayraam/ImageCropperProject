# Image Cropper - Full Stack Application

## 📋 Pregled Projekta

Ova aplikacija je **Image Cropper** - full-stack web aplikacija koja omogućava korisnicima da:
- Učitaju PNG slike
- Odaberu crop area (oblast za isecanje) mišem
- Vide preview isečene slike (5% originalne veličine)
- Generišu high-quality isečenu sliku
- Dodaju logo overlay na isečenu sliku
- Preuzmu finalnu sliku

## 🏗️ Arhitektura

### Backend (Django REST API)
- **Framework**: Django 5.2.7 + Django REST Framework
- **Baza**: SQLite (za development)
- **Port**: 8000
- **API Endpoints**:
  - `POST /api/image/preview` - Vraća smanjenu preview sliku (5%)
  - `POST /api/image/generate` - Vraća high-quality isečenu sliku
  - `POST /api/config` - Kreira novu konfiguraciju za logo overlay
  - `GET /api/config/` - Vraća sve konfiguracije
  - `PUT /api/config/{id}` - Ažurira konfiguraciju

### Frontend (React SPA)
- **Framework**: React 18
- **Port**: 3000
- **Funkcionalnosti**:
  - Drag & drop crop area selection
  - Real-time preview
  - Logo overlay configuration
  - Download generated images

### Containerization
- **Docker** za oba servisa
- **Docker Compose** za orkestraciju
- **Network**: imagecropper_network

## 🚀 Kako Pokrenuti

### Opcija 1: Docker Compose (Preporučeno)

   ```bash
# 1. Kloniraj repository
   git clone <repository-url>
cd imagecropper

# 2. Pokreni sve servise
   docker-compose up --build

# 3. Otvori aplikaciju
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

### Opcija 2: Lokalno Development

#### Backend:
   ```bash
   cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
   ```

#### Frontend:
   ```bash
cd frontend
npm install
npm start
```

## 📁 Struktura Projekta

```
imagecropper/
├── backend/                 # Django backend
│   ├── api/                # API aplikacija
│   │   ├── models.py       # Database modeli
│   │   ├── views.py        # API view-ovi
│   │   ├── serializers.py  # DRF serializeri
│   │   └── urls.py         # URL routing
│   ├── imagecropper/       # Django settings
│   ├── media/              # Uploaded fajlovi
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend Docker image
├── frontend/               # React frontend
│   ├── src/
│   │   ├── ImageCropper.js # Glavna komponenta
│   │   └── App.js          # React app
│   ├── package.json        # Node dependencies
│   └── Dockerfile          # Frontend Docker image
├── docker-compose.yml      # Docker orchestration
└── README.md              # Dokumentacija
```

## 🔧 API Dokumentacija

### 1. Image Preview Endpoint
```http
POST /api/image/preview
Content-Type: multipart/form-data

Parameters:
- image: PNG file (required)
- crops: JSON string [x1, y1, x2, y2] (required)

Response:
{
  "image": "base64_encoded_image"
}
```

### 2. Image Generate Endpoint
```http
POST /api/image/generate
Content-Type: multipart/form-data

Parameters:
- image: PNG file (required)
- crops: JSON string [x1, y1, x2, y2] (required)
- config_id: integer (optional) - za logo overlay

Response:
{
  "image": "base64_encoded_image"
}
```

### 3. Configuration Endpoints
```http
POST /api/config
Content-Type: multipart/form-data

Parameters:
- scaleDown: float (max 0.25)
- logoPosition: string
- logoImage: PNG file

GET /api/config/
Response: Array of configurations

PUT /api/config/{id}
Content-Type: multipart/form-data
Parameters: same as POST
```

## 🎯 Funkcionalnosti

### ✅ Implementirane Funkcionalnosti

1. **Image Upload & Display**
   - Podržava PNG format
   - Drag & drop interface
   - Real-time preview

2. **Crop Functionality**
   - Mouse-based crop area selection
   - Visual crop rectangle
   - Coordinate validation

3. **Preview System**
   - 5% scaled preview
   - Fast processing
   - Base64 encoding

4. **High-Quality Generation**
   - Original resolution
   - No quality loss
   - PNG format preservation

5. **Logo Overlay System**
   - Multiple position options
   - Configurable scale
   - PNG logo support
   - Visual feedback

6. **Configuration Management**
   - Create configurations
   - Select active configuration
   - Update existing configs

7. **Docker Support**
   - Multi-container setup
   - Service networking
   - Volume persistence

### 🎨 UI/UX Features

- **Responsive Design**: Radi na svim uređajima
- **Visual Feedback**: Loading states, error messages
- **Intuitive Controls**: Drag to crop, click to generate
- **Configuration Panel**: Easy logo setup
- **Download Support**: One-click image download

## 🛠️ Tehnički Detalji

### Backend Implementation

#### Models (models.py)
```python
class CropConfig(models.Model):
    scale_down = models.FloatField(default=0.05)
    logo_position = models.CharField(max_length=50)
    logo_image = models.ImageField(upload_to="logos/")
```

**Zašto ovako?**
- `scale_down`: FloatField jer trebamo decimalne vrijednosti (0.05 = 5%)
- `logo_position`: CharField jer su pozicije stringovi ('top-left', 'bottom-right')
- `logo_image`: ImageField jer Django automatski handle-uje file uploads

#### Views (views.py)
```python
class ImagePreviewView(APIView):
    def post(self, request):
        # 1. Validacija input-a
        # 2. Crop koordinata konverzija
        # 3. PIL Image processing
        # 4. 5% resize
        # 5. Base64 encoding
        # 6. Response
```

**Zašto ovako?**
- **APIView**: Koristim Django REST Framework APIView jer je jednostavan za REST endpoints
- **PIL (Pillow)**: Najbolja Python biblioteka za image processing
- **Base64**: Standardni format za slanje slika kroz JSON
- **Error handling**: Try-catch blokovi za robustnost

#### Logo Overlay Logic
```python
# Resize logo prema scale_down parametru
logo_width = int(cropped.width * config.scale_down)
logo_height = int(cropped.height * config.scale_down)
logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)

# Pozicioni logo
if config.logo_position == 'top-left':
    position = (0, 0)
elif config.logo_position == 'bottom-right':
    position = (cropped.width - logo_width, cropped.height - logo_height)
```

**Zašto ovako?**
- **Proporcionalno skaliranje**: Logo se skalira prema veličini cropped slike
- **LANCZOS resampling**: Najbolji algoritam za resize bez kvaliteta
- **Position mapping**: Jednostavno mapiranje string pozicija na koordinate

### Frontend Implementation

#### React Hooks
```javascript
const [selectedFile, setSelectedFile] = useState(null);
const [completedCrop, setCompletedCrop] = useState(null);
const [configurations, setConfigurations] = useState([]);
```

**Zašto ovako?**
- **useState**: React hooks za state management - jednostavniji od class components
- **Separate states**: Svaki state ima svoju svrhu (file, crop, configs)
- **Functional components**: Moderniji React pristup

#### Crop Coordinate Conversion
```javascript
const coords = [
  Math.round(completedCrop.x),
  Math.round(completedCrop.y),
  Math.round(completedCrop.x + completedCrop.width),
  Math.round(completedCrop.y + completedCrop.height)
];
```

**Zašto ovako?**
- **react-image-crop** daje koordinate u formatu {x, y, width, height}
- **Backend očekuje** format [x1, y1, x2, y2]
- **Math.round()**: Zaokružujem jer crop može imati decimalne koordinate
- **x2 = x + width**: Konvertujem width u x2 koordinatu

#### API Communication
```javascript
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const response = await axios.post(`${apiUrl}/api/image/generate`, formData);
```

**Zašto ovako?**
- **Environment variables**: REACT_APP_API_URL za Docker, localhost za development
- **axios**: Najbolja biblioteka za HTTP requests u React-u
- **FormData**: Potrebno za file uploads
- **Error handling**: Try-catch za robustnost

### Docker Implementation

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

**Zašto ovako?**
- **python:3.11-slim**: Najnoviji Python sa minimalnim size-om
- **WORKDIR /app**: Standardni practice za Docker
- **requirements.txt prvo**: Docker layer caching - ako se requirements ne mijenjaju, ne rebuilda se
- **0.0.0.0:8000**: Da Django prima requests sa bilo koje IP adrese (ne samo localhost)

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

**Zašto ovako?**
- **node:18-alpine**: Najnoviji Node.js sa minimalnim size-om
- **npm run build**: Production build React aplikacije
- **serve**: Lightweight server za serving static fajlova
- **Multi-stage nije potreban**: Jednostavna aplikacija

#### Docker Compose
```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes: ["./backend/media:/app/media"]
    networks: [imagecropper_network]
    
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - REACT_APP_API_URL=http://backend:8000
    networks: [imagecropper_network]
```

**Zašto ovako?**
- **Service names**: `backend` i `frontend` su service names u Docker network-u
- **Volumes**: Persistiraj uploaded fajlove
- **Networks**: Izolovana mreža za sigurnost
- **Environment variables**: REACT_APP_API_URL za komunikaciju između servisa

## 🧪 Testiranje

### Manual Testing
1. **Upload slike**: Testiraj PNG upload
2. **Crop area**: Testiraj drag & drop crop
3. **Preview**: Testiraj 5% preview
4. **Generate**: Testiraj high-quality generation
5. **Logo overlay**: Testiraj konfiguracije i logo overlay
6. **Download**: Testiraj download funkcionalnost

### API Testing
```bash
# Test preview endpoint
curl -X POST http://localhost:8000/api/image/preview \
  -F "image=@test.png" \
  -F "crops=[100,100,300,300]"

# Test generate endpoint
curl -X POST http://localhost:8000/api/image/generate \
  -F "image=@test.png" \
  -F "crops=[100,100,300,300]" \
  -F "config_id=1"
```

## 🚀 Deployment

### Lokalno
   ```bash
docker-compose up --build
```

### Production
1. **Environment variables**: Postavi production settings
2. **Database**: Koristi PostgreSQL umjesto SQLite
3. **Static files**: Konfiguriraj nginx za static files
4. **SSL**: Dodaj HTTPS
5. **Monitoring**: Dodaj logging i monitoring

## 📊 Performance

### Optimizacije
- **Image processing**: PIL optimizovan za brzinu
- **Base64 encoding**: Efikasno za male slike
- **React optimization**: useCallback, useMemo gdje je potrebno
- **Docker layers**: Optimizovani Dockerfile-ovi

### Limitations
- **File size**: Velike slike mogu biti spore
- **Memory**: PIL koristi RAM za image processing
- **Concurrent users**: SQLite nije optimalan za više korisnika

## 🔒 Sigurnost

### Implementirane mjere
- **CSRF exemption**: Za API endpoints
- **File validation**: Samo PNG fajlovi
- **Input validation**: Koordinate i parametri
- **Error handling**: Graceful error responses

### Preporuke za production
- **Authentication**: Dodaj JWT ili session auth
- **Rate limiting**: Ograniči API calls
- **File size limits**: Ograniči upload veličinu
- **Input sanitization**: Dodatna validacija

## 📈 Future Improvements

1. **Authentication**: User accounts
2. **Database**: PostgreSQL za production
3. **Caching**: Redis za performance
4. **CDN**: Za static files
5. **Monitoring**: Logging i metrics
6. **Testing**: Unit i integration tests
7. **CI/CD**: Automated deployment

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - slobodno koristi za bilo koju svrhu.

## 📞 Support

Za pitanja ili probleme:
- **Email**: harun.bajramovicvisoko@gmail.com

---
