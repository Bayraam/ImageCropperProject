import React, { useState, useEffect, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import axios from 'axios';

function ImageCropper() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [preview, setPreview] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);
  
  // NOVA STANJA ZA KONFIGURACIJE
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configForm, setConfigForm] = useState({
    scaleDown: 0.1,
    logoPosition: 'bottom-right',
    logoImage: null
  });

  // NOVA FUNKCIJA - Učitaj konfiguracije kada se komponenta učita
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Koristi environment varijablu ili fallback na localhost za development
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/config/`);
      setConfigurations(response.data);
    } catch (err) {
      console.error('Error loading configurations:', err);
    }
  };

  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file));
      setPreview(null);
      setGeneratedImage(null);
      setError(null);
      setCompletedCrop(null);
      // Start with no selection so user can draw freely
      setCrop(undefined);
    }
  };

  const handleCropComplete = (c) => {
    console.log("Crop completed:", c);
    console.log("Crop completed - width:", c?.width);
    console.log("Crop completed - height:", c?.height);
    setCompletedCrop(c);
  };

  const handlePreview = async () => {
    if (!selectedFile || !completedCrop) return;

    setLoading(true);
    setError(null);

    // Priprema crop koordinata: [x1, y1, x2, y2]
    // react-image-crop daje koordinate u pikselima kada je unit: 'px'
    const coords = [
      Math.round(completedCrop.x),
      Math.round(completedCrop.y),
      Math.round(completedCrop.x + completedCrop.width),
      Math.round(completedCrop.y + completedCrop.height)
    ];

    console.log("Crop data:", completedCrop);
    console.log("Calculated coords:", coords);

    // Proveri da li je crop validan
    console.log("Validating crop:", completedCrop);
    console.log("Crop width:", completedCrop?.width);
    console.log("Crop height:", completedCrop?.height);
    
    if (!completedCrop || !completedCrop.width || !completedCrop.height || 
        completedCrop.width < 10 || completedCrop.height < 10) {
      console.log("Crop validation failed!");
      setError("Please select a valid crop area (minimum 10x10 pixels)");
      setLoading(false);
      return;
    }
    
    console.log("Crop validation passed!");

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('crops', JSON.stringify(coords));

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const res = await axios.post(`${apiUrl}/api/image/preview`, formData, { withCredentials: false, headers: { 'Accept': 'application/json' } });
      setPreview(res.data.image);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile || !completedCrop) return;

    setLoading(true);
    setError(null);

    // Priprema crop koordinata: [x1, y1, x2, y2]
    const coords = [
      Math.round(completedCrop.x),
      Math.round(completedCrop.y),
      Math.round(completedCrop.x + completedCrop.width),
      Math.round(completedCrop.y + completedCrop.height)
    ];

    console.log("Generate - Crop data:", completedCrop);
    console.log("Generate - Calculated coords:", coords);

    // Proveri da li je crop validan
    if (!completedCrop || !completedCrop.width || !completedCrop.height || 
        completedCrop.width < 10 || completedCrop.height < 10) {
      setError("Please select a valid crop area (minimum 10x10 pixels)");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('crops', JSON.stringify(coords));
    
    // NOVO - Dodaj config_id ako je konfiguracija izabrana
    if (selectedConfig) {
      formData.append('config_id', selectedConfig.id);
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const res = await axios.post(`${apiUrl}/api/image/generate`, formData, { withCredentials: false, headers: { 'Accept': 'application/json' } });
      setGeneratedImage(res.data.image);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // NOVE FUNKCIJE ZA KONFIGURACIJE
  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('scaleDown', configForm.scaleDown);
    formData.append('logoPosition', configForm.logoPosition);
    if (configForm.logoImage) {
      formData.append('logoImage', configForm.logoImage);
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/config`, formData);
      setConfigurations([...configurations, response.data]);
      setConfigForm({ scaleDown: 0.1, logoPosition: 'bottom-right', logoImage: null });
      setShowConfigForm(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logoImage') {
      setConfigForm({ ...configForm, [name]: files[0] });
    } else {
      setConfigForm({ ...configForm, [name]: value });
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${generatedImage}`;
      link.download = 'cropped-image.png';
      link.click();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Image Cropper with Logo Overlay</h2>
      
      {/* NOVA SEKCIJA - KONFIGURACIJE */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h3>Logo Configuration</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Select Configuration:</label>
          <select 
            value={selectedConfig ? selectedConfig.id : ''} 
            onChange={(e) => {
              const config = configurations.find(c => c.id === parseInt(e.target.value));
              setSelectedConfig(config);
            }}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="">No logo overlay</option>
            {configurations.map(config => (
              <option key={config.id} value={config.id}>
                Config {config.id} - {config.logo_position} (scale: {config.scale_down})
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => setShowConfigForm(!showConfigForm)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showConfigForm ? 'Hide' : 'Create New'} Configuration
        </button>

        {showConfigForm && (
          <form onSubmit={handleConfigSubmit} style={{ marginTop: '15px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label>Scale Down (max 0.25):</label>
              <input
                type="number"
                name="scaleDown"
                value={configForm.scaleDown}
                onChange={handleConfigChange}
                min="0.01"
                max="0.25"
                step="0.01"
                style={{ marginLeft: '10px', padding: '5px' }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Logo Position:</label>
              <select
                name="logoPosition"
                value={configForm.logoPosition}
                onChange={handleConfigChange}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="center">Center</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Logo Image (PNG):</label>
              <input
                type="file"
                name="logoImage"
                accept="image/png"
                onChange={handleConfigChange}
                style={{ marginLeft: '10px' }}
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Configuration'}
            </button>
          </form>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
      </div>

      {imageUrl && (
        <div style={{ marginBottom: '20px' }}>
          <ReactCrop
            crop={crop}
            onChange={(newCrop, percentCrop) => {
              console.log("Crop changed:", newCrop, percentCrop);
              const image = imgRef.current;
              if (image && percentCrop?.width && percentCrop?.height) {
                const nx = Math.round((percentCrop.x / 100) * image.naturalWidth);
                const ny = Math.round((percentCrop.y / 100) * image.naturalHeight);
                const nw = Math.round((percentCrop.width / 100) * image.naturalWidth);
                const nh = Math.round((percentCrop.height / 100) * image.naturalHeight);
                setCrop({ unit: 'px', x: nx, y: ny, width: nw, height: nh });
              } else {
                setCrop(newCrop);
              }
              if (error) setError(null);
            }}
            onComplete={handleCropComplete}
            keepSelection={false}
            minWidth={10}
            minHeight={10}
            style={{ maxWidth: '100%', maxHeight: '400px' }}
          >
            <img 
              src={imageUrl} 
              alt="Preview" 
              ref={imgRef}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '400px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </ReactCrop>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handlePreview} 
          disabled={!completedCrop || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: completedCrop && !loading ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: completedCrop && !loading ? 'pointer' : 'not-allowed',
            marginRight: '10px'
          }}
        >
          {loading ? 'Processing...' : 'Crop & Preview'}
        </button>

        <button 
          onClick={handleGenerate} 
          disabled={!completedCrop || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: completedCrop && !loading ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: completedCrop && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Generating...' : 'Generate High Quality'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '4px'
        }}>
          Error: {error}
        </div>
      )}

      {preview && (
        <div style={{ marginTop: '20px' }}>
          <h3>Preview (5% of original size):</h3>
          <img 
            src={`data:image/png;base64,${preview}`} 
            alt="Preview" 
            style={{ 
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxWidth: '100%'
            }}
          />
        </div>
      )}

      {generatedImage && (
        <div style={{ marginTop: '20px' }}>
          <h3>Generated High Quality Image:</h3>
          {selectedConfig && (
            <div style={{ 
              marginBottom: '10px', 
              padding: '8px', 
              backgroundColor: '#d4edda', 
              border: '1px solid #c3e6cb', 
              borderRadius: '4px',
              color: '#155724'
            }}>
              ✅ Logo overlay applied: {selectedConfig.logo_position} (scale: {selectedConfig.scale_down})
            </div>
          )}
          <img 
            src={`data:image/png;base64,${generatedImage}`} 
            alt="Generated" 
            style={{ 
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxWidth: '100%'
            }}
          />
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={downloadImage}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageCropper;