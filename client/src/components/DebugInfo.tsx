import React from 'react';
import { useUser } from '../contexts/UserContext';

const DebugInfo: React.FC = () => {
  const { user, isGuest, isAdmin } = useUser();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>User: {user ? user.email : 'None'}</div>
      <div>Is Guest: {isGuest ? 'Yes' : 'No'}</div>
      <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
      <div>Token: {localStorage.getItem('token') ? 'Yes' : 'No'}</div>
      <div>Guest Mode LS: {localStorage.getItem('guestMode') || 'None'}</div>
    </div>
  );
};

export default DebugInfo;
