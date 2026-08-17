/**
 * קובץ: Settings.tsx
 * תיאור: קומפוננטת React שמציגה ומנהלת את הגדרות המותג של העסק במערכת TRIPLE.
 * 
 * הפונקציונליות כוללת:
 * - שליפת הגדרות מותג קיימות מהשרת (שם עסק, תיאור, צבעים, פונטים, מיקום ועוד).
 * - העלאה ושמירה של תמונה ראשית, לוגואים וגלריית תמונות.
 * - עריכת פלטת צבעים מותאמת אישית.
 * - בחירת פונטים עבור כותרות, תתי־כותרות ופסקאות מתוך רשימת פונטים זמינים.
 * - שליחת טופס `multipart/form-data` לשרת כולל קבצים ושדות טקסט.
 * 
 * נקודות API:
 * - GET  `/api/brand-settings` – שליפת הגדרות קיימות.
 * - POST `/api/brand-settings` – שמירת הגדרות מעודכנות.
 * 
 * הערות נוספות:
 * - התמונות מוצגות כ־preview לאחר העלאה או שליפה מהשרת.
 * - נעשה שימוש ב־localStorage לשמירה זמנית של הגדרות מותג.
 * - כל הפעולות מוגנות באמצעות טוקן שנשמר ב־localStorage.
 *  */

import React, { useState, useEffect } from 'react';
import './Settings.css';

interface GalleryImage {
  file: File;
  description: string;
}

interface ExistingGalleryItem {
  path: string;
  description: string;
}

const Settings = () => {
  // נתונים חדשים - תצוגה של קבצים קיימים מהשרת
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [existingLogos, setExistingLogos] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<ExistingGalleryItem[]>([]);

  // משתנים קיימים
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
  // הקשר שיווקי לעסק
  const [businessCategory, setBusinessCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [toneOfVoice, setToneOfVoice] = useState<string[]>([]);
  const [uniqueValueProposition, setUniqueValueProposition] = useState('');
  const [mainProductsServices, setMainProductsServices] = useState('');
  const [marketingGoals, setMarketingGoals] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [preferredCta, setPreferredCta] = useState('');
  const [preferredPhrases, setPreferredPhrases] = useState('');
  const [avoidPhrases, setAvoidPhrases] = useState('');
  const [newColor, setNewColor] = useState('#cccccc');
  const availableFonts = [
  { name: "RubikGemstones-Regular", label: "Rubik Gemstones" },
  { name: "RubikDistressed-Regular", label: "Rubik Distressed" },
  { name: "Arima-VariableFont_wght", label: "Arima Variable" },
  { name: "Pacifico-Regular", label: "Pacifico" },
  { name: "Borel-Regular", label: "Borel" }
];

const handleDeleteExistingLogo = async (index: number) => {
  const confirmed = window.confirm('האם למחוק את הלוגו הזה?');
  if (!confirmed) return;

  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/brand-settings/logo/${index}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    setExistingLogos(prev => prev.filter((_, i) => i !== index));
  } else {
    alert('שגיאה במחיקת לוגו');
  }
};

const handleDeleteExistingGalleryImage = async (index: number) => {
  const confirmed = window.confirm('האם למחוק את התמונה מהגלריה?');
  if (!confirmed) return;

  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/brand-settings/gallery/${index}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    setExistingGallery(prev => prev.filter((_, i) => i !== index));
  } else {
    alert('שגיאה במחיקת תמונה מהגלריה');
  }
};


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/brand-settings', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('נכשל בטעינת הגדרות המותג');
        }

        const data = await response.json();

        setBusinessName(data.businessName || '');
        setDescription(data.description || '');
        setPrimaryColor(data.primaryColor || '#0d47a1');
        setPalette(data.palette || []);
        setFontTitle(data.fontTitle || 'Alef');
        setFontSubtitle(data.fontSubtitle || 'Assistant');
        setFontParagraph(data.fontParagraph || 'Rubik');
        setLocation(data.location || '');
        setBusinessCategory(data.businessCategory || '');
        setTargetAudience(data.targetAudience || '');

        setToneOfVoice(
          data.toneOfVoice
          ? data.toneOfVoice.split(',').filter(Boolean)
          : []
        );

        setUniqueValueProposition(data.uniqueValueProposition || '');
        setMainProductsServices(data.mainProductsServices || '');

        setMarketingGoals(
          data.marketingGoals
            ? data.marketingGoals.split(',').filter(Boolean)
            : []
          );

        setPreferredLanguage(data.preferredLanguage || '');
        setPreferredCta(data.preferredCta || '');
        setPreferredPhrases(data.preferredPhrases || '');
        setAvoidPhrases(data.avoidPhrases || '');

        // שליפת תמונות קיימות מהשרת
        setMainImageUrl(
  data.mainImage ? `http://localhost:5000/${data.mainImage}` : null
);

