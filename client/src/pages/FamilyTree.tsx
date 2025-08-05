import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import './FamilyTree.css';
import D3FamilyTree from '../components/D3FamilyTree';

interface FamilyMember {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  maiden_name?: string;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  gender: string;
  photo_url?: string;
  generation_level: number;
  is_living: boolean;
  occupation?: string;
  education?: string;
}

interface Marriage {
  id: number;
  spouse1_id: number;
  spouse2_id: number;
  marriage_date?: string;
  marriage_place?: string;
  marriage_type: string;
  status: string;
}

interface FamilyBranch {
  member: FamilyMember;
  spouse: FamilyMember | null;
  marriageInfo: Marriage | null;
  children: FamilyBranch[];
}

interface ChildRowItem {
  type: 'individual' | 'couple';
  // For individual type
  member?: FamilyMember;
  isOriginalChild?: boolean;
  // For couple type
  spouse1?: FamilyMember;
  spouse2?: FamilyMember;
  marriageInfo?: Marriage | null;
}

interface HierarchyData {
  rootCouple?: {
    spouse1: FamilyMember;
    spouse2: FamilyMember;
    marriageInfo: Marriage;
  } | null;
  childrenRow?: ChildRowItem[];
  additionalGenerations?: Array<{
    level: number;
    members: Array<FamilyMember & {
      parents?: Array<{
        id: number;
        first_name: string;
        last_name: string;
      }>;
    }>;
  }>;
  tree?: FamilyBranch[]; // Legacy format
  totalMembers: number;
  totalGenerations?: number;
  rootGeneration: number;
}

const FamilyTree: React.FC = () => {
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isGuest } = useUser();

  useEffect(() => {
    console.log('FamilyTree auth check - isGuest:', isGuest);
    const token = localStorage.getItem('token');
    
    // Only redirect if not in guest mode and no token
    if (!isGuest && !token) {
      console.log('Redirecting to login - not guest and no token');
      navigate('/login');
      return;
    }
    
    console.log('FamilyTree access granted - isGuest:', isGuest, 'hasToken:', !!token);
    fetchHierarchyData();
  }, [navigate, isGuest]);

  const fetchHierarchyData = async () => {
    try {
      let response;
      
      if (isGuest) {
        // Guest mode - use guest API endpoint
        console.log('📡 Fetching family tree hierarchy data for guest...');
        response = await axios.get('/api/family/guest/tree/hierarchy');
      } else {
        // Authenticated mode
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('❌ No token found, redirecting to login');
          navigate('/login');
          return;
        }
        
        console.log('📡 Fetching family tree hierarchy data...');
        response = await axios.get('/api/family/tree/hierarchy', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      console.log('✅ Hierarchy data received:', response.data);
      setHierarchyData(response.data);
    } catch (error: any) {
      console.error('❌ Error fetching hierarchy data:', error);
      if (error.response?.status === 401) {
        console.error('🔐 Unauthorized - token may be expired');
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="family-tree-loading">
        <div className="loading-content">
          <i className="bi bi-diagram-3" style={{ fontSize: '3rem', color: 'var(--fb-primary)', marginBottom: '1rem' }}></i>
          <h2>Loading Family Tree...</h2>
          <p>Preparing your family tree visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="family-tree-fullscreen">
      <div className="family-tree-header">
        <h1>
          <i className="bi bi-diagram-3"></i>
          Family Tree
        </h1>
        <div className="tree-controls">
          <button 
            className="btn-icon"
            onClick={() => navigate('/dashboard')}
            title="Go to Dashboard"
          >
            <i className="bi bi-house-door"></i>
          </button>
        </div>
      </div>
      
      {!hierarchyData || (!hierarchyData.rootCouple && !hierarchyData.tree) ? (
        <div className="empty-tree-fullscreen">
          <div className="empty-content">
            <i className="bi bi-diagram-3" style={{ fontSize: '4rem', color: 'var(--fb-primary)', marginBottom: '1.5rem' }}></i>
            <h2>No Family Tree Data Available</h2>
            <p>Visit the Dashboard to add family members and their relationships to build your family tree!</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              <i className="bi bi-house-door"></i>
              <span>Go to Dashboard</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="tree-visualization-container" style={{ paddingTop: '80px' }}>
          <D3FamilyTree hierarchyData={hierarchyData} />
        </div>
      )}
    </div>
  );
};

export default FamilyTree;
