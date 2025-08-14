import React, { useState, useEffect } from 'react';
import './DeliveryOptions.css';
import { useNavigate } from 'react-router-dom';

const DeliveryOptions: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendTimer, setSendTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [messageText, setMessageText] = useState<string>(''); // טקסט מלווה

  useEffect(() => {
    const imageFromStorage = localStorage.getItem('selectedDesignImage');
    if (imageFromStorage) {
      setSelectedImage(imageFromStorage);
    }
  }, []);

  const handleSend = () => {
    if (!selectedOption) {
      alert('בחרי פלטפורמה לשליחה');
      return;
    }

    setIsSending(true);

    const timer = setTimeout(() => {
      setIsSending(false);
      // שליחה בפועל – כרגע רק סימולציה
      alert(`✅ הקמפיין נשלח בהצלחה דרך ${selectedOption}\n\n✉️ טקסט מצורף:\n${messageText}`);
    }, 5000);

    setSendTimer(timer);
  };

  const handleUndo = () => {
    if (sendTimer) {
      clearTimeout(sendTimer);
    }
    setIsSending(false);
  };

  return (
    <div className="delivery-options-container" dir="rtl">
      <h2 className="title">בחר פלטפורמת שליחה</h2>

      <div className="preview-message-layout">
        {selectedImage && (
          <div className="preview-wrapper">
            <h3>תצוגה מקדימה של העיצוב הנבחר</h3>
            <img src={selectedImage} alt="עיצוב שנבחר" className="preview-image" />
          </div>
        )}

        <div className="message-wrapper">
          <h3>טקסט מלווה </h3>
          <textarea
            placeholder="כתבי כאן הודעה שתשלח יחד עם העיצוב..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={8}
          />
        </div>
      </div>

      <div className="options-grid">
        <button
          className={`platform-button email ${selectedOption === 'Email' ? 'selected' : ''}`}
          onClick={() => setSelectedOption('Email')}
        >
          📧 Email
        </button>
        <button
          className={`platform-button whatsapp ${selectedOption === 'WhatsApp' ? 'selected' : ''}`}
          onClick={() => setSelectedOption('WhatsApp')}
        >
          💬 WhatsApp
        </button>
        <button
          className={`platform-button sms ${selectedOption === 'SMS' ? 'selected' : ''}`}
          onClick={() => setSelectedOption('SMS')}
        >
          📱 SMS
        </button>
      </div>

      <button className="send-button" onClick={handleSend}>
        🚀 שליחה
      </button>

      {isSending && (
        <div className="sending-popup">
          <div className="sending-content">
            <p>🚀 הקמפיין בדרך דרך {selectedOption}...<br />יש לך 5 שניות לבטל ⏱️</p>
            <button className="undo-button" onClick={handleUndo}>בטל</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOptions;