setExistingLogos(
  data.logos
    ? data.logos.map((logo: string) => `http://localhost:5000/${logo}`)
    : []
);

setExistingGallery(
  data.gallery
    ? data.gallery.map((item: any) => ({
        path: `http://localhost:5000/${item.path}`,
        description: item.description
      }))
    : []
);


        localStorage.setItem('brandSettings', JSON.stringify(data));
      } catch (error) {
        console.error('שגיאה בטעינת ההגדרות:', error);
      }
    };

    fetchSettings();
  }, []);
const handleDeleteMainImage = async () => {
  const confirmed = window.confirm('האם למחוק את התמונה הראשית?');
  if (!confirmed) return;

  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/brand-settings/main-image`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    setMainImageUrl(null);
  } else {
    alert('שגיאה במחיקת התמונה הראשית');
  }
};

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

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formData = new FormData();
  const token = localStorage.getItem('token');

  // מוסיפים קודם את כל השדות ל־FormData
  formData.append('businessName', businessName);
  formData.append('description', description);
  formData.append('primaryColor', primaryColor);
  formData.append('palette', palette.join(','));
  formData.append('fontTitle', fontTitle);
  formData.append('fontSubtitle', fontSubtitle);
  formData.append('fontParagraph', fontParagraph);
  formData.append('location', location);
  formData.append('businessCategory', businessCategory);
  formData.append('targetAudience', targetAudience);
  formData.append('toneOfVoice', toneOfVoice.join(','));
  formData.append('uniqueValueProposition', uniqueValueProposition);
  formData.append('mainProductsServices', mainProductsServices);
  formData.append('marketingGoals', marketingGoals.join(','));
  formData.append('preferredLanguage', preferredLanguage);
  formData.append('preferredCta', preferredCta);
  formData.append('preferredPhrases', preferredPhrases);
  formData.append('avoidPhrases', avoidPhrases);

  if (mainImage) {
    formData.append('main_image', mainImage);
  }

  logos.forEach((file) => {
    formData.append('logos', file);
  });

  gallery.forEach((img, index) => {
    formData.append('gallery', img.file);
    formData.append(`desc_${index}`, img.description);
  });

  try {
    const response = await fetch('http://localhost:5000/api/brand-settings', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`  
      },
    });

    if (response.ok) {
      alert('ההגדרות נשמרו בהצלחה ✅');
    } else {
      const errorData = await response.json();
      console.error('שגיאת שמירה:', errorData);
      alert('אירעה שגיאה בשמירת ההגדרות ');
    }
  } catch (error) {
    console.error('שגיאה כללית בשמירה:', error);
    alert('שגיאה כללית בשמירת ההגדרות');
  }
};
return (
  <div className="settings-container" dir="rtl">
    <h2 className="settings-title">🎨 הגדרות מותג</h2>

    <form onSubmit={handleSubmit} className="settings-form">
      {/* פרטי עסק */}
      <div className="form-section">
        <h3 className="section-title">📝 פרטי העסק</h3>
        <label>שם העסק:
          <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} />
        </label>
        <label>תיאור העסק:
          <textarea value={description} onChange={e => setDescription(e.target.value)} />
        </label>
        <label>מיקום (אופציונלי):
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} />
        </label>
      </div>



      {/* הקשר שיווקי לעסק */}
      <div className="form-section">
        <h3 className="section-title">🎯 הקשר שיווקי לעסק</h3>

        <label>
           תחום העסק:
          <select
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
          >
            <option value="">בחרי תחום</option>
            <option value="מסעדה">מסעדה</option>
            <option value="אופנה">אופנה</option>
            <option value="קליניקה">קליניקה</option>
            <option value="קוסמטיקה">קוסמטיקה</option>
            <option value="נדל״ן">נדל״ן</option>
            <option value="חינוך">חינוך</option>
            <option value="אירוח ותיירות">אירוח ותיירות</option>
            <option value="שירותים מקצועיים">שירותים מקצועיים</option>
            <option value="אחר">אחר</option>
        </select>
      </label>

      <label>
       קהל יעד עיקרי:
        <textarea
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="לדוגמה: נשים בגילאי 25–45 מאזור הצפון שמתעניינות בטיפוח"
        />
      </label>

      <label>סגנון תקשורת:</label>
      <div>
      {['מקצועי', 'חם', 'צעיר', 'יוקרתי', 'קליל','טיפולי','שירותי','רשמי','טעים','קאזואל','שיווקי','שיווקי מוסתר'].map((tone) => (
        <label key={tone} style={{ marginLeft: '12px' }}>
          <input
            type="checkbox"
            checked={toneOfVoice.includes(tone)}
            onChange={(e) => {
              if (e.target.checked) {
                setToneOfVoice(prev => [...prev, tone]);
              } else {
                setToneOfVoice(prev => prev.filter(item => item !== tone));
              }
            }}
          />
          {tone}
        </label>
      ))}
    </div>

    <label>
     היתרון המרכזי של העסק / USP:
      <textarea
        value={uniqueValueProposition}
        onChange={(e) => setUniqueValueProposition(e.target.value)}
      />
    </label>

    <label>
     מוצרים או שירותים עיקריים:
      <textarea
        value={mainProductsServices}
        onChange={(e) => setMainProductsServices(e.target.value)}
      />
    </label>

    <label>מטרות שיווקיות נפוצות:</label>
    <div>
      {[
        'מכירות',
        'החזרת לקוחות',
        'השקת מוצר',
        'מודעות למותג',
        'מבצע',
        'יצירת לידים'
      ].map((goal) => (
        <label key={goal} style={{ marginLeft: '12px' }}>
          <input
            type="checkbox"
            checked={marketingGoals.includes(goal)}
            onChange={(e) => {
              if (e.target.checked) {
                setMarketingGoals(prev => [...prev, goal]);
              } else {
                setMarketingGoals(prev => prev.filter(item => item !== goal));
              }
            }}
          />
          {goal}
        </label>
      ))}
    </div>

    <label>
     שפה מועדפת:
      <select
        value={preferredLanguage}
        onChange={(e) => setPreferredLanguage(e.target.value)}
      >
        <option value="">בחרי שפה</option>
        <option value="עברית">עברית</option>
        <option value="ערבית">ערבית</option>
        <option value="אנגלית">אנגלית</option>
        <option value="עברית וערבית">עברית וערבית</option>
        <option value="רב-לשוני">רב-לשוני</option>
      </select>
    </label>

    <label>
      CTA מועדף:
      <input
        type="text"
        value={preferredCta}
        onChange={(e) => setPreferredCta(e.target.value)}
        placeholder="לדוגמה: הזמינו עכשיו / שלחו לנו הודעה"
      />
    </label>

    <label>
     מילים או ביטויים שהעסק מעדיף:
      <textarea
        value={preferredPhrases}
        onChange={(e) => setPreferredPhrases(e.target.value)}
      />
    </label>

    <label>
     מילים או ביטויים שלא להשתמש בהם:
      <textarea
        value={avoidPhrases}
        onChange={(e) => setAvoidPhrases(e.target.value)}
      />
    </label>
  </div>
      {/* תמונה ראשית */}
      <div className="form-section">
        <h3 className="section-title">📸 תמונה ראשית</h3>
        <label className="upload-button">
          📤 העלאת תמונה ראשית
          <input type="file" accept="image/*" onChange={e => setMainImage(e.target.files?.[0] || null)} hidden />
        </label>
        <div className="gallery-preview">
          {!mainImage && mainImageUrl && (
            <div className="preview-item removable">
              <img src={mainImageUrl} alt="main-preview" />
              <button onClick={handleDeleteMainImage} className="remove-btn">×</button>
            </div>
          )}
          {mainImage && (
            <div className="preview-item removable">
              <img src={URL.createObjectURL(mainImage)} alt="main-uploaded" />
              <button onClick={() => setMainImage(null)} className="remove-btn">×</button>
            </div>
          )}
        </div>
      </div>

      {/* לוגואים */}
      <div className="form-section">
        <h3 className="section-title">🔖 לוגואים</h3>
        <label className="upload-button">
          ➕ העלאת לוגואים
          <input type="file" accept="image/*" multiple onChange={e => {
            if (e.target.files?.length) handleAddLogos(e.target.files);
          }} hidden />
        </label>
        <div className="gallery-preview">
          {existingLogos.map((logo, i) => (
            <div key={i} className="gallery-item removable">
              <img src={logo} alt={`existing-logo-${i}`} />
              <button onClick={() => handleDeleteExistingLogo(i)} className="remove-btn">×</button>
            </div>
          ))}
          {logos.map((logo, i) => (
            <div key={i} className="gallery-item removable">
              <img src={URL.createObjectURL(logo)} alt={`logo-${i}`} />
              <button onClick={() => removeLogo(i)} className="remove-btn">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* גלריית תמונות */}
      <div className="form-section">
        <h3 className="section-title">🖼 גלריית תמונות</h3>
        <label className="upload-button">
          🖼️ הוספת תמונות לגלריה
          <input type="file" accept="image/*" multiple onChange={e => {
            if (e.target.files?.length) handleAddGalleryImages(e.target.files);
          }} hidden />
        </label>
        <div className="gallery-preview">
          {existingGallery.map((item, i) => (
            <div key={i} className="gallery-item removable">
              <img src={item.path} alt={`existing-gallery-${i}`} />
              <button onClick={() => handleDeleteExistingGalleryImage(i)} className="remove-btn">×</button>
              <p>{item.description}</p>
            </div>
          ))}
          {gallery.map((img, i) => (
            <div key={i} className="gallery-item removable">
              <img src={URL.createObjectURL(img.file)} alt={`gallery-${i}`} />
              <button onClick={() => removeGalleryImage(i)} className="remove-btn">×</button>
              <p>{img.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* צבעים */}
      <div className="form-section">
        <h3 className="section-title">🎨 צבעי המותג</h3>
        <label>צבע ראשי:
          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
        </label>

        <label>פלטת צבעים:</label>
        <div className="color-palette">
          {palette.map((color, i) => (
            <div key={i} className="color-circle" style={{ backgroundColor: color }} onClick={() => removeColorFromPalette(i)} />
          ))}
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} />
          <button type="button" onClick={() => {
            if (!palette.includes(newColor)) {
              setPalette(prev => [...prev, newColor]);
            }
          }}>➕ הוסף</button>
        </div>
      </div>

      {/* פונטים */}
      <div className="form-section">
        <h3 className="section-title">🔤 פונטים</h3>

        <label>
          גופן כותרת:
          <select
            value={fontTitle}
            onChange={(e) => setFontTitle(e.target.value)}
            style={{ fontFamily: fontTitle }}
          >
            {availableFonts.map((font) => (
              <option key={font.name} value={font.name}>
                {font.label}
              </option>
            ))}
          </select>
        </label>

        <p
          style={{
            fontFamily: fontTitle,
            fontSize: '28px',
            marginTop: '10px',
            marginBottom: '20px'
          }}
        >
          דוגמה לכותרת של TRIPLE
        </p>

        <label>
          גופן תת־כותרת:
          <select
            value={fontSubtitle}
            onChange={(e) => setFontSubtitle(e.target.value)}
            style={{ fontFamily: fontSubtitle }}
          >
            {availableFonts.map((font) => (
              <option key={font.name} value={font.name}>
                {font.label}
              </option>
            ))}
          </select>
        </label>

        <p
          style={{
            fontFamily: fontSubtitle,
            fontSize: '22px',
            marginTop: '10px',
            marginBottom: '20px'
          }}
        >
          דוגמה לתת־כותרת של TRIPLE
        </p>

        <label>
          גופן פסקאות:
          <select
            value={fontParagraph}
            onChange={(e) => setFontParagraph(e.target.value)}
            style={{ fontFamily: fontParagraph }}
          >
            {availableFonts.map((font) => (
              <option key={font.name} value={font.name}>
                {font.label}
              </option>
            ))}
          </select>
        </label>

        <p
          style={{
            fontFamily: fontParagraph,
            fontSize: '18px',
            marginTop: '10px'
          }}
        >
          זו דוגמה לטקסט פסקה במערכת TRIPLE
        </p>
      </div>

      {/* כפתור שמירה */}
      <div className="form-section">
        <button type="submit" className="save-button">
          💾 שמור הגדרות
        </button>
      </div>
    </form>
  </div>
  );
};

export default Settings;