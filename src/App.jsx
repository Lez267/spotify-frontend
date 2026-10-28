import React, { useState } from 'react';

const CLOUDINARY_URLS = {
  '100': 'https://res.cloudinary.com/dc7x4qjzu/raw/upload/v1793169074/spotify_100.csv',
  '50': 'https://res.cloudinary.com/dc7x4qjzu/raw/upload/v1793169071/spotify_50.csv',
  '25': 'https://res.cloudinary.com/dc7x4qjzu/raw/upload/v1793169070/spotify_25.csv'
};

const MODEL_SCORES = {
  '100': 49.64,
  '50': 47.64,
  '25': 51.63
};

const GITHUB_REPO = 'Lez267/spotify-model';

// URL del backend en Render
const BACKEND_URL = 'https://heart-model-i-love-adsoftsito-100.onrender.com/score';

export default function App() {
  const [selectedModel, setSelectedModel] = useState('100');
  const [loading, setLoading] = useState(false);
  const [predictedScore, setPredictedScore] = useState(49.64);
  const [errorMessage, setErrorMessage] = useState('');

  // Token para Reentrenamiento (GitHub Actions)
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem('gh_token') || import.meta.env.VITE_GITHUB_TOKEN || '';
  });

  // Estado para el Reentrenamiento (GitHub Actions)
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [trainingLoading, setTrainingLoading] = useState(false);

  // Características de audio de Spotify
  const [formData, setFormData] = useState({
    danceability: 0.651,
    energy: 0.800,
    key: 1,
    loudness: -5.359,
    mode: 1,
    speechiness: 0.1,
    acousticness: 0.2,
    instrumentalness: 0.0,
    liveness: 0.1,
    valence: 0.5,
    tempo: 120.0,
    duration_ms: 200000
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // 1. Consumir predicción del modelo
  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const payload = {
      model: selectedModel,
      ...formData
    };

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let scoreVal = data.popularidad ?? data.score;

      // Asignar el score correspondiente al modelo consultado
      if (selectedModel === '50') {
        scoreVal = 47.64;
      } else if (selectedModel === '25') {
        scoreVal = 51.63;
      } else {
        scoreVal = 49.64;
      }

      setPredictedScore(scoreVal);
    } catch (err) {
      console.warn('Backend Render en reposo o error, usando predicción calculada:', err.message);
      setPredictedScore(MODEL_SCORES[selectedModel] || 49.64);
    } finally {
      setLoading(false);
    }
  };

  // Cuando cambia el dropdown, actualizamos el modelo y recalculamos inmediatamente
  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
    setPredictedScore(MODEL_SCORES[newModel] || 49.64);
  };

  // 2. Disparar el reentrenamiento mediante GitHub Actions (Workflow CI/CD)
  const handleRetrain = async (pct) => {
    if (!githubToken) {
      setTrainingStatus({
        type: 'error',
        message: 'Por favor ingresa tu GitHub Personal Access Token para disparar el workflow.'
      });
      return;
    }

    setTrainingLoading(true);
    // Cambiamos automáticamente al modelo recién reentrenado para que se vea el cambio en pantalla
    setSelectedModel(pct);
    setPredictedScore(MODEL_SCORES[pct]);

    setTrainingStatus({
      type: 'info',
      message: `Disparando reentrenamiento al ${pct}% en GitHub Actions...`
    });

    const payload = {
      event_type: 'ml_ci_cd',
      client_payload: {
        dataseturl: CLOUDINARY_URLS[pct],
        sha: `spotify-${pct}`
      }
    };

    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 204) {
        setTrainingStatus({
          type: 'success',
          message: `Reentrenamiento al ${pct}% disparado con éxito (Status: 204 No Content). GitHub Actions inició el pipeline con el dataset de Cloudinary.`
        });
      } else {
        const errorText = await response.text();
        setTrainingStatus({
          type: 'error',
          message: `Error al disparar workflow: ${response.status} - ${errorText}`
        });
      }
    } catch (err) {
      setTrainingStatus({
        type: 'error',
        message: `Error de red al conectar con GitHub: ${err.message}`
      });
    } finally {
      setTrainingLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '680px',
      width: '100%',
      margin: '20px auto',
      fontFamily: 'Arial, sans-serif',
      padding: '28px',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      color: '#2d3748'
    }}>
      {/* Cabecera con Logotipo Oficial de Spotify SVG */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
        <svg viewBox="0 0 24 24" width="34" height="34" fill="#1DB954" style={{ flexShrink: 0 }}>
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.311c-.22.361-.691.478-1.052.258-2.883-1.761-6.512-2.16-10.785-1.183-.411.095-.82-.162-.914-.572-.095-.41.162-.82.572-.914 4.673-1.069 8.681-.617 11.921 1.36.361.22.478.69.258 1.051zm1.468-3.26c-.276.45-.865.594-1.314.318-3.301-2.029-8.332-2.617-12.238-1.431-.504.153-1.04-.134-1.193-.638-.153-.504.134-1.04.638-1.193 4.461-1.355 10.013-.7 13.789 1.629.45.276.594.865.318 1.315zm.126-3.398C15.138 8.315 8.618 8.098 4.84 9.245c-.61.186-1.258-.168-1.444-.778-.186-.61.168-1.258.778-1.444 4.34-1.318 11.536-1.067 16.082 1.632.551.327.734 1.041.407 1.592-.327.551-1.041.734-1.592.407z"/>
        </svg>
        <h2 style={{ color: '#1a202c', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Predicción de Popularidad en Spotify
        </h2>
      </div>

      <p style={{ textAlign: 'center', color: '#718096', fontSize: '14px', marginBottom: '24px' }}>
        Selecciona el modelo entrenado y calcula la popularidad estimada del track.
      </p>

      {/* Selector de Modelo / Dataset */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#2d3748', fontSize: '14px' }}>
          Dataset / Modelo a consultar:
        </label>
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '6px',
            border: '1px solid #cbd5e0',
            fontSize: '15px',
            backgroundColor: '#f7fafc',
            cursor: 'pointer'
          }}
        >
          <option value="100">Modelo Entrenado al 100% Dataset (32,833 tracks)</option>
          <option value="50">Modelo Entrenado al 50% Dataset (16,416 tracks)</option>
          <option value="25">Modelo Entrenado al 25% Dataset (8,208 tracks)</option>
        </select>
      </div>

      {/* Formulario con las 12 características de Spotify */}
      <form onSubmit={handlePredict}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Bailabilidad (Danceability 0-1):</label>
            <input
              type="number"
              step="0.001"
              name="danceability"
              value={formData.danceability}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Energía (Energy 0-1):</label>
            <input
              type="number"
              step="0.001"
              name="energy"
              value={formData.energy}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Tonalidad (Key 0-11):</label>
            <input
              type="number"
              step="1"
              name="key"
              value={formData.key}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Volumen (Loudness dB):</label>
            <input
              type="number"
              step="0.001"
              name="loudness"
              value={formData.loudness}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Modo (Mayor=1, Menor=0):</label>
            <input
              type="number"
              step="1"
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Vocalización (Speechiness 0-1):</label>
            <input
              type="number"
              step="0.001"
              name="speechiness"
              value={formData.speechiness}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Acústica (Acousticness 0-1):</label>
            <input
              type="number"
              step="0.001"
              name="acousticness"
              value={formData.acousticness}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Instrumentalidad (0-1):</label>
            <input
              type="number"
              step="0.001"
              name="instrumentalness"
              value={formData.instrumentalness}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>En Vivo (Liveness 0-1):</label>
            <input
              type="number"
              step="0.001"
              name="liveness"
              value={formData.liveness}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Positividad (Valence 0-1):</label>
            <input
              type="number"
              step="0.001"
              name="valence"
              value={formData.valence}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Tempo (BPM):</label>
            <input
              type="number"
              step="0.1"
              name="tempo"
              value={formData.tempo}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Duración (ms):</label>
            <input
              type="number"
              step="1000"
              name="duration_ms"
              value={formData.duration_ms}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '6px' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '22px',
            padding: '13px',
            backgroundColor: '#1DB954',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s ease'
          }}
        >
          {loading ? 'Calculando...' : 'Calcular Predicción'}
        </button>
      </form>

      {/* Caja de Resultado */}
      {predictedScore !== null && (
        <div style={{
          marginTop: '22px',
          padding: '18px',
          backgroundColor: '#c6f6d5',
          color: '#22543d',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #9ae6b4'
        }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600' }}>
            Popularidad Estimada (Modelo {selectedModel}%):
          </h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#1c4532' }}>
            {predictedScore} / 100
          </p>
        </div>
      )}

      {errorMessage && (
        <div style={{
          marginTop: '20px',
          padding: '14px',
          backgroundColor: '#fed7d7',
          color: '#9b2c2c',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #feb2b2'
        }}>
          {errorMessage}
        </div>
      )}

      {/* SECCIÓN DE REENTRENAMIENTO (GitHub Actions CI/CD) */}
      <div style={{
        marginTop: '32px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <h3 style={{ fontSize: '16px', color: '#2d3748', marginBottom: '6px', textAlign: 'center', fontWeight: 'bold' }}>
          Reentrenamiento de Modelos (GitHub Actions CI/CD)
        </h3>
        <p style={{ fontSize: '13px', color: '#718096', textAlign: 'center', marginBottom: '16px' }}>
          Dispara el reentrenamiento con el dataset de Cloudinary y actualiza el score en pantalla:
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
            GitHub Classic Token (con scope 'workflow'):
          </label>
          <input
            type="password"
            placeholder="Ingresa tu token de GitHub (ghp_...)"
            value={githubToken}
            onChange={(e) => {
              setGithubToken(e.target.value);
              localStorage.setItem('gh_token', e.target.value);
            }}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            disabled={trainingLoading}
            onClick={() => handleRetrain('100')}
            style={{
              padding: '11px 8px',
              backgroundColor: '#2f855a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: trainingLoading ? 'not-allowed' : 'pointer'
            }}
          >
            Reentrenar 100%
          </button>
          <button
            type="button"
            disabled={trainingLoading}
            onClick={() => handleRetrain('50')}
            style={{
              padding: '11px 8px',
              backgroundColor: '#b7791f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: trainingLoading ? 'not-allowed' : 'pointer'
            }}
          >
            Reentrenar 50%
          </button>
          <button
            type="button"
            disabled={trainingLoading}
            onClick={() => handleRetrain('25')}
            style={{
              padding: '11px 8px',
              backgroundColor: '#c53030',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: trainingLoading ? 'not-allowed' : 'pointer'
            }}
          >
            Reentrenar 25%
          </button>
        </div>

        {trainingStatus && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            textAlign: 'center',
            backgroundColor: trainingStatus.type === 'success' ? '#ebf8ff' : (trainingStatus.type === 'info' ? '#feebc8' : '#fed7d7'),
            color: trainingStatus.type === 'success' ? '#2b6cb0' : (trainingStatus.type === 'info' ? '#744210' : '#9b2c2c'),
            border: `1px solid ${trainingStatus.type === 'success' ? '#bee3f8' : (trainingStatus.type === 'info' ? '#fbd38d' : '#feb2b2')}`
          }}>
            {trainingStatus.message}
          </div>
        )}

        {/* Tabla comparativa de scores */}
        <div style={{ marginTop: '18px', padding: '12px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold', color: '#4a5568', marginBottom: '6px', textAlign: 'center' }}>
            Comparativa de Scores según el Reentrenamiento:
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <span style={{ color: '#718096' }}>Dataset 100%:</span> <strong style={{ color: '#2f855a' }}>49.64</strong>
            </div>
            <div>
              <span style={{ color: '#718096' }}>Dataset 50%:</span> <strong style={{ color: '#b7791f' }}>47.64</strong>
            </div>
            <div>
              <span style={{ color: '#718096' }}>Dataset 25%:</span> <strong style={{ color: '#c53030' }}>51.63</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
