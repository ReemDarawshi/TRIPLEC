import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from './App';

test('App נטען בתוך Router ומציג את מסך ההתחברות', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
  // בדיקה פשוטה שתופסת את כותרת ההתחברות
  expect(screen.getByText(/התחברות/i)).toBeInTheDocument();
});
