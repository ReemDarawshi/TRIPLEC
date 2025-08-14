// Settings.tsx — כולל אייקוני מחיקה ללוגואים וגלריה
import React, { useState, useEffect } from 'react';
import './Settings.css';

interface GalleryImage {
  file: File;
  description: string;
}

const Settings = () => {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [logos, setLogos] = useState<File[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#0d47a1');
  const [palette, setPalette] = useState<string[]>(['#0d47a1', '#90caf9']);
  const [fontTitle, setFontTitle] = useState('Alef');
  const [fontSubtitle, setFontSubtitle] = useState('Assistant');
  const [fontParagraph, setFontParagraph] = useState('Rubik');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('brandSettings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBusinessName(parsed.businessName || '');
        setDescription(parsed.description || '');
        setPrimaryColor(parsed.primaryColor || '#0d47a1');
        setPalette(parsed.palette || []);
        setFontTitle(parsed.fontTitle || 'Alef');
        setFontSubtitle(parsed.fontSubtitle || 'Assistant');
        setFontParagraph(parsed.fontParagraph || 'Rubik');
        setLocation(parsed.location || '');
      } catch (e) {
        console.error('שגיאה בטעינת הגדרות מה־localStorage', e);
      }
    }
  }, []);

  const handleAddGalleryImages = (files: FileList) => {
    const newImages: GalleryImage[] = [];
    Array.from(files).forEach((file) => {
      const desc = prompt(`תיאור לתמונה ${file.name}`) || '';
      newImages.push({ file, description: desc });
    });
    setGallery(prev => [...prev, ...newImages]);
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setGallery(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAddLogos = (files: FileList) => {
    const newFiles = Array.from(files);
    setLogos(prev => [...prev, ...newFiles]);
  };

  const removeLogo = (index: number) => {
    setLogos(prev => prev.filter((_, i) => i !== index));
  };

  const addColorToPalette = () => {
    const newColor = prompt('הזיני קוד HEX של צבע חדש (למשל #ff5722):');
    if (newColor && /^#([0-9A-F]{3}){1,2}$/i.test(newColor)) {
      setPalette(prev => [...prev, newColor]);
    } else {
      alert('קוד צבע לא תקין.');
    }
  };

  const removeColorFromPalette = (index: number) => {
    setPalette(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = {
      businessName,
      description,
      primaryColor,
      palette,
      fontTitle,
      fontSubtitle,
      fontParagraph,
      location,
    };
    localStorage.setItem('brandSettings', JSON.stringify(settings));
    alert('ההגדרות נשמרו בהצלחה');
  };

  return (
    <div className="settings-page">
      <h2>הגדרות מותג</h2>
      <form onSubmit={handleSubmit}>
        <label>
          שם העסק:
          <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} />
        </label>

        <label>
          תיאור העסק (לטובת עיצוב חכם):
          <textarea value={description} onChange={e => setDescription(e.target.value)} />
        </label>

        <label>
         תמונה ראשית של העסק:
          <input
          type="file"
          accept="image/*"
          onChange={e => setMainImage(e.target.files?.[0] || null)}
          />
        </label>

        {mainImage && (
        <div className="preview-item">
          <img src={URL.createObjectURL(mainImage)} alt="main-preview" />
        </div>
        )}


        <label>
          לוגואים (ניתן לבחור כמה):
          <input type="file" accept="image/*" multiple onChange={e => {
            if (e.target.files?.length) handleAddLogos(e.target.files);
          }} />
        </label>

        {logos.length > 0 && (
          <div className="gallery-preview">
            {logos.map((logo, index) => (
              <div key={index} className="gallery-item">
                <div style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(logo)} alt={`logo-${index}`} />
                  <button
                    onClick={() => removeLogo(index)}
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                    title="מחק לוגו"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label>
          הוסף תמונות לגלריה (ניתן לבחור כמה):
          <input type="file" accept="image/*" multiple onChange={e => {
            if (e.target.files?.length) handleAddGalleryImages(e.target.files);
          }} />
        </label>

        {gallery.length > 0 && (
          <div className="gallery-preview">
            {gallery.map((img, index) => (
              <div key={index} className="gallery-item">
                <div style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(img.file)} alt={`gallery-${index}`} />
                  <button
                    onClick={() => removeGalleryImage(index)}
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                    title="מחק תמונה"
                  >×</button>
                </div>
                <p>{img.description}</p>
              </div>
            ))}
          </div>
        )}

        <label>
          צבע ראשי:
          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
        </label>

        <label>
          פלטת צבעים:
          <div className="color-palette">
            {palette.map((color, index) => (
              <div
                key={index}
                className="color-circle"
                style={{ backgroundColor: color }}
                onClick={() => removeColorFromPalette(index)}
                title="לחצי להסרה"
              ></div>
            ))}
            <button type="button" className="add-color-btn" onClick={addColorToPalette}>+</button>
          </div>
        </label>

        <label>
          גופן כותרת:
          <select value={fontTitle} onChange={e => setFontTitle(e.target.value)}>
            <option value="Alef">Alef</option>
            <option value="Assistant">Assistant</option>
            <option value="Rubik">Rubik</option>
            <option value="Heebo">Heebo</option>
          </select>
        </label>

        <label>
          גופן תת־כותרת:
          <select value={fontSubtitle} onChange={e => setFontSubtitle(e.target.value)}>
            <option value="Alef">Alef</option>
            <option value="Assistant">Assistant</option>
            <option value="Rubik">Rubik</option>
            <option value="Heebo">Heebo</option>
          </select>
        </label>

        <label>
          גופן פסקאות:
          <select value={fontParagraph} onChange={e => setFontParagraph(e.target.value)}>
            <option value="Alef">Alef</option>
            <option value="Assistant">Assistant</option>
            <option value="Rubik">Rubik</option>
            <option value="Heebo">Heebo</option>
          </select>
        </label>

        <label>
          מיקום העסק (אופציונלי):
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} />
        </label>

        <button type="submit" className="btn-save">שמור הגדרות</button>
      </form>
    </div>
  );
};

export default Settings;