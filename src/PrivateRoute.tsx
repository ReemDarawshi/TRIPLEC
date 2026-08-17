// PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

type Props = { children: React.ReactNode };

const PrivateRoute = ({ children }: Props) => {

  const token = localStorage.getItem('token');
  const businessId = localStorage.getItem('business_id');

  if (!token || !businessId) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
