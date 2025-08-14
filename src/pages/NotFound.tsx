import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container text-center mt-5">
      <h1 className="display-4">404</h1>
      <p className="lead">הדף שביקשת לא נמצא.</p>
      <button
        className="btn btn-primary mt-3"
        onClick={() => navigate('/')}
      >
        חזרה לדשבורד
      </button>
    </div>
  );
};

export default NotFound;
