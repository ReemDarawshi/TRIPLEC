// src/pages/__tests__/routes.test.tsx
import React, { ReactElement } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; 

// ⚠️ את בקובץ תחת src/pages/__tests__, לכן המסלולים כך:
import Dashboard from '../../components/Dashboard';
import DesignSelector from '../DesignSelector';
import DeliveryOptions from '../DeliveryOptions';
import CampaignList from '../CampaignList';
import NotFound from '../NotFound';

function renderRoute(path: string, element: ReactElement) { 
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>
  );
}

describe('בדיקת טעינת דפים', () => {
  it('Dashboard נטען', () => {
       renderRoute('/dashboard', <Dashboard />);
   // בודק טקסט שקיים בפועל בדשבורד:
   expect(screen.getByText(/כאן תמצאי סיכום/i)).toBeInTheDocument();
   // אפשרי גם: expect(screen.getByText(/פילוח לפי ערוצים/i)).toBeInTheDocument();
 });

  it('SendCampaign נטען', () => {
    expect(screen.getByText(/יצירת קמפיין/i)).toBeInTheDocument();
  });

  it('DesignSelector נטען', () => {
    renderRoute('/design', <DesignSelector />);
    expect(screen.getByText(/בחרו עיצוב/i)).toBeInTheDocument();
  });

  it('DeliveryOptions נטען', () => {
    renderRoute('/delivery', <DeliveryOptions />);
    expect(screen.getByText(/בחר פלטפורמת שליחה/i)).toBeInTheDocument();
  });

  it('CampaignList נטען', () => {
    renderRoute('/campaigns', <CampaignList />);
    expect(screen.getByText(/רשימת קמפיינים/i)).toBeInTheDocument();
  });

  it('404 דף לא קיים', () => {
    renderRoute('/abcxyz', <NotFound />);
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });
});
