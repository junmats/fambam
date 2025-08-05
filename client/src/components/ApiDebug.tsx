import React from 'react';

const ApiDebug: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const nodeEnv = process.env.NODE_ENV;
  
  // Only show in development or if explicitly enabled
  const showDebug = nodeEnv === 'development' || localStorage.getItem('showApiDebug') === 'true';
  
  if (!showDebug) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div><strong>Environment:</strong> {nodeEnv}</div>
      <div><strong>API URL:</strong> {apiUrl || 'Not set'}</div>
      <div><strong>Window Location:</strong> {window.location.origin}</div>
    </div>
  );
};

export default ApiDebug;
