import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import apiClient from '../config/api';
import './Navigation.css';

interface FamilyMember {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  photo_url?: string;
  user_id?: number;
}

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, user, logout, isGuest } = useUser();
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token || isGuest;
  const isDashboard = location.pathname === '/dashboard';
  
  // Dashboard state that we'll sync with the Dashboard component
  const [showForm, setShowForm] = useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [fixingGenerations, setFixingGenerations] = useState(false);
  
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [linkedMember, setLinkedMember] = useState<FamilyMember | null>(null);

  // Fetch linked member info
  useEffect(() => {
    if (isGuest) {
      // Clear any previous linked member data in guest mode
      setLinkedMember(null);
      return;
    }
    
    if (user && !isGuest && token) {
      fetchLinkedMember();
    }
  }, [user, isGuest, token]);

  const fetchLinkedMember = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/api/family/members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const members = response.data;
      const linkedMember = members.find((member: FamilyMember) => member.user_id === user?.id);
      setLinkedMember(linkedMember || null);
    } catch (error) {
      console.error('Error fetching linked member:', error);
    }
  };


  // Reset forms when leaving dashboard
  useEffect(() => {
    if (!isDashboard) {
      setShowForm(false);
      setShowRelationshipForm(false);
      setFixingGenerations(false);
    }
  }, [isDashboard]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.nav-profile-container')) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Expose functions to global scope so Dashboard can access them
  useEffect(() => {
    if (isDashboard) {
      (window as any).dashboardNav = {
        setShowForm,
        setShowRelationshipForm,
        setFixingGenerations,
        showForm,
        showRelationshipForm,
        fixingGenerations
      };
    }
    return () => {
      delete (window as any).dashboardNav;
    };
  }, [isDashboard, showForm, showRelationshipForm, fixingGenerations]);

  const handleLogout = () => {
    logout();
    setLinkedMember(null); // Clear linked member data
    setShowProfileDropdown(false);
    navigate('/');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const getDisplayName = () => {
    if (isGuest) {
      return 'Guest User';
    }
    if (linkedMember) {
      const parts = [
        linkedMember.first_name,
        linkedMember.middle_name,
        linkedMember.last_name
      ].filter(Boolean);
      return parts.join(' ');
    }
    return user?.email || '';
  };

  const getProfilePhoto = () => {
    if (isGuest) {
      // Don't show any profile photo in guest mode
      return null;
    }
    if (linkedMember?.photo_url) {
      return linkedMember.photo_url;
    }
    return null;
  };

  const handleFamilyTreeClick = () => {
    navigate('/family-tree');
  };

  // Dashboard action handlers
  const handleAddMember = () => {
    setShowForm(!showForm);
    setShowMobileMenu(false); // Close mobile menu
    // Trigger Dashboard component to update
    const event = new CustomEvent('dashboard-toggle-form', { detail: { showForm: !showForm } });
    window.dispatchEvent(event);
  };

  const handleAddRelationship = () => {
    setShowRelationshipForm(!showRelationshipForm);
    setShowMobileMenu(false); // Close mobile menu
    // Trigger Dashboard component to update
    const event = new CustomEvent('dashboard-toggle-relationship', { detail: { showRelationshipForm: !showRelationshipForm } });
    window.dispatchEvent(event);
  };

  const handleFixGenerations = () => {
    setShowMobileMenu(false); // Close mobile menu
    // Trigger Dashboard component to fix generations
    const event = new CustomEvent('dashboard-fix-generations');
    window.dispatchEvent(event);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <i className="bi bi-house-heart"></i>
          FamALLE
        </Link>
        
        <ul className={`nav-menu ${showMobileMenu ? 'mobile-open' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={() => setShowMobileMenu(false)}>
              <i className="bi bi-house"></i>
              <span>Home</span>
            </Link>
          </li>
          
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link" onClick={() => setShowMobileMenu(false)}>
                  <i className="bi bi-speedometer2"></i>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li className="nav-item">
                <button onClick={handleFamilyTreeClick} className="nav-link nav-button">
                  <i className="bi bi-diagram-3"></i>
                  <span>Family Tree</span>
                </button>
              </li>
              
              {/* Dashboard Actions - only show in mobile menu */}
              {isDashboard && isAdmin && (
                <>
                  <li className="nav-item dashboard-actions mobile-only">
                    <button 
                      className={`nav-action-btn ${showForm ? 'active' : ''}`}
                      onClick={handleAddMember}
                      title={showForm ? 'Cancel Adding Member' : 'Add Family Member'}
                    >
                      <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-person-plus'}`}></i>
                      <span className="mobile-label">{showForm ? 'Cancel' : 'Add Member'}</span>
                    </button>
                  </li>
                  <li className="nav-item dashboard-actions mobile-only">
                    <button 
                      className={`nav-action-btn ${showRelationshipForm ? 'active' : ''}`}
                      onClick={handleAddRelationship}
                      title={showRelationshipForm ? 'Cancel Adding Relationship' : 'Add Relationship'}
                    >
                      <i className={`bi ${showRelationshipForm ? 'bi-x-lg' : 'bi-people'}`}></i>
                      <span className="mobile-label">{showRelationshipForm ? 'Cancel' : 'Add Relationship'}</span>
                    </button>
                  </li>
                  <li className="nav-item dashboard-actions mobile-only">
                    <button 
                      className="nav-action-btn warning"
                      onClick={handleFixGenerations}
                      disabled={fixingGenerations}
                      title="Fix generation levels based on family relationships"
                    >
                      <i className={`bi ${fixingGenerations ? 'bi-arrow-repeat' : 'bi-gear'}`}></i>
                      <span className="mobile-label">{fixingGenerations ? 'Fixing...' : 'Fix Generations'}</span>
                    </button>
                  </li>
                </>
              )}
              
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link">Register</Link>
              </li>
            </>
          )}
        </ul>
        
        {/* Right side section - Desktop dashboard actions and profile */}
        <div className="nav-right-section">
          {/* Desktop Dashboard Actions */}
          {isAuthenticated && isDashboard && isAdmin && (
            <div className="desktop-dashboard-actions">
              <button 
                className={`nav-action-btn ${showForm ? 'active' : ''}`}
                onClick={handleAddMember}
                title={showForm ? 'Cancel Adding Member' : 'Add Family Member'}
              >
                <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-person-plus'}`}></i>
                <span className="desktop-label">{showForm ? 'Cancel' : 'Add Member'}</span>
              </button>
              <button 
                className={`nav-action-btn ${showRelationshipForm ? 'active' : ''}`}
                onClick={handleAddRelationship}
                title={showRelationshipForm ? 'Cancel Adding Relationship' : 'Add Relationship'}
              >
                <i className={`bi ${showRelationshipForm ? 'bi-x-lg' : 'bi-people'}`}></i>
                <span className="desktop-label">{showRelationshipForm ? 'Cancel' : 'Add Relationship'}</span>
              </button>
              <button 
                className="nav-action-btn warning"
                onClick={handleFixGenerations}
                disabled={fixingGenerations}
                title="Fix generation levels based on family relationships"
              >
                <i className={`bi ${fixingGenerations ? 'bi-arrow-repeat' : 'bi-gear'}`}></i>
                <span className="desktop-label">{fixingGenerations ? 'Fixing...' : 'Fix Generations'}</span>
              </button>
            </div>
          )}
          
          {/* Mobile hamburger button and Profile */}
          <div className="mobile-controls">
            {/* Mobile hamburger button - only visible on mobile */}
            <button className="nav-toggle" onClick={toggleMobileMenu}>
              <i className={`bi ${showMobileMenu ? 'bi-x' : 'bi-list'}`}></i>
            </button>
            
            {/* Profile button */}
            {isAuthenticated && (
              <div className="nav-profile-container">
                <button 
                  className="profile-button"
                  onClick={toggleProfileDropdown}
                  aria-expanded={showProfileDropdown}
                >
                  <div className="profile-avatar">
                    {getProfilePhoto() ? (
                      <img 
                        src={getProfilePhoto()!} 
                        alt={getDisplayName()}
                        className="profile-photo"
                      />
                    ) : (
                      <div className="profile-photo-placeholder">
                        <i className="bi bi-person-circle"></i>
                      </div>
                    )}
                  </div>
                  <i className={`bi ${showProfileDropdown ? 'bi-chevron-up' : 'bi-chevron-down'} dropdown-arrow`}></i>
                </button>
                
                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {getProfilePhoto() ? (
                          <img 
                            src={getProfilePhoto()!} 
                            alt={getDisplayName()}
                            className="dropdown-photo"
                          />
                        ) : (
                          <div className="dropdown-photo-placeholder">
                            <i className="bi bi-person-circle"></i>
                          </div>
                        )}
                      </div>
                      <div className="dropdown-info">
                        <div className="dropdown-name">{getDisplayName()}</div>
                        {isGuest && <div className="dropdown-guest-badge">Guest Mode</div>}
                        {isAdmin && !isGuest && <div className="dropdown-admin-badge">Administrator</div>}
                        {!linkedMember && !isGuest && <div className="dropdown-email">{user?.email}</div>}
                        {isGuest && <div className="dropdown-email">Read-only access</div>}
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    {!isGuest && (
                      <Link 
                        to="/change-password"
                        className="dropdown-item"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setShowMobileMenu(false);
                        }}
                      >
                        <i className="bi bi-key"></i>
                        <span>Change Password</span>
                      </Link>
                    )}
                    <button 
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      <span>{isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
