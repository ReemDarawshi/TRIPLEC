import React, { useState } from "react";
import "./AIPrompt.css";
import { useNavigate } from "react-router-dom";

type AudienceKey = "client" | "supplier" | "agent";

const AIPrompt: React.FC = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState<AudienceKey[]>([]);
  const [busy, setBusy] = useState(false);

  // ID קבוע זמני
  const CAMPAIGN_ID = 4;

  // הוספה/הסרה של קטגוריה
  const handleToggleAudience = (type: AudienceKey) => {
    setAudience((prev) =>
      prev.includes(type) ? prev.filter((a) => a !== type) : [...prev, type]
    );
  };

  const handleTemplateInsert = (text: string) => {
    setPrompt(text);
  };

  // ⛔ גרסה זמנית ללא API
  const handleContinue = async () => {
    if (!prompt.trim() || audience.length === 0) {
      alert("נא למלא טקסט ולבחור קהל יעד");
      return;
    }

    try {
      setBusy(true);
      // סימולציה של שמירה וטעינה
      await new Promise((res) => setTimeout(res, 1000));
      localStorage.setItem("last_message_id", "1234");
      console.log("נבחר קהל:", audience);

      navigate("/design");
    } catch (err: any) {
      alert("שגיאה זמנית");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ai-container" dir="rtl">
      <h2>שלב הבינה – יצירת תוכן לקמפיין</h2>

      <div className="btn-group">
        <button
          className={audience.includes("client") ? "active" : ""}
          onClick={() => handleToggleAudience("client")}
        >
          לקוחות
        </button>
        <button
          className={audience.includes("supplier") ? "active" : ""}
          onClick={() => handleToggleAudience("supplier")}
        >
          ספקים
        </button>
        <button
          className={audience.includes("agent") ? "active" : ""}
          onClick={() => handleToggleAudience("agent")}
        >
          סוכנים
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="כתוב כאן מה ברצונך להעביר..."
      />

      <div className="templates">
        <p>או בחר טמפלט מוכן:</p>
        <button onClick={() => handleTemplateInsert("הודעה ללקוחות על מבצע 1+1 לחג")}>
          מבצע לקוחות
        </button>
        <button onClick={() => handleTemplateInsert("עדכון לספקים על שינוי בשעות הקבלה")}>
          הודעה לספקים
        </button>
        <button onClick={() => handleTemplateInsert("תזכורת לסוכן להזין דו״ח שבועי")}>
          תזכורת לסוכן
        </button>
      </div>

      <button className="btn-continue" onClick={handleContinue} disabled={busy}>
        {busy ? "שומר..." : "המשך לבחירת עיצוב"}
      </button>
    </div>
  );
};

export default AIPrompt;
