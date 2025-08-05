import React, { useEffect, useState } from 'react';

const WelcomeTest: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const testWelcomeLogic = () => {
    const hasSeenWelcome = localStorage.getItem('welcomePromptSeen');
    const isNewUser = localStorage.getItem('isNewUser');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const info = {
      hasSeenWelcome,
      isNewUser,
      user: user?.email || 'no user',
      shouldShow: !hasSeenWelcome && user && isNewUser === 'true'
    };

    setDebugInfo(info);
    console.log('🔍 Welcome test debug:', info);

    if (info.shouldShow) {
      setShowWelcome(true);
    }
  };

  const simulateNewUser = () => {
    localStorage.setItem('isNewUser', 'true');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com', is_admin: false }));
    localStorage.removeItem('welcomePromptSeen');
    testWelcomeLogic();
  };

  const clearData = () => {
    localStorage.removeItem('isNewUser');
    localStorage.removeItem('user');
    localStorage.removeItem('welcomePromptSeen');
    setShowWelcome(false);
    setDebugInfo({});
  };

  useEffect(() => {
    testWelcomeLogic();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Welcome Prompt Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={simulateNewUser} style={{ marginRight: '10px' }}>
          Simulate New User
        </button>
        <button onClick={testWelcomeLogic} style={{ marginRight: '10px' }}>
          Test Logic
        </button>
        <button onClick={clearData}>
          Clear Data
        </button>
      </div>

      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', marginBottom: '20px' }}>
        <h3>Debug Info:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h2>🌳 Welcome new ka-FamALLE!!</h2>
            <p>Ready to explore your roots?</p>
            <button 
              onClick={() => {
                setShowWelcome(false);
                localStorage.setItem('welcomePromptSeen', 'true');
                testWelcomeLogic();
              }}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Let's go! 🌳
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeTest;
