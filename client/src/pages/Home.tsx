import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest, setGuestMode } = useUser();

  const handleGuestMode = () => {
    console.log('Entering guest mode...');
    setGuestMode(true);
    console.log('Guest mode set, navigating to dashboard...');
    
    // Use replace instead of push to avoid back button issues
    navigate('/dashboard', { replace: true });
  };

  // Authenticated user view
  if (user && !isGuest) {
    return (
      <div className="home">
        <div className="hero-section">
          <div className="hero-content">
            <div className="authenticated-welcome">
              <div className="welcome-message">
                <h2>Welcome, ALLE Fam!</h2>
                <p className="welcome-intro">
                  We're happy to have everyone here. Exciting new features are on the way, so stay tuned!<br />
                  Here's a sneak peek at what's coming soon:
                </p>
                <div className="upcoming-features">
                  <div className="feature-preview">
                    <h3>📱 Social Media</h3>
                    <p>Share posts, like, comment, and stay updated with announcements.</p>
                  </div>
                  <div className="feature-preview">
                    <h3>💬 Chats</h3>
                    <p>Connect through group chats and direct messages.</p>
                  </div>
                  <div className="feature-preview">
                    <h3>📸 Photo Library</h3>
                    <p>Explore a collection of treasured photos from our clan.</p>
                  </div>
                </div>
                <p className="closing-message">
                  In the meantime, feel free to explore our Family Tree.<br />
                  Let's take this chance to get to know one another better — so that the next time we meet, we're no longer strangers, but truly family.
                </p>
              </div>
              <div className="hero-buttons">
                <Link to="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
                <Link to="/family-tree" className="btn btn-secondary">
                  View Family Tree
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated or guest user view
  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to FamALLE</h1>
          <p>Explore your Almagro - Legaspi roots</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
            {!isGuest && (
              <button onClick={handleGuestMode} className="btn btn-guest">
                Browse as Guest
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* <div className="features-section">
        <div className="container">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Family Members</h3>
              <p>Add and manage family members with photos, dates, and biographical information.</p>
            </div>
            <div className="feature-card">
              <h3>Relationships</h3>
              <p>Define relationships between family members to build your complete family tree.</p>
            </div>
            <div className="feature-card">
              <h3>Visual Tree</h3>
              <p>View your family tree in an interactive, visual format that's easy to navigate.</p>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Home;
