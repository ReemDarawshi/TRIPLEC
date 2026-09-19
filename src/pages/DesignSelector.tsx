/**
 * DesignSelector.tsx
 * ---------------------------------------------------------
 * רכיב React שלב 3 בתהליך יצירת קמפיין:
 * מאפשר למשתמש לבחור טקסט שיווקי מתוך הצעות AI
 * ולצידו לבחור פוסטר עיצובי (תמונה) מהשרת – לקראת השלב הבא.
 *
 * פונקציונליות עיקרית:
 * 1. שליפת prompt שנשמר מ־localStorage.
 * 2. שליחת הבקשה ל־backend לקבלת טקסטים מומלצים מה-AI (API: /api/ai/texts).
 * 3. שליחת בקשה ליצירת פוסטרים (API: /api/generate_posters) לפי אותו prompt.
 * 4. הצגת הטקסטים כ־textarea הניתנים לעריכה ובחירה.
 * 5. הצגת פוסטרים לבחירה כגלריה (עם סימון שנבחר).
 * 6. כפתור "המשך" מבצע שליחה לשרת עם הטקסט והפוסטר שנבחרו
 *    ושומר אותם בקמפיין (API: /api/campaigns/:id/design).
 * 7. בסיום, ניווט לשלב הבא: `/delivery/:id`.
 *
 * טיפוסים בשימוש:
 * - UiDesign: מייצג פוסטר עם מזהה, נתיב תמונה, כותרת ותיאור (אופציונליים).
 *
 * קבצים נלווים:
 * - DesignSelector.css – לעיצוב הגלריה ועריכת הטקסטים.
 *
 * תלות: שימוש ב־localStorage לאחסון prompt ו־token לאימות.
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./DesignSelector.css";
import Modal from "react-modal";

type UiDesign = {
  id: string;
  imageSrc: string;
  title?: string;
  description?: string;
};

const DesignSelector: React.FC = () => {
  const [aiTexts, setAiTexts] = useState<string[]>([]);
  const [editedTexts, setEditedTexts] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [designs, setDesigns] = useState<UiDesign[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [generatingPosters, setGeneratingPosters] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const CAMPAIGN_ID = id;



Modal.setAppElement("#root");
const [modalImage, setModalImage] = useState<string | null>(null);

const openModal = (img: string) => setModalImage(img);
const closeModal = () => setModalImage(null);

// שלב 0+1: שליפת ה-prompt ושלושת הטקסטים שכבר נשמרו ב-DB
useEffect(() => {
  const fetchCampaignData = async () => {
    if (!CAMPAIGN_ID) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/campaigns/${CAMPAIGN_ID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("שגיאה בשליפת הקמפיין:", errText);
        alert("לא ניתן לטעון את נתוני הקמפיין.");
        return;
      }

      const data = await res.json();

      if (Array.isArray(data.ai_text_options)) {
        setAiTexts(data.ai_text_options);
        setEditedTexts(data.ai_text_options);
      } else {
        setAiTexts([]);
        setEditedTexts([]);
      }

      if (data.ai_prompt) {
        setSelectedPrompt(data.ai_prompt);
      } else {
        setSelectedPrompt("");
      }

      // Restore the last completed generation; never call the AI on page load.
      const savedBatch = data.poster_options;
      const savedPosters = savedBatch && Array.isArray(savedBatch.posters)
        ? savedBatch.posters.filter((poster: UiDesign) =>
            typeof poster.id === "string" && typeof poster.imageSrc === "string")
        : [];
      setDesigns(savedPosters);
      setSelectedDesignId(
        savedPosters.some((poster: UiDesign) => poster.id === data.design_id)
          ? data.design_id
          : null
      );
      const savedText = typeof savedBatch?.selected_text === "string"
        ? savedBatch.selected_text : data.message_text;
      if (savedText && Array.isArray(data.ai_text_options)) {
        const matchIndex = data.ai_text_options.findIndex((text: string) =>
          text.trim() === savedText.trim());
        if (matchIndex >= 0) setSelectedIndex(matchIndex);
      }

    } catch (e) {
      console.error("שגיאה בשליפת נתוני הקמפיין:", e);
    }
  };

  fetchCampaignData();
}, [CAMPAIGN_ID]);

  // Generate only on an explicit click, using the approved, edited text.
  const fetchPosters = async () => {
    if (generatingPosters || !CAMPAIGN_ID) return;
    if (selectedIndex === null || !editedTexts[selectedIndex]?.trim()) {
      alert("יש לבחור טקסט לפני יצירת העיצובים");
      return;
    }

    setGeneratingPosters(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/generate_posters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaign_id: CAMPAIGN_ID,
          selected_text: editedTexts[selectedIndex].trim(),
        }),
      });

      if (!res.ok) {
        console.error("שגיאה ביצירת פוסטרים:", await res.text());
        alert("לא ניתן ליצור עיצובים. בדקי את הודעת השגיאה.");
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data.posters)) {
        alert("השרת לא החזיר רשימת עיצובים תקינה");
        return;
      }
      setDesigns(data.posters);
      setSelectedDesignId(null);
    } catch (e) {
      console.error("שגיאה ביצירת פוסטרים:", e);
      alert("שגיאה ביצירת העיצובים");
    } finally {
      setGeneratingPosters(false);
    }
  };

  // שלב 3: שמירת הבחירה
  const handleSelect = async () => {
    if (selectedIndex === null || !editedTexts[selectedIndex]?.trim()) {
      alert("יש לבחור טקסט אחד ולמלא תוכן לפני המשך");
      return;
    }

    const selectedText = editedTexts[selectedIndex];
    const selectedPoster = designs.find((d) => d.id === selectedDesignId);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/campaigns/${CAMPAIGN_ID}/design`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selected_design_id: selectedDesignId,
          image_path: selectedPoster?.imageSrc || null,
          message_text: selectedText,
        }),
      });

      if (!res.ok) {
        console.error("שמירת העיצוב נכשלה:", await res.text());
        alert("השמירה נכשלה. לא עוברים לשלב הבא.");
        return;
      }
      navigate(`/delivery/${CAMPAIGN_ID}`);
    } catch (err) {
      console.error("שגיאה בשמירת הבחירה לשרת", err);
      alert("⚠️ שגיאה בשמירת הבחירה לשרת – בדקי את הקונסול.");
    }
  };
return (
  <div className="design-selector-page" dir="rtl">
    <h2 className="section-title">בחרו טקסט לקמפיין</h2>
    <p className="section-subtitle">ערכו ובחרו טקסט אחד להמשך:</p>

    {editedTexts.length > 0 ? (
      <div className="text-card-list">
        {editedTexts.map((text, idx) => (
          <div
            key={idx}
            className={`text-card ${selectedIndex === idx ? "selected" : ""}`}
            onClick={() => { setSelectedIndex(idx); setSelectedDesignId(null); setDesigns([]); }}
          >
            <div className="text-card-header">
              <input
                type="radio"
                name="selectedText"
                checked={selectedIndex === idx}
                onChange={() => { setSelectedIndex(idx); setSelectedDesignId(null); setDesigns([]); }}
              />
            </div>
            <textarea
              className="editable-textarea"
              value={text}
              onChange={(e) => {
                const next = [...editedTexts];
                next[idx] = e.target.value;
                setEditedTexts(next);
                setSelectedDesignId(null);
                setDesigns([]);
              }}
              rows={3}
            />
          </div>
        ))}
      </div>
    ) : (
      <p className="empty-message">אין טקסטים להצגה – ודאי שה-AI חזר עם תוצאות תקינות.</p>
    )}

    <div className="bottom-actions">
      <button
        type="button"
        className="next-button"
        disabled={generatingPosters || selectedIndex === null || !editedTexts[selectedIndex]?.trim()}
        onClick={fetchPosters}
      >
        {generatingPosters ? "יוצר עיצובים..." : designs.length ? "צור 5 עיצובים חדשים" : "צור 5 עיצובים"}
      </button>
    </div>

    {designs.length > 0 && (
      <>
        <h3 className="section-title" style={{ marginTop: "2rem" }}>
          בחרו עיצוב לקמפיין:
        </h3>
        <div className="design-gallery">
          {designs.map((design) => (
            <div
              key={design.id}
              className={`design-item ${selectedDesignId === design.id ? "selected" : ""}`}
              onClick={() => setSelectedDesignId(design.id)}
            >
              <img
                src={`http://localhost:5000${design.imageSrc}`}
                alt={design.title || ""}
                className="poster-image"
              />
              <p className="poster-title">{design.title}</p>
              <button
                className="view-button"
                onClick={(e) => {
                  e.stopPropagation(); // שלא יפעיל גם את הבחירה
                  setModalImage(design.imageSrc.startsWith('http') ? design.imageSrc : `http://localhost:5000${design.imageSrc}`);
                }}
              >
                 צפייה
              </button>
            </div>
          ))}
        </div>
      </>
    )}

    <div className="bottom-actions">
      <button className="next-button" onClick={handleSelect}>
        המשך
      </button>
    </div>

    {/* MODAL לצפייה מלאה בפוסטר */}
    <Modal
      isOpen={!!modalImage}
      onRequestClose={() => setModalImage(null)}
      contentLabel="תצוגת פוסטר"
      className="modal"
      overlayClassName="overlay"
    >
      <button className="close-btn" onClick={() => setModalImage(null)}>✖</button>
      {modalImage && <img src={modalImage} alt="תצוגה מלאה" className="modal-img" />}
    </Modal>
  </div>
);}

export default DesignSelector;
