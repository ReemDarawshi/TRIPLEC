/**
 *  AIPrompt.tsx – שלב הבינה המלאכותית ביצירת קמפיין
 *
 * קומפוננטה זו מהווה את השלב הראשון ביצירת תוכן לקמפיין באמצעות בינה מלאכותית.
 *
 * פונקציונליות עיקרית:
 * 1.  שליפת טקסט מוצע וטמפלטים מהשרת עבור קמפיין לפי `campaign_id` (מתוך ה-URL).
 * 2.  הצגת הטקסט לעריכה על ידי המשתמש באמצעות textarea.
 * 3.  הצגת טמפלטים שהמשתמש יכול לבחור מהם בלחיצת כפתור.
 * 4.  שמירת הטקסט המעודכן ושליחתו לשרת, והעברה לשלב הבא – בחירת עיצוב (`/design/:id`).
 *
 * שימושים:
 * - מתבסס על בינה מלאכותית בצד השרת (`/api/ai/generate` ו־`/api/ai/texts`)
 * - נשען על טוקן מזהה מה־`localStorage` לצורכי הרשאות.
 * - עושה שימוש ב־axios לשליחת בקשות HTTP.
 *
 *  שלב זה מגיע מיד לאחר יצירת קמפיין ומקדים את שלב העיצוב.
 */

import React, { useEffect, useState } from "react";
import "./AIPrompt.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

  const AIPrompt: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const CAMPAIGN_ID = id;
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // שלב 1: שליפת טקסט ראשון וטמפלטים מהשרת (בינה אוטומטית)
useEffect(() => {
  const fetchPromptSuggestions = async () => {
    try {
      setBusy(true);

      const token = localStorage.getItem("token");

      if (!token) {
        console.error("לא נמצא טוקן");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/ai/prompt-suggestions",
        {
          campaign_id: CAMPAIGN_ID
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Prompt suggestions response:", response.data);

      if (response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      }

    } catch (err: any) {
      console.error(
        "שגיאה ביצירת הצעות Prompt:",
        err?.response?.data || err
      );
    } finally {
      setBusy(false);
    }
  };

  if (CAMPAIGN_ID) {
    fetchPromptSuggestions();
  }
}, [CAMPAIGN_ID]);

  // שלב 2: שליחת prompt מעודכן לשרת – כדי שישמר וישתמש בו ליצירת טקסטים (בהמשך)
  const handleContinue = async () => {
  if (!prompt.trim()) {
    alert("יש לכתוב רעיון לקמפיין או לבחור אחת מההצעות.");
    return;
  }

  try {
    setBusy(true);

    const token = localStorage.getItem("token");

    if (!token) {
      alert("לא נמצא טוקן");
      return;
    }

    const res = await axios.post(
      "http://localhost:5000/api/ai/texts",
      {
        campaign_id: CAMPAIGN_ID,
        prompt: prompt.trim()
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status === 200) {
      navigate(`/design/${CAMPAIGN_ID}`);
    } else {
      alert("לא הצלחנו להמשיך לשלב הבא");
    }

  } catch (err: any) {
    console.error(
      "שגיאה ביצירת טקסטים:",
      err?.response?.data || err
    );

    alert(
      err?.response?.data?.error ||
      "שגיאה בעת יצירת הטקסטים לקמפיין"
    );

  } finally {
    setBusy(false);
  }
};
  return (
    <div className="ai-container" dir="rtl">
      <h2>מה תרצי לקדם בקמפיין הזה?</h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="למשל: אני רוצה לקדם את הרעיון המרכזי של הקמפיין ולעודד את הלקוחות לבצע פעולה..."
        className="prompt-textarea"
      />

{suggestions.length > 0 && (
  <div className="templates">
    <p>או התחילי מאחת ההצעות של TRIPLE:</p>

    {suggestions.map((suggestion, idx) => (
      <button
        key={idx}
        type="button"
        onClick={() => setPrompt(suggestion)}
      >
        {suggestion}
      </button>
    ))}
  </div>
)}

      <div className="action-buttons">
        <button
          className="btn-continue"
          onClick={handleContinue}
          disabled={busy}
        >
          {busy ? "שולח..." : "המשך לבחירת עיצוב"}
        </button>
      </div>
    </div>
  );
};

export default AIPrompt;
