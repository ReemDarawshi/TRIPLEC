import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DesignSelector.css";

type UiDesign = {
  id: number;
  imageSrc: string;
  title?: string;
  description?: string;
};

const DesignSelector: React.FC = () => {
  const [designs, setDesigns] = useState<UiDesign[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // טוען עיצובים מדומים מהמערכת
    const demoDesigns: UiDesign[] = [
      {
        id: 1,
        imageSrc: "/images/design1.jpg",
        title: "תודה שבחרתם בנו!",
        description: "מתנה בהזמנה הבאה",
      },
      {
        id: 2,
        imageSrc: "/images/design2.jpg",
        title: "עדכון שעות פעילות",
        description: "החל מהשבוע הבא: ימים א-ה בלבד",
      },
      {
        id: 3,
        imageSrc: "/images/design3.jpg",
        title: "ברוכים הבאים לשנה החדשה",
        description: "הפתעות ומבצעים במיוחד עבורך",
      },
      {
        id: 4,
        imageSrc: "/images/design4.jpg",
        title: "מבצע קיץ מטורף",
        description: "הנחות של עד 50% רק השבוע!",
      },
      {
        id: 5,
        imageSrc: "/images/design5.jpg",
        title: "קמפיין מיוחד לספקים",
        description: "שינויים במועדי אספקה – עדכון חשוב",
      },
    ];

    setDesigns(demoDesigns);
  }, []);

  const handleSelect = (design: UiDesign) => {
    // שומר את כתובת התמונה כדי להציג אותה ב־DeliveryOptions
    localStorage.setItem("selectedDesignImage", design.imageSrc);
    // ניווט לנתיב שמוגדר ב-App.tsx
    navigate("/delivery");
  };

  return (
    <div className="design-selector-page" dir="rtl">
      <h2>בחרו עיצוב לקמפיין</h2>
      <div className="design-grid">
        {designs.map((design) => (
          <div key={design.id} className="design-card">
            <img src={design.imageSrc} alt={design.title || "עיצוב"} />
            {design.title && <h3>{design.title}</h3>}
            {design.description && <p>{design.description}</p>}
            <button onClick={() => handleSelect(design)}>בחר</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesignSelector;
