import React, { useState, useRef } from 'react';
import './App.css';

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getPaletteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const colors = params.get('colors');
  if (colors) {
    return colors.split('-').map(c => '#' + c);
  }
  return null;
}

// Paletas populares y monocromáticas predefinidas
const POPULAR_PALETTES = [
  ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1'],
  ['#034F84', '#F7786B', '#DEEAEE', '#B1CBBB', '#F7CAC9'],
  ['#955251', '#B565A7', '#009B77', '#DD4124', '#D65076'],
  ['#45B8AC', '#EFC050', '#5B5EA6', '#9B2335', '#DFCFBE'],
  ['#6B5B95', '#FF6F61', '#88B04B', '#F7CAC9', '#955251'],
];
const MONOCHROME_PALETTES = [
  ['#22223B', '#4A4E69', '#9A8C98', '#C9ADA7', '#F2E9E4'],
  ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'],
  ['#232526', '#414345', '#636363', '#A2A2A2', '#E0E0E0'],
  ['#2D3142', '#4F5D75', '#BFC0C0', '#FFFFFF', '#EF8354'],
  ['#22223B', '#3A3A5D', '#5C5C8A', '#7E7EB7', '#AFAFD4'],
];

function App() {
  // Estado principal
  const [numColors, setNumColors] = useState(10);
  const [colors, setColors] = useState(() => getPaletteFromUrl() || Array.from({ length: 10 }, getRandomColor));
  const [savedPalettes, setSavedPalettes] = useState(() => JSON.parse(localStorage.getItem('palettes') || '[]'));
  const [imageColors, setImageColors] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const fileInputRef = useRef();

  // Cambiar cantidad de colores
  const handleNumColorsChange = (e) => {
    const value = Math.max(1, Number(e.target.value));
    setNumColors(value);
    setColors(Array.from({ length: value }, (_, i) => colors[i] || getRandomColor()));
  };

  // Generar paleta aleatoria
  const generatePalette = () => {
    setColors(Array.from({ length: numColors }, getRandomColor));
  };

  // Cambiar color individual
  const handleColorChange = (index, newColor) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);
  };

  // Copiar color al portapapeles con tooltip
  const copyToClipboard = (color, idx) => {
    navigator.clipboard.writeText(color);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  // Guardar paleta en localStorage
  const savePalette = () => {
    const newPalettes = [...savedPalettes, colors];
    setSavedPalettes(newPalettes);
    localStorage.setItem('palettes', JSON.stringify(newPalettes));
  };

  // Exportar paleta como JSON
  const exportAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(colors));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'palette.json');
    dlAnchorElem.click();
  };

  // Exportar paleta como imagen (PNG)
  const exportAsImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 60 * colors.length;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * 60, 0, 60, 60);
    });
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'palette.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // Compartir paleta por enlace
  const sharePalette = () => {
    const colorString = colors.map(c => c.replace('#', '')).join('-');
    const url = `${window.location.origin}${window.location.pathname}?colors=${colorString}`;
    navigator.clipboard.writeText(url);
    alert('¡Enlace copiado al portapapeles!');
  };

  // Extraer colores de una imagen (simple, usando canvas)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      const colorMap = {};
      for (let i = 0; i < data.length; i += 4) {
        const rgb = `${data[i]},${data[i+1]},${data[i+2]}`;
        colorMap[rgb] = (colorMap[rgb] || 0) + 1;
      }
      // Tomar los colores más frecuentes
      const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
      const topColors = sorted.slice(0, numColors).map(([rgb]) => {
        const [r, g, b] = rgb.split(',');
        return `#${(+r).toString(16).padStart(2, '0')}${(+g).toString(16).padStart(2, '0')}${(+b).toString(16).padStart(2, '0')}`;
      });
      setImageColors(topColors);
      setColors(topColors);
    };
  };

  // Cargar paleta guardada
  const loadPalette = (palette) => {
    setNumColors(palette.length);
    setColors(palette);
  };

  // Eliminar paleta guardada
  const deletePalette = (idx) => {
    const newPalettes = savedPalettes.filter((_, i) => i !== idx);
    setSavedPalettes(newPalettes);
    localStorage.setItem('palettes', JSON.stringify(newPalettes));
  };

  // Cargar paleta popular o monocromática
  const loadQuickPalette = (palette) => {
    setNumColors(palette.length);
    setColors(palette);
  };

  return (
    <div className="App">
      <div className="header">
        <div className="header-logo" title="Generador de paletas"> 🎨</div>
        <div className="header-title">Generador de Paleta de Colores</div>
        <div className="header-desc">Crea, guarda, exporta y comparte paletas de colores para tus proyectos.</div>
        <div style={{ marginTop: 16 }}>
          <a
            href="https://paypal.me/jeang0312?country.x=VE&locale.x=es_XC"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#0070ba',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 16,
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Donar con PayPal
          </a>
        </div>
      </div>
      <div className="controls">
        <label>
          Cantidad de colores:
          <input
            type="number"
            min="1"
            value={numColors}
            onChange={handleNumColorsChange}
            style={{ width: 60, marginLeft: 8 }}
          />
        </label>
        <button onClick={generatePalette}>Generar aleatoria</button>
        <button onClick={savePalette}>Guardar paleta</button>
        <button onClick={exportAsJSON}>Exportar JSON</button>
        <button onClick={exportAsImage}>Exportar imagen</button>
        <button onClick={sharePalette}>Compartir enlace</button>
        <button onClick={() => fileInputRef.current.click()}>Extraer de imagen</button>
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
      </div>

      {/* Paletas populares */}
      <h2>Paletas populares</h2>
      <div className="quick-palettes">
        {POPULAR_PALETTES.map((palette, idx) => (
          <div key={idx} className="quick-palette">
            {palette.map((color, i) => (
              <span key={i} className="mini-color" style={{ background: color }}></span>
            ))}
            <button onClick={() => loadQuickPalette(palette)}>Usar</button>
          </div>
        ))}
      </div>

      {/* Paletas monocromáticas */}
      <h2>Paletas monocromáticas</h2>
      <div className="quick-palettes">
        {MONOCHROME_PALETTES.map((palette, idx) => (
          <div key={idx} className="quick-palette">
            {palette.map((color, i) => (
              <span key={i} className="mini-color" style={{ background: color }}></span>
            ))}
            <button onClick={() => loadQuickPalette(palette)}>Usar</button>
          </div>
        ))}
      </div>

      {/* Previsualización de la paleta como imagen */}
      <div className="palette-preview">
        <svg width="100%" height="60" viewBox={`0 0 ${colors.length * 80} 60`} style={{maxWidth:'600px',margin:'0 auto',display:'block'}}>
          {colors.map((color, idx) => (
            <rect key={idx} x={idx*80} y={0} width={80} height={60} fill={color} />
          ))}
        </svg>
      </div>

      {/* Paleta principal */}
      <div className="palette">
        {colors.map((color, idx) => (
          <div key={idx} className={`color-block${copiedIdx === idx ? ' copied' : ''}`} style={{ background: color }}>
            <input
              type="color"
              value={color}
              onChange={e => handleColorChange(idx, e.target.value)}
              className="color-picker"
            />
            <span className="color-code">{color}</span>
            <button className="copy-btn" onClick={() => copyToClipboard(color, idx)}>
              Copiar
            </button>
            <span className="tooltip">¡Copiado!</span>
          </div>
        ))}
      </div>

      {/* Paletas guardadas */}
      <h2>Paletas guardadas</h2>
      <div className="saved-palettes">
        {savedPalettes.length === 0 && <p>No hay paletas guardadas.</p>}
        {savedPalettes.map((palette, idx) => (
          <div key={idx} className="saved-palette">
            {palette.map((color, i) => (
              <span key={i} className="mini-color" style={{ background: color }}></span>
            ))}
            <button onClick={() => loadPalette(palette)}>Cargar</button>
            <button onClick={() => deletePalette(idx)}>Eliminar</button>
          </div>
        ))}
      </div>
      <div className="footer">
        © 2025 Jean Guerrero. Todos los derechos reservados.
      </div>
    </div>
  );
}

export default App;
