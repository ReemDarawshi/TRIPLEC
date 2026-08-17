/**
 * DeliveryOptions.tsx
 * -------------------------------------------------
 * רכיב React שאחראי לשלב הסופי בתהליך יצירת קמפיין:
 * בחירת ערוץ שליחה (SMS, WhatsApp, Email), תזמון או שליחה מיידית.
 *
 * פונקציונליות עיקרית:
 * 1. שליפת תוכן הקמפיין (תמונה וטקסט) מהשרת לפי מזהה הקמפיין (`campaignId`).
 * 2. הצגת טופס לבחירת תאריך ושעת שליחה (לתזמון).
 * 3. הצגת תצוגה מקדימה של הפוסטר וההודעה שתישלח.
 * 4. בחירת ערוץ שליחה ולחיצה על:
 *    - כפתור שליחה מיידית ("שלח עכשיו") – מבצע שליחה בפועל לפי ערוץ.
 *    - כפתור תזמון ("תזמן שליחה") – שומר את הנתונים למשלוח מאוחר.
 * 5. תמיכה בפלטפורמות: 
 *    - WhatsApp (באמצעות פתיחת קישורי wa.me)
 *    - SMS (שליחה לכל מספר בנפרד)
 *    - Email (שליחה מיידית דרך API)
 * 6. אפשרות לביטול השליחה במהלך החלון המוקצה.
 *
 * הערות נוספות:
 * - מתבצע שימוש ב־useParams כדי לשלוף את campaignId מה־URL.
 * - נשלחות בקשות ל־backend לצורך שמירת הנתונים ושליחה בפועל.
 * - טוקן נלקח מ־localStorage לצורך אימות.
 *
 * קבצים נלווים: DeliveryOptions.css לעיצוב רכיב זה.
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DeliveryOptions.css";
const DeliveryOptions: React.FC = () => {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendTimer, setSendTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [messageText, setMessageText] = useState<string>("");
  const [sendDate, setSendDate] = useState<string>(""); //  תאריך: YYYY-MM-DD
  const [sendTime, setSendTime] = useState<string>(""); //  שעה: HH:MM

  // ────────────────────────────────────────────────────────────────────────────
  // שליפת הקמפיין: טקסט + תמונה
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`http://localhost:5000/api/campaigns/${campaignId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data?.message_text) setMessageText(data.message_text);
        if (data?.image_path) setSelectedImage(data.image_path);
      } catch (err) {
        console.error("שגיאה בשליפת הקמפיין:", err);
      }
    };

    if (campaignId) fetchCampaign();
  }, [campaignId]);

  // ────────────────────────────────────────────────────────────────────────────
  // שליחה/תזמון קמפיין
  // ────────────────────────────────────────────────────────────────────────────
const handleSend = async (immediate = false) => {
  if (!selectedOption) {
    alert("בחר פלטפורמה לשליחה");
    return;
  }

  if (!messageText.trim()) {
    alert("הכנס טקסט מלווה");
    return;
  }

  const token = localStorage.getItem("token") || "";
  let scheduledAt: string | null = null;

  if (!immediate) {
    if (!sendDate || !sendTime) {
      alert("בחר תאריך ושעה לשליחה");
      return;
    }
    scheduledAt = `${sendDate}T${sendTime}`;
  }

  const payload: any = {
  campaign_id: campaignId,
  message_text: messageText,
  channel: selectedOption.toLowerCase(),
  image_path: selectedImage, 
  ...(scheduledAt && { scheduled_at: scheduledAt }),

};


  try {
    setIsSending(true);

    // ───────────────────────────────
    // 1. שליחה מיידית ב־WhatsApp
    // ───────────────────────────────
    if (selectedOption === "WhatsApp" && immediate) {
      const res = await fetch(`http://localhost:5000/api/campaigns/contacts/for_campaign/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      const contactPhones = await res.json();

      if (!contactPhones.length) {
        alert("לא נמצאו אנשי קשר לשליחת WhatsApp");
      } else {
        contactPhones.forEach((phone: string) => {
          const formattedPhone = phone.startsWith("0") ? "972" + phone.slice(1) : phone.replace("+", "");
          let message = messageText;
          if (selectedImage) {
          const fullUrl = `http://localhost:5000${selectedImage}`;
          message += `\n\n📸 לצפייה בפוסטר: ${fullUrl}`;
        }
        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

          window.open(url, "_blank");
        });

        await fetch(`http://localhost:5000/api/campaigns/send_campaign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
          campaign_id: campaignId,
          image_path: selectedImage, 
        }),

        });

        alert(" WhatsApp נשלח בהצלחה!");
      }

      setIsSending(false);
      return;
    }

    // ───────────────────────────────
    // 2. שמירת פרטי תזמון לכל הערוצים
    // ───────────────────────────────
    const deliveryRes = await fetch(`http://localhost:5000/api/campaigns/${campaignId}/delivery`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!deliveryRes.ok) {
      const errData = await deliveryRes.json().catch(() => ({}));
      throw new Error(errData?.error || "שמירת תזמון נכשלה");
    }

    // ───────────────────────────────
    // 3. שליחה מיידית ב־SMS
    // ───────────────────────────────
    if (selectedOption === "SMS" && immediate) {
      const res = await fetch(`http://localhost:5000/api/campaigns/contacts/for_campaign/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contactPhones = await res.json();

      if (!contactPhones.length) {
        alert("לא נמצאו אנשי קשר לשלוח אליהם SMS");
      } else {
        for (const phone of contactPhones) {
          const formatted = phone.startsWith("0") ? `+972${phone.slice(1)}` : phone;

          const response = await fetch(`http://localhost:5000/api/campaigns/send_sms`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              phone: formatted,
              message: messageText,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.warn(`שגיאה בשליחת SMS ל־${phone}:`, error?.error || "שגיאה לא ידועה");
          }
        }
        alert(" הודעות SMS נשלחו בהצלחה!");
      }

      setIsSending(false);
      return;
    }

    // ───────────────────────────────
    // 4. שליחה מיידית ב־Email
    // ───────────────────────────────
    if (immediate) {
      const sendRes = await fetch(`http://localhost:5000/api/campaigns/send_campaign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
        campaign_id: campaignId,
        image_path: selectedImage, 
        }),

      });

      if (!sendRes.ok) {
        const errData = await sendRes.json().catch(() => ({}));
        throw new Error(errData?.error || "שליחת הקמפיין נכשלה");
      }

      alert(" הקמפיין נשלח בהצלחה!");
    } else {
      alert(` הקמפיין תוזמן בהצלחה ל־${scheduledAt}`);
    }

    setIsSending(false);
  } catch (err: any) {
    console.error(err);
    alert(err.message || "אירעה שגיאה");
    setIsSending(false);
  }
};

  const handleUndo = () => {
    if (sendTimer) clearTimeout(sendTimer);
    setIsSending(false);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────────────────────────────────
return (
  <div className="delivery-options-container fade-in" dir="rtl">
    <h2 className="page-title">📤 שלב 4 מתוך 4: בחירת ערוץ שליחה ותזמון</h2>

    {/* תצוגת העיצוב + טקסט */}
    <div className="preview-message-layout">
      {selectedImage && (
        <div className="preview-wrapper elevated-card">
          <h3 className="section-title">🎨 העיצוב הנבחר</h3>
          <img
            src={`http://localhost:5000${selectedImage}`}
            alt="עיצוב שנבחר"
            className="preview-image shadow-lg"
          />

        </div>
      )}

      <div className="message-wrapper elevated-card">
        <h3 className="section-title">💬 הטקסט שישלח</h3>
        <textarea
          className="message-textarea"
          placeholder="כתבי כאן הודעה שתשלח יחד עם העיצוב..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={8}
        />
      </div>
    </div>

    {/* בחירת תאריך ושעה */}
    <div className="schedule-wrapper elevated-card">
      <h3 className="section-title">📅 תזמון השליחה</h3>
      <div className="schedule-row">
        <input type="date" value={sendDate} onChange={(e) => setSendDate(e.target.value)} />
        <input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
      </div>
    </div>

    {/* פלטפורמות שליחה */}
    <div className="options-grid">
      {["SMS", "WhatsApp", "Email"].map((option) => (
        <button
          key={option}
          className={`platform-button ${option.toLowerCase()} ${
            selectedOption === option ? "selected" : ""
          }`}
          onClick={() => setSelectedOption(option)}
        >
          {option === "SMS" && "📱 SMS"}
          {option === "WhatsApp" && "💬 WhatsApp"}
          {option === "Email" && "📧 Email"}
        </button>
      ))}
    </div>

    {/* כפתורי שליחה */}
    <div className="send-buttons">
      <button className="send-button primary" onClick={() => handleSend(true)}>
        🚀 שלח עכשיו
      </button>
      <button className="send-button schedule" onClick={() => handleSend(false)}>
        🕒 תזמן שליחה
      </button>
    </div>

    {/* תהליך השליחה */}
    {isSending && (
      <div className="sending-popup">
        <div className="sending-content shadow-xl">
          <p>
            הקמפיין נשלח/תוזמן דרך {selectedOption}…<br />
            יש לך כמה שניות לבטל ⏱️
          </p>
          <button className="undo-button" onClick={handleUndo}>
            בטל
          </button>
        </div>
      </div>
    )}
  </div>
);}
export default DeliveryOptions;
