import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import apiClient from '../config/api';

const DebugInfo: React.FC = () => {
  const { user, isGuest, isAdmin } = useUser();
  const [healthStatus, setHealthStatus] = useState<string>('checking...');
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setApiUrl(process.env.REACT_APP_API_URL || 'Not set');
        const response = await apiClient.get('/health');
        setHealthStatus(`OK - ${response.data.status}`);
      } catch (error: any) {
        setHealthStatus(`Error: ${error.message}`);
      }
    };

    checkHealth();
  }, []);
  
  // Show in development or when explicitly enabled
  const showDebug = process.env.NODE_ENV === 'development' || 
                   localStorage.getItem('showDebugInfo') === 'true';
  
  if (!showDebug) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      border: '2px solid #007bff'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#007bff' }}>Debug Info</div>
      <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
      <div><strong>API URL:</strong> {apiUrl}</div>
      <div><strong>Health:</strong> {healthStatus}</div>
      <div><strong>User:</strong> {user ? user.email : 'None'}</div>
      <div><strong>Is Guest:</strong> {isGuest ? 'Yes' : 'No'}</div>
      <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
      <div><strong>Token:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</div>
      <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
        To show in prod: localStorage.setItem('showDebugInfo', 'true')
      </div>
    </div>
  );
};

export default DebugInfo;
