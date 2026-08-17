import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../../App';

// כדי לשלוט בטיימר של חלון השליחה (5 שניות)
jest.useFakeTimers();

// לא לשבור בגלל alert בבדיקה
beforeAll(() => {
  // @ts-ignore
  window.alert = window.alert || jest.fn();
});

test('בחירת עיצוב מובילה ל-/delivery ומציגה תצוגה מקדימה, שליחה וביטול', async () => {
  render(
    <MemoryRouter initialEntries={['/design']}>
      <App />
    </MemoryRouter>
  );

  // מוודאים שעמוד העיצובים עלה
  expect(screen.getByText(/בחרו עיצוב לקמפיין/i)).toBeInTheDocument();

  // לוחצים על כפתור "בחר" הראשון (מה־fallback המקומי של DesignSelector)
  const selectButtons = await screen.findAllByRole('button', { name: /בחר/i });
  fireEvent.click(selectButtons[0]);

  // אמורים להגיע למסך /delivery
  await waitFor(() =>
    expect(screen.getByText(/בחר פלטפורמת שליחה/i)).toBeInTheDocument()
  );

  // יש תמונת תצוגה מקדימה
  expect(screen.getByAltText(/עיצוב שנבחר/i)).toBeInTheDocument();

  // בוחרים פלטפורמה (Email)
  fireEvent.click(screen.getByRole('button', { name: /Email/i }));

  // מקלידים טקסט מלווה
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'טקסט בדיקה לשליחה' },
  });

  // לוחצים "שליחה"
  fireEvent.click(screen.getByRole('button', { name: /שליחה/i }));

  // אמור להופיע פופאפ עם אפשרות ביטול
  await waitFor(() =>
    expect(screen.getByText(/יש לך 5 שניות לבטל/i)).toBeInTheDocument()
  );

  // לוחצים "בטל" כדי לבטל בזמן
  fireEvent.click(screen.getByRole('button', { name: /בטל/i }));

  // הפופאפ נעלם
  await waitFor(() =>
    expect(
      screen.queryByText(/יש לך 5 שניות לבטל/i)
    ).not.toBeInTheDocument()
  );

  // מדלגים את הטיימר כדי שלא יישארו טיימרים פתוחים
  jest.runOnlyPendingTimers();
});
