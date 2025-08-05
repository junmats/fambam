import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../config/api';
import { useUser } from '../contexts/UserContext';
import PhotoUpload from '../components/PhotoUpload';
import RelationshipManager from '../components/RelationshipManager';
import './Dashboard.css';

interface FamilyMember {
  id: number;
  user_id?: number;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  maiden_name?: string;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  gender: string;
  bio?: string;
  photo_url?: string;
  generation_level: number;
  is_living: boolean;
  occupation?: string;
  education?: string;
  notes?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
}

interface Family {
  marriage_id: number | null;
  marriage_date?: string;
  marriage_place?: string;
  status: string;
  generation_level: number;
  spouse1: FamilyMember;
  spouse2: FamilyMember | null;
  children: FamilyMember[];
}

interface Generation {
  generation_level: number;
  member_count: number;
  members: string;
}

interface FamilyStats {
  total_members: number;
  living_members: number;
  deceased_members: number;
  oldest_generation: number;
  youngest_generation: number;
  total_generations: number;
  parent_child_relationships: number;
  marriages: number;
  sibling_relationships: number;
}

interface ParentChildRelationship {
  id: number;
  parent_id: number;
  child_id: number;
  relationship_type: string;
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

interface Relationship {
  id: number;
  type: 'marriage' | 'parent-child';
  person1_id: number;
  person1_name: string;
  person2_id: number;
  person2_name: string;
  marriage_date?: string;
  marriage_place?: string;
  marriage_type?: string;
  status?: string;
  relationship_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, user, isGuest } = useUser();
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);
  const [userLinkedMember, setUserLinkedMember] = useState<FamilyMember | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [showRelationshipManager, setShowRelationshipManager] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [activeView, setActiveView] = useState<'families' | 'members' | 'generations' | 'relationships'>('families');
  const [relationshipType, setRelationshipType] = useState<'parent-child' | 'marriage'>('parent-child');
  const [relationshipForm, setRelationshipForm] = useState({
    person1Id: '',
    person2Id: '',
    relationshipSubtype: '',
    marriageDate: '',
    marriagePlace: '',
    marriageType: 'marriage',
    status: 'married'
  });
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    maidenName: '',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    gender: '',
    bio: '',
    photoUrl: '',
    isLiving: true,
    occupation: '',
    education: '',
    notes: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: ''
  });
  const [fixingGenerations, setFixingGenerations] = useState(false);
  const [fixGenerationsMessage, setFixGenerationsMessage] = useState('');
  const [error, setError] = useState('');
  
  // Form validation and error states
  const [memberFormErrors, setMemberFormErrors] = useState<Record<string, string>>({});
  const [relationshipFormErrors, setRelationshipFormErrors] = useState<Record<string, string>>({});
  const [memberFormLoading, setMemberFormLoading] = useState(false);
  const [relationshipFormLoading, setRelationshipFormLoading] = useState(false);
  
  // Delete state
  const [deletingMember, setDeletingMember] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    memberId: number | null;
    memberName: string;
  }>({ show: false, memberId: null, memberName: '' });
  
  // Relationships management state
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [showEditRelationshipForm, setShowEditRelationshipForm] = useState(false);
  const [relationshipDeleteConfirmation, setRelationshipDeleteConfirmation] = useState<{
    show: boolean;
    relationshipId: number | null;
    relationshipDescription: string;
  }>({ show: false, relationshipId: null, relationshipDescription: '' });
  const [deletingRelationship, setDeletingRelationship] = useState<number | null>(null);
  
  // Photo upload state for deferred upload
  const [photoData, setPhotoData] = useState<{
    file: File | null;
    cropData: any | null;
  }>({ file: null, cropData: null });
  
  // Search and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof FamilyMember | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [generationSearchTerms, setGenerationSearchTerms] = useState<Record<number, string>>({});
  const [generationSortConfigs, setGenerationSortConfigs] = useState<Record<number, {
    key: keyof FamilyMember | null;
    direction: 'asc' | 'desc';
  }>>({});
  
  // Member profile modal state
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  
  // Redirect to login if not authenticated and not in guest mode
  useEffect(() => {
    console.log('Dashboard auth check - isGuest:', isGuest, 'user:', user);
    const token = localStorage.getItem('token');
    
    // Only redirect if not in guest mode and no token
    if (!isGuest && !token) {
      console.log('Redirecting to login - not guest and no token');
      navigate('/login');
      return;
    }
    
    console.log('Dashboard access granted - isGuest:', isGuest, 'hasToken:', !!token);
  }, [navigate, isGuest, user]);

  // Data loading effect
  useEffect(() => {
    // Only load data if authenticated (either guest or regular user)
    if (isGuest || localStorage.getItem('token')) {
      fetchData();
    }
  }, [navigate, isGuest]);

  const fetchData = async () => {
    await Promise.all([fetchFamilyMembers(), fetchFamilies(), fetchGenerations(), fetchStats(), fetchRelationships()]);
  };

  const fetchGenerations = async () => {
    try {
      let response;
      
      if (isGuest) {
        // Guest mode - no authentication required
        response = await apiClient.get('/api/family/guest/tree/generations');
      } else {
        // Authenticated mode
        const token = localStorage.getItem('token');
        response = await apiClient.get('/api/family/tree/generations', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setGenerations(response.data);
    } catch (error) {
      console.error('Error fetching generations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      let response;
      
      if (isGuest) {
        // Guest mode - no authentication required
        response = await apiClient.get('/api/family/guest/stats');
      } else {
        // Authenticated mode
        const token = localStorage.getItem('token');
        response = await apiClient.get('/api/family/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setFamilyStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFamilies = async () => {
    try {
      let response;
      
      if (isGuest) {
        // Guest mode - no authentication required
        response = await apiClient.get('/api/family/guest/families');
      } else {
        // Authenticated mode
        const token = localStorage.getItem('token');
        console.log('Fetching families with token:', token ? 'Token exists' : 'No token');
        response = await apiClient.get('/api/family/families', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      console.log('Families response:', response.data);
      console.log('Number of families:', response.data.length);
      setFamilies(response.data);
    } catch (error: any) {
      console.error('Error fetching families:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      let response;
      
      if (isGuest) {
        // Guest mode - no authentication required
        response = await apiClient.get('/api/family/guest/members');
      } else {
        // Authenticated mode
        const token = localStorage.getItem('token');
        console.log('Fetching family members with token:', token ? 'Token exists' : 'No token');
        response = await apiClient.get('/api/family/members', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      console.log('Family members response:', response.data);
      console.log('Number of family members:', response.data.length);
      setFamilyMembers(response.data);
    } catch (error: any) {
      console.error('Error fetching family members:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async () => {
    try {
      let response;
      
      if (isGuest) {
        // Guest mode - no authentication required
        response = await apiClient.get('/api/family/guest/all-relationships');
      } else {
        // Authenticated mode
        const token = localStorage.getItem('token');
        response = await apiClient.get('/api/family/all-relationships', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setRelationships(response.data);
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  // Utility function to upload photo
  const uploadPhoto = async (file: File, cropData: any): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        console.log('📸 DEBUG: Upload crop data received:', cropData);
        console.log('📸 DEBUG: Image loaded for upload, natural size:', img.naturalWidth, 'x', img.naturalHeight);
        
        // The crop data from PhotoUpload is already scaled to natural dimensions
        const cropWidth = cropData.width;
        const cropHeight = cropData.height;
        const cropX = cropData.x;
        const cropY = cropData.y;
        
        console.log('📸 DEBUG: Using scaled crop data:', {
          cropX,
          cropY,
          cropWidth,
          cropHeight
        });
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        console.log('📸 DEBUG: Canvas size for upload:', cropWidth, 'x', cropHeight);
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(cropWidth / 2, cropHeight / 2, Math.min(cropWidth, cropHeight) / 2, 0, 2 * Math.PI);
        ctx.clip();
        
        // Draw the exact cropped area using the scaled coordinates
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );
        
        console.log('📸 DEBUG: Upload drawImage params:', {
          sourceX: cropX,
          sourceY: cropY,
          sourceWidth: cropWidth,
          sourceHeight: cropHeight,
          destWidth: cropWidth,
          destHeight: cropHeight
        });
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          
          const formData = new FormData();
          formData.append('photo', blob, 'photo.jpg');
          // Add crop data to form data
          formData.append('cropData', JSON.stringify(cropData));
          
          try {
            const token = localStorage.getItem('token');
            const response = await apiClient.post('/api/photos/upload', formData, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            });
            
            resolve(response.data.fileName);
          } catch (error: any) {
            console.error('Error uploading photo:', error);
            reject(new Error(error.response?.data?.error || 'Failed to upload photo'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Create object URL from file to load the image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Welcome prompt functions
  const handleWelcomeClose = () => {
    setShowWelcomePrompt(false);
    // Mark that user has seen the welcome prompt
    localStorage.setItem('welcomePromptSeen', 'true');
  };

  // Check if user is new (hasn't seen welcome prompt)
  const checkIfNewUser = () => {
    try {
      const hasSeenWelcome = localStorage.getItem('welcomePromptSeen');
      const isNewUser = localStorage.getItem('isNewUser');
      const userStr = localStorage.getItem('user');
      const currentUser = user || (userStr ? JSON.parse(userStr) : null);
      
      const shouldShow = !hasSeenWelcome && currentUser && isNewUser === 'true' && !showWelcomePrompt;
      
      if (shouldShow) {
        console.log('✅ Showing welcome prompt for new user');
        setShowWelcomePrompt(true);
        // Clear the new user flag
        localStorage.removeItem('isNewUser');
      }
    } catch (error) {
      console.error('❌ Error in checkIfNewUser:', error);
    }
  };

  // Link user to family member
  const handleLinkToMe = async (memberId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.put(`/api/family/members/${memberId}/link`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('✅ Successfully linked user to family member');
        // Refresh all data to get updated user_id values
        await fetchData();
        // Show success message
        setFixGenerationsMessage('✅ Successfully linked your account to the family member!');
        // Clear message after 3 seconds
        setTimeout(() => setFixGenerationsMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Error linking user to family member:', error);
      setError('Failed to link to family member');
      setFixGenerationsMessage('❌ Failed to link to family member. Please try again.');
      // Clear message after 3 seconds
      setTimeout(() => setFixGenerationsMessage(''), 3000);
    }
  };

  // Check for user-linked members
  const checkUserLinkedMembers = () => {
    if (user && familyMembers.length > 0) {
      const linkedMember = familyMembers.find(member => member.user_id === user.id);
      setUserLinkedMember(linkedMember || null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberFormErrors({});
    setMemberFormLoading(true);
    
    // Validate form
    if (!validateMemberForm()) {
      setMemberFormLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      let finalFormData = { ...formData };
      
      // Upload photo if there's new photo data
      if (photoData.file && photoData.cropData) {
        try {
          const filename = await uploadPhoto(photoData.file, photoData.cropData);
          finalFormData.photoUrl = `http://localhost:5001/api/photos/${filename}`;
        } catch (photoError: any) {
          setMemberFormErrors({ photoUrl: photoError.message || 'Failed to upload photo' });
          setMemberFormLoading(false);
          return;
        }
      }
      
      if (editingMember) {
        // Update existing member
        await apiClient.put(`/api/family/members/${editingMember.id}`, finalFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Add new member
        await apiClient.post('/api/family/members', finalFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        maidenName: '',
        birthDate: '',
        birthPlace: '',
        deathDate: '',
        deathPlace: '',
        gender: '',
        bio: '',
        photoUrl: '',
        isLiving: true,
        occupation: '',
        education: '',
        notes: '',
        facebookUrl: '',
        twitterUrl: '',
        instagramUrl: ''
      });
      setPhotoData({ file: null, cropData: null });
      setShowForm(false);
      setEditingMember(null);
      fetchData(); // Refresh both families and members
    } catch (error: any) {
      console.error(`Error ${editingMember ? 'updating' : 'adding'} family member:`, error);
      // Handle server validation errors
      if (error.response?.data?.message) {
        setMemberFormErrors({ general: error.response.data.message });
      } else {
        setMemberFormErrors({ general: `Failed to ${editingMember ? 'update' : 'add'} family member. Please try again.` });
      }
    } finally {
      setMemberFormLoading(false);
    }
  };

  // Edit member functions
  const handleEditClick = (member: FamilyMember) => {
    setEditingMember(member);
    
    // Format dates to YYYY-MM-DD for input fields
    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };
    
    setFormData({
      firstName: member.first_name || '',
      middleName: member.middle_name || '',
      lastName: member.last_name || '',
      maidenName: member.maiden_name || '',
      birthDate: formatDateForInput(member.birth_date),
      birthPlace: member.birth_place || '',
      deathDate: formatDateForInput(member.death_date),
      deathPlace: member.death_place || '',
      gender: member.gender || '',
      bio: member.bio || '',
      photoUrl: member.photo_url || '',
      isLiving: member.is_living,
      occupation: member.occupation || '',
      education: member.education || '',
      notes: member.notes || '',
      facebookUrl: member.facebook_url || '',
      twitterUrl: member.twitter_url || '',
      instagramUrl: member.instagram_url || ''
    });
    setPhotoData({ file: null, cropData: null }); // Clear photo data for editing
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      maidenName: '',
      birthDate: '',
      birthPlace: '',
      deathDate: '',
      deathPlace: '',
      gender: '',
      bio: '',
      photoUrl: '',
      isLiving: true,
      occupation: '',
      education: '',
      notes: '',
      facebookUrl: '',
      twitterUrl: '',
      instagramUrl: ''
    });
    setPhotoData({ file: null, cropData: null });
    setShowForm(false);
    setMemberFormErrors({});
  };

  const handleRelationshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRelationshipFormErrors({});
    setRelationshipFormLoading(true);
    
    // Validate form
    if (!validateRelationshipForm()) {
      setRelationshipFormLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let payload = {};

      switch (relationshipType) {
        case 'parent-child':
          endpoint = '/api/family/relationships/parent-child';
          payload = {
            parentId: relationshipForm.person1Id,
            childId: relationshipForm.person2Id,
            relationshipType: relationshipForm.relationshipSubtype || 'biological'
          };
          break;
        case 'marriage':
          endpoint = '/api/family/marriages';
          payload = {
            spouse1Id: relationshipForm.person1Id,
            spouse2Id: relationshipForm.person2Id,
            marriageDate: relationshipForm.marriageDate,
            marriagePlace: relationshipForm.marriagePlace,
            marriageType: relationshipForm.marriageType,
            status: relationshipForm.status
          };
          break;
      }

      await apiClient.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRelationshipForm({
        person1Id: '',
        person2Id: '',
        relationshipSubtype: '',
        marriageDate: '',
        marriagePlace: '',
        marriageType: 'marriage',
        status: 'married'
      });
      setShowRelationshipForm(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding relationship:', error);
      // Handle server validation errors
      if (error.response?.data?.message) {
        setRelationshipFormErrors({ general: error.response.data.message });
      } else {
        setRelationshipFormErrors({ general: 'Failed to add relationship. Please try again.' });
      }
    } finally {
      setRelationshipFormLoading(false);
    }
  };

  // Delete member functions
  const handleDeleteClick = (member: FamilyMember) => {
    setDeleteConfirmation({
      show: true,
      memberId: member.id,
      memberName: getFullName(member)
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.memberId) return;
    
    setDeletingMember(deleteConfirmation.memberId);
    
    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/api/family/members/${deleteConfirmation.memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh data after successful deletion
      fetchData();
      
      // Close confirmation dialog
      setDeleteConfirmation({ show: false, memberId: null, memberName: '' });
    } catch (error: any) {
      console.error('Error deleting family member:', error);
      
      // Show error message
      alert(error.response?.data?.message || 'Failed to delete family member. Please try again.');
    } finally {
      setDeletingMember(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ show: false, memberId: null, memberName: '' });
  };

  const handleMemberProfileClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setShowMemberProfile(true);
  };

  const handleCloseProfile = () => {
    setShowMemberProfile(false);
    setSelectedMember(null);
  };

  const handleMemberClick = (member: FamilyMember) => {
    handleMemberProfileClick(member);
  };

  const handleFixGenerations = async () => {
    setFixingGenerations(true);
    setFixGenerationsMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post(
        '/api/family/fix-generations',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setFixGenerationsMessage(`✅ Generations fixed successfully! ${response.data.generationDistribution?.length || 0} generation levels updated.`);
        // Refresh data to show updated generations
        fetchData();
      } else {
        setFixGenerationsMessage('❌ Failed to fix generations: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error fixing generations:', error);
      setFixGenerationsMessage('❌ Error fixing generations. Please try again.');
    } finally {
      setFixingGenerations(false);
      // Clear message after 5 seconds
      setTimeout(() => setFixGenerationsMessage(''), 5000);
    }
  };

  // Sync with Navigation component
  useEffect(() => {
    const handleToggleForm = (event: any) => {
      setShowForm(event.detail.showForm);
      // Clear edit mode when toggling form from navigation
      if (event.detail.showForm === false) {
        setEditingMember(null);
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          maidenName: '',
          birthDate: '',
          birthPlace: '',
          deathDate: '',
          deathPlace: '',
          gender: '',
          bio: '',
          photoUrl: '',
          isLiving: true,
          occupation: '',
          education: '',
          notes: '',
          facebookUrl: '',
          twitterUrl: '',
          instagramUrl: ''
        });
        setPhotoData({ file: null, cropData: null });
        setMemberFormErrors({});
      } else {
        // Clear photo data when opening form for new member
        setPhotoData({ file: null, cropData: null });
      }
    };
    
    const handleToggleRelationship = (event: any) => {
      setShowRelationshipForm(event.detail.showRelationshipForm);
    };
    
    const handleFixGenerationsEvent = () => {
      handleFixGenerations();
    };
    
    window.addEventListener('dashboard-toggle-form', handleToggleForm);
    window.addEventListener('dashboard-toggle-relationship', handleToggleRelationship);
    window.addEventListener('dashboard-fix-generations', handleFixGenerationsEvent);
    
    return () => {
      window.removeEventListener('dashboard-toggle-form', handleToggleForm);
      window.removeEventListener('dashboard-toggle-relationship', handleToggleRelationship);
      window.removeEventListener('dashboard-fix-generations', handleFixGenerationsEvent);
    };
  }, []);

  // Update Navigation component when local state changes
  useEffect(() => {
    const navState = (window as any).dashboardNav;
    if (navState) {
      navState.setShowForm(showForm);
      navState.setShowRelationshipForm(showRelationshipForm);
      navState.setFixingGenerations(fixingGenerations);
    }
  }, [showForm, showRelationshipForm, fixingGenerations]);

  // Check for new users and show welcome prompt
  useEffect(() => {
    if (user) {
      checkIfNewUser();
    }
  }, [user]);

  // Also check when loading completes
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure everything is settled
      setTimeout(() => {
        checkIfNewUser();
      }, 200);
    }
  }, [loading]);

  // Check for user-linked members when data loads
  useEffect(() => {
    checkUserLinkedMembers();
  }, [familyMembers, user]);

  // Sorting and filtering helper functions
  const sortMembers = (members: FamilyMember[], config: { key: keyof FamilyMember | null; direction: 'asc' | 'desc' }) => {
    if (!config.key) return members;
    
    return [...members].sort((a, b) => {
      const aValue = a[config.key!];
      const bValue = b[config.key!];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return config.direction === 'asc' ? result : -result;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return config.direction === 'asc' ? result : -result;
      }
      
      // For dates
      if (config.key === 'birth_date' || config.key === 'death_date') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        const result = dateA - dateB;
        return config.direction === 'asc' ? result : -result;
      }
      
      // Default string comparison
      const result = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
      return config.direction === 'asc' ? result : -result;
    });
  };

  const filterMembers = (members: FamilyMember[], searchTerm: string) => {
    if (!searchTerm.trim()) return members;
    
    const term = searchTerm.toLowerCase();
    return members.filter(member => 
      member.first_name?.toLowerCase().includes(term) ||
      member.middle_name?.toLowerCase().includes(term) ||
      member.last_name?.toLowerCase().includes(term) ||
      member.maiden_name?.toLowerCase().includes(term) ||
      member.birth_place?.toLowerCase().includes(term) ||
      member.occupation?.toLowerCase().includes(term) ||
      member.education?.toLowerCase().includes(term) ||
      (member.is_living ? 'living' : 'deceased').includes(term)
    );
  };

  const handleSort = (key: keyof FamilyMember) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleGenerationSort = (generationLevel: number, key: keyof FamilyMember) => {
    setGenerationSortConfigs(prev => ({
      ...prev,
      [generationLevel]: {
        key,
        direction: prev[generationLevel]?.key === key && prev[generationLevel]?.direction === 'asc' ? 'desc' : 'asc'
      }
    }));
  };

  const handleKeyboardSort = (e: React.KeyboardEvent, sortFn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sortFn();
    }
  };

  const getSortIcon = (columnKey: keyof FamilyMember, currentSortConfig: { key: keyof FamilyMember | null; direction: 'asc' | 'desc' }) => {
    if (currentSortConfig.key !== columnKey) return <i className="bi bi-arrow-down-up sort-icon"></i>;
    return <i className={`bi ${currentSortConfig.direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down'} sort-icon`}></i>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getFullName = (member: FamilyMember | null | undefined) => {
    if (!member) return 'Unknown';
    
    const parts = [
      member.first_name,
      member.middle_name,
      member.last_name || member.maiden_name
    ].filter(Boolean);
    return parts.join(' ');
  };

  const getGenerationLabel = (generationLevel: number) => {
    if (generationLevel === 0) {
      return 'OG';
    }
    
    const ordinals = ['', '1st Gen', '2nd Gen', '3rd Gen', '4th Gen', '5th Gen', '6th Gen', '7th Gen', '8th Gen', '9th Gen', '10th Gen'];
    
    if (generationLevel <= 10) {
      return ordinals[generationLevel];
    }
    
    // For generations beyond 10, use standard format
    return `${generationLevel}th Gen`;
  };

  // Form validation functions
  const validateMemberForm = () => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!formData.firstName || formData.firstName.trim() === '') {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName || formData.lastName.trim() === '') {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.gender || formData.gender === '') {
      errors.gender = 'Gender is required';
    }
    
    // Date validations
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        errors.birthDate = 'Birth date cannot be in the future';
      }
    }
    
    if (formData.deathDate && formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const deathDate = new Date(formData.deathDate);
      if (deathDate <= birthDate) {
        errors.deathDate = 'Death date must be after birth date';
      }
    }
    
    if (!formData.isLiving && !formData.deathDate) {
      errors.deathDate = 'Death date is required for deceased members';
    }
    
    setMemberFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRelationshipForm = () => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!relationshipForm.person1Id) {
      errors.person1Id = 'Please select the first person';
    }
    
    if (!relationshipForm.person2Id) {
      errors.person2Id = 'Please select the second person';
    }
    
    // Cannot relate person to themselves
    if (relationshipForm.person1Id && relationshipForm.person2Id && 
        relationshipForm.person1Id === relationshipForm.person2Id) {
      errors.person2Id = 'A person cannot be related to themselves';
    }
    
    // Marriage specific validations
    if (relationshipType === 'marriage') {
      if (relationshipForm.marriageDate) {
        const marriageDate = new Date(relationshipForm.marriageDate);
        const today = new Date();
        if (marriageDate > today) {
          errors.marriageDate = 'Marriage date cannot be in the future';
        }
      }
    }
    
    setRelationshipFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const sortedAndFilteredMembers = sortMembers(filterMembers(familyMembers, searchTerm), sortConfig);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        {isGuest && (
          <div className="guest-mode-banner">
            <div className="guest-mode-content">
              <i className="bi bi-eye"></i>
              <div>
                <h3>Guest Mode</h3>
                <p>You're viewing the family tree in read-only mode. <Link to="/register">Sign up</Link> or <Link to="/login">log in</Link> to make changes.</p>
              </div>
            </div>
          </div>
        )}
        
        {fixGenerationsMessage && (
          <div className={`generation-fix-message ${fixGenerationsMessage.includes('✅') ? 'success' : 'error'}`}>
            {fixGenerationsMessage}
          </div>
        )}

      {familyStats && (
        <div className="family-stats-summary">
          <div className="stat-item">
            <span className="stat-number">{familyStats.total_members}</span>
            <span className="stat-label">Family Members</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{familyStats.total_generations}</span>
            <span className="stat-label">Generations</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{familyStats.living_members}</span>
            <span className="stat-label">Living</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{familyStats.deceased_members}</span>
            <span className="stat-label">Remembered</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{familyStats.parent_child_relationships}</span>
            <span className="stat-label">Bonds</span>
          </div>
        </div>
      )}

      {showWelcomePrompt && (
        <div className="modal-overlay">
          <div className="welcome-modal">
            <div className="welcome-content">
              <div className="welcome-icon">
                <i className="bi bi-tree"></i>
              </div>
              <h2>Welcome ka-FamALLE!!</h2>
              <p>Ready to explore your roots?</p>
              <div className="welcome-buttons">
                <button 
                  className="btn btn-primary welcome-btn"
                  onClick={handleWelcomeClose}
                >
                  Let's go! 🌳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="member-form-modal">
            <div className="modal-header">
              <h2>{editingMember ? 'Edit Family Member' : 'Add New Family Member'}</h2>
              <button 
                className="modal-close-btn"
                onClick={handleCancelEdit}
                type="button"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-content">
              {memberFormErrors.general && (
                <div className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {memberFormErrors.general}
                </div>
              )}
              <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className={memberFormErrors.firstName ? 'error' : ''}
                />
                {memberFormErrors.firstName && (
                  <div className="error-message">{memberFormErrors.firstName}</div>
                )}
              </div>
              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className={memberFormErrors.lastName ? 'error' : ''}
                />
                {memberFormErrors.lastName && (
                  <div className="error-message">{memberFormErrors.lastName}</div>
                )}
              </div>
              <div className="form-group">
                <label>Maiden Name</label>
                <input
                  type="text"
                  name="maidenName"
                  value={formData.maidenName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={memberFormErrors.birthDate ? 'error' : ''}
                />
                {memberFormErrors.birthDate && (
                  <div className="error-message">{memberFormErrors.birthDate}</div>
                )}
              </div>
              <div className="form-group">
                <label>Birth Place</label>
                <input
                  type="text"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  placeholder="City, State/Province, Country"
                />
                {memberFormErrors.birthPlace && (
                  <div className="error-message">{memberFormErrors.birthPlace}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isLiving"
                    checked={formData.isLiving}
                    onChange={(e) => setFormData({...formData, isLiving: e.target.checked})}
                  />
                  {' '}Currently Living
                </label>
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={memberFormErrors.gender ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="unknown">Unknown</option>
                </select>
                {memberFormErrors.gender && (
                  <div className="error-message">{memberFormErrors.gender}</div>
                )}
              </div>
            </div>

            {!formData.isLiving && (
              <div className="form-row">
                <div className="form-group">
                  <label>Death Date</label>
                  <input
                    type="date"
                    name="deathDate"
                    value={formData.deathDate}
                    onChange={handleInputChange}
                    className={memberFormErrors.deathDate ? 'error' : ''}
                  />
                  {memberFormErrors.deathDate && (
                    <div className="error-message">{memberFormErrors.deathDate}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Death Place</label>
                  <input
                    type="text"
                    name="deathPlace"
                    value={formData.deathPlace}
                    onChange={handleInputChange}
                    placeholder="City, State/Province, Country"
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Facebook URL</label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/profile"
                />
              </div>
              <div className="form-group">
                <label>Twitter/X URL</label>
                <input
                  type="url"
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Instagram URL</label>
                <input
                  type="url"
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Photo</label>
              <PhotoUpload
                currentPhotoUrl={formData.photoUrl}
                onPhotoChange={(photoUrl) => setFormData({ ...formData, photoUrl })}
                onPhotoDataChange={(file, cropData) => setPhotoData({ file, cropData })}
                onError={(error) => setMemberFormErrors({ ...memberFormErrors, photoUrl: error })}
              />
              {memberFormErrors.photoUrl && (
                <div className="error-message">{memberFormErrors.photoUrl}</div>
              )}
            </div>

            <div className="form-group">
              <label>Biography</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                placeholder="Additional notes or information"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn btn-primary" disabled={memberFormLoading}>
                {memberFormLoading ? (editingMember ? 'Updating...' : 'Adding...') : (editingMember ? 'Update Family Member' : 'Add Family Member')}
              </button>
              {editingMember && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={memberFormLoading}>
                  Cancel
                </button>
              )}
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      {showRelationshipForm && (
        <div className="modal-overlay">
          <div className="relationship-form-modal">
            <div className="modal-header">
              <h2>Add Relationship</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowRelationshipForm(false)}
                type="button"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-content">
              {relationshipFormErrors.general && (
              <div className="form-error-message">
                <i className="bi bi-exclamation-circle"></i>
                {relationshipFormErrors.general}
              </div>
            )}
            <div className="relationship-type-selector">
            <label>
              <input
                type="radio"
                value="parent-child"
                checked={relationshipType === 'parent-child'}
                onChange={(e) => setRelationshipType(e.target.value as 'parent-child')}
              />
              Parent-Child
            </label>
            <label>
              <input
                type="radio"
                value="marriage"
                checked={relationshipType === 'marriage'}
                onChange={(e) => setRelationshipType(e.target.value as 'marriage')}
              />
              Marriage/Partnership
            </label>
          </div>

          <form onSubmit={handleRelationshipSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>
                  {relationshipType === 'parent-child' ? 'Parent' : 'Person 1'}
                </label>
                <select
                  value={relationshipForm.person1Id}
                  onChange={(e) => setRelationshipForm({
                    ...relationshipForm,
                    person1Id: e.target.value
                  })}
                  required
                  className={relationshipFormErrors.person1Id ? 'error' : ''}
                >
                  <option value="">Select Person</option>
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.middle_name} {member.last_name}
                    </option>
                  ))}
                </select>
                {relationshipFormErrors.person1Id && (
                  <div className="error-message">{relationshipFormErrors.person1Id}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  {relationshipType === 'parent-child' ? 'Child' : 'Person 2'}
                </label>
                <select
                  value={relationshipForm.person2Id}
                  onChange={(e) => setRelationshipForm({
                    ...relationshipForm,
                    person2Id: e.target.value
                  })}
                  required
                  className={relationshipFormErrors.person2Id ? 'error' : ''}
                >
                  <option value="">Select Person</option>
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.middle_name} {member.last_name}
                    </option>
                  ))}
                </select>
                {relationshipFormErrors.person2Id && (
                  <div className="error-message">{relationshipFormErrors.person2Id}</div>
                )}
              </div>
            </div>

            {relationshipType === 'parent-child' && (
              <div className="form-group">
                <label>Relationship Type</label>
                <select
                  value={relationshipForm.relationshipSubtype}
                  onChange={(e) => setRelationshipForm({
                    ...relationshipForm,
                    relationshipSubtype: e.target.value
                  })}
                >
                  <option value="biological">Biological</option>
                  <option value="adopted">Adopted</option>
                  <option value="step">Step</option>
                  <option value="foster">Foster</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
            )}

            {relationshipType === 'marriage' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Marriage Date</label>
                    <input
                      type="date"
                      value={relationshipForm.marriageDate}
                      onChange={(e) => setRelationshipForm({
                        ...relationshipForm,
                        marriageDate: e.target.value
                      })}
                      className={relationshipFormErrors.marriageDate ? 'error' : ''}
                    />
                    {relationshipFormErrors.marriageDate && (
                      <div className="error-message">{relationshipFormErrors.marriageDate}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Marriage Place</label>
                    <input
                      type="text"
                      value={relationshipForm.marriagePlace}
                      onChange={(e) => setRelationshipForm({
                        ...relationshipForm,
                        marriagePlace: e.target.value
                      })}
                      placeholder="City, State/Province, Country"
                    />
                    {relationshipFormErrors.marriagePlace && (
                      <div className="error-message">{relationshipFormErrors.marriagePlace}</div>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Marriage Type</label>
                    <select
                      value={relationshipForm.marriageType}
                      onChange={(e) => setRelationshipForm({
                        ...relationshipForm,
                        marriageType: e.target.value
                      })}
                    >
                      <option value="marriage">Marriage</option>
                      <option value="civil_union">Civil Union</option>
                      <option value="domestic_partnership">Domestic Partnership</option>
                      <option value="common_law">Common Law</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={relationshipForm.status}
                      onChange={(e) => setRelationshipForm({
                        ...relationshipForm,
                        status: e.target.value
                      })}
                    >
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="separated">Separated</option>
                      <option value="widowed">Widowed</option>
                      <option value="annulled">Annulled</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={relationshipFormLoading}>
              {relationshipFormLoading ? 'Adding...' : `Add ${relationshipType === 'parent-child' ? 'Parent-Child Relationship' : 'Marriage'}`}
            </button>
          </form>
            </div>
          </div>
        </div>
      )}

      <div className="view-toggle">
        <button 
          className={`btn ${activeView === 'families' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('families')}
        >
          Family View
        </button>
        <button 
          className={`btn ${activeView === 'members' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('members')}
        >
          All Members
        </button>
        <button 
          className={`btn ${activeView === 'generations' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('generations')}
        >
          Generations
        </button>
        <button 
          className={`btn ${activeView === 'relationships' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('relationships')}
        >
          Relationships
        </button>
      </div>

      {activeView === 'families' && (
        <div className="families-grid">
          {families.length === 0 ? (
            <div className="no-families">
              <p>No families found. Start by adding family members and their relationships!</p>
            </div>
          ) : (
            families.map((family, index) => (
              <div key={family.marriage_id || `family-${index}`} className="family-card">
                <div className="family-header">
                  <h3>
                    {family.status === 'single_parent' ? (
                      `${getFullName(family.spouse1)} (Single Parent)`
                    ) : (
                      `${getFullName(family.spouse1)} & ${getFullName(family.spouse2)}`
                    )}
                  </h3>
                  {family.marriage_date && (
                    <p className="marriage-info">
                      Married: {formatDate(family.marriage_date)}
                      {family.marriage_place && ` in ${family.marriage_place}`}
                    </p>
                  )}
                  <p className="generation-info">{getGenerationLabel(family.generation_level)}</p>
                </div>

                <div className="parents-section">
                  <h4>Parents:</h4>
                  <div className="parents-grid">
                    <div className="parent-card" onClick={() => handleMemberClick(family.spouse1)} style={{ cursor: 'pointer' }}>
                      <div className="parent-photo">
                        {family.spouse1.photo_url ? (
                          <img 
                            src={family.spouse1.photo_url} 
                            alt={getFullName(family.spouse1)}
                            className="parent-photo-img"
                          />
                        ) : (
                          <div className="parent-photo-placeholder">
                            <i className="bi bi-person-circle"></i>
                          </div>
                        )}
                      </div>
                      <div className="parent-info">
                        <h5>{getFullName(family.spouse1)}</h5>
                        <p>Born: {formatDate(family.spouse1.birth_date)}</p>
                        {family.spouse1.birth_place && <p>Place: {family.spouse1.birth_place}</p>}
                        {family.spouse1.occupation && <p>Occupation: {family.spouse1.occupation}</p>}
                        <span className={`status-badge ${family.spouse1.is_living ? 'living' : 'deceased'}`}>
                          {family.spouse1.is_living ? 'Living' : 'Deceased'}
                        </span>
                      </div>
                    </div>

                    {family.spouse2 && (
                      <div className="parent-card" onClick={() => handleMemberClick(family.spouse2!)} style={{ cursor: 'pointer' }}>
                        <div className="parent-photo">
                          {family.spouse2.photo_url ? (
                            <img 
                              src={family.spouse2.photo_url} 
                              alt={getFullName(family.spouse2)}
                              className="parent-photo-img"
                            />
                          ) : (
                            <div className="parent-photo-placeholder">
                              <i className="bi bi-person-circle"></i>
                            </div>
                          )}
                        </div>
                        <div className="parent-info">
                          <h5>{getFullName(family.spouse2)}</h5>
                          <p>Born: {formatDate(family.spouse2.birth_date)}</p>
                          {family.spouse2.birth_place && <p>Place: {family.spouse2.birth_place}</p>}
                          {family.spouse2.occupation && <p>Occupation: {family.spouse2.occupation}</p>}
                          <span className={`status-badge ${family.spouse2.is_living ? 'living' : 'deceased'}`}>
                            {family.spouse2.is_living ? 'Living' : 'Deceased'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {family.children.length > 0 && (
                  <div className="children-section">
                    <h4>Children ({family.children.length}):</h4>
                    <div className="children-grid">
                      {family.children.map((child) => (
                        <div key={child.id} className="child-card" onClick={() => handleMemberClick(child)} style={{ cursor: 'pointer' }}>
                          <div className="child-photo">
                            {child.photo_url ? (
                              <img 
                                src={child.photo_url} 
                                alt={getFullName(child)}
                                className="child-photo-img"
                              />
                            ) : (
                              <div className="child-photo-placeholder">
                                <i className="bi bi-person-circle"></i>
                              </div>
                            )}
                          </div>
                          <div className="child-info">
                            <h6>{getFullName(child)}</h6>
                            <p>Born: {formatDate(child.birth_date)}</p>
                            {child.birth_place && <p>Place: {child.birth_place}</p>}
                            <span className={`status-badge ${child.is_living ? 'living' : 'deceased'}`}>
                              {child.is_living ? 'Living' : 'Deceased'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeView === 'members' && (
        <div className="members-view">
          <div className="view-header">
            <div className="search-controls">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
          {familyMembers.length === 0 ? (
            <div className="no-members">
              <p>No family members added yet. Start building your family tree!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="members-table">
                <thead>
                  <tr>
                    <th></th>
                    <th 
                      onClick={() => handleSort('first_name')} 
                      onKeyDown={(e) => handleKeyboardSort(e, () => handleSort('first_name'))}
                      className="sortable"
                      tabIndex={0}
                      role="button"
                      aria-label="Sort by name"
                    >
                      Name {getSortIcon('first_name', sortConfig)}
                    </th>
                    <th 
                      onClick={() => handleSort('generation_level')} 
                      onKeyDown={(e) => handleKeyboardSort(e, () => handleSort('generation_level'))}
                      className="sortable"
                      tabIndex={0}
                      role="button"
                      aria-label="Sort by generation"
                    >
                      Generation {getSortIcon('generation_level', sortConfig)}
                    </th>
                    <th 
                      onClick={() => handleSort('birth_date')} 
                      onKeyDown={(e) => handleKeyboardSort(e, () => handleSort('birth_date'))}
                      className="sortable"
                      tabIndex={0}
                      role="button"
                      aria-label="Sort by birth date"
                    >
                      Birth Date {getSortIcon('birth_date', sortConfig)}
                    </th>
                    <th 
                      onClick={() => handleSort('birth_place')} 
                      onKeyDown={(e) => handleKeyboardSort(e, () => handleSort('birth_place'))}
                      className="sortable"
                      tabIndex={0}
                      role="button"
                      aria-label="Sort by birth place"
                    >
                      Birth Place {getSortIcon('birth_place', sortConfig)}
                    </th>
                    <th 
                      onClick={() => handleSort('is_living')} 
                      onKeyDown={(e) => handleKeyboardSort(e, () => handleSort('is_living'))}
                      className="sortable"
                      tabIndex={0}
                      role="button"
                      aria-label="Sort by status"
                    >
                      Status {getSortIcon('is_living', sortConfig)}
                    </th>
                    <th>Social Media</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="member-photo">
                          {member.photo_url ? (
                            <img 
                              src={member.photo_url} 
                              alt={`${member.first_name} ${member.last_name}`}
                              className="member-photo-img"
                            />
                          ) : (
                            <div className="member-photo-placeholder">
                              <i className="bi bi-person-circle"></i>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="member-name" onClick={() => handleMemberClick(member)} style={{ cursor: 'pointer' }}>
                          {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
                          {member.maiden_name && (
                            <div className="maiden-name">(y {member.maiden_name})</div>
                          )}
                        </div>
                      </td>
                      <td>{getGenerationLabel(member.generation_level)}</td>
                      <td>{member.birth_date ? formatDate(member.birth_date) : '-'}</td>
                      <td>{member.birth_place || '-'}</td>
                      <td>
                        <span className={`status-badge ${member.is_living ? 'living' : 'deceased'}`}>
                          {member.is_living ? 'Living' : 'Deceased'}
                        </span>
                      </td>
                      <td>
                        <div className="social-media-links">
                          {member.facebook_url && (
                            <a href={member.facebook_url} target="_blank" rel="noopener noreferrer" className="social-link facebook">
                              <i className="bi bi-facebook"></i>
                            </a>
                          )}
                          {member.twitter_url && (
                            <a href={member.twitter_url} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                              <i className="bi bi-twitter-x"></i>
                            </a>
                          )}
                          {member.instagram_url && (
                            <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                              <i className="bi bi-instagram"></i>
                            </a>
                          )}
                          {!member.facebook_url && !member.twitter_url && !member.instagram_url && '-'}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          // In guest mode, always show dash
                          if (isGuest) {
                            return '-';
                          }

                          // Check if current user is already linked to any family member
                          const userIsLinked = userLinkedMember !== null;
                          // Check if this member is already linked to the current user
                          const isUserLinkedMember = member.user_id === user?.id;
                          // Check if this member is linked to any user
                          const memberHasUser = member.user_id !== null;

                          if (isAdmin) {
                            // Admin always sees edit/delete buttons
                            return (
                              <div className="action-buttons">
                                <button
                                  className="btn-icon-edit"
                                  onClick={() => handleEditClick(member)}
                                  title="Edit member"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button
                                  className="btn-icon-delete"
                                  onClick={() => handleDeleteClick(member)}
                                  disabled={deletingMember === member.id}
                                  title="Delete member"
                                >
                                  <i className={`bi ${deletingMember === member.id ? 'bi-arrow-repeat' : 'bi-trash'}`}></i>
                                </button>
                              </div>
                            );
                          } else {
                            // Non-admin logic
                            if (isUserLinkedMember) {
                              // User can edit their own linked member
                              return (
                                <div className="action-buttons">
                                  <button
                                    className="btn-icon-edit"
                                    onClick={() => handleEditClick(member)}
                                    title="Edit your profile"
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                </div>
                              );
                            } else if (!userIsLinked && !memberHasUser) {
                              // User can link to this member if they're not linked and member is not linked
                              return (
                                <div className="action-buttons">
                                  <button
                                    className="btn-icon-link"
                                    onClick={() => handleLinkToMe(member.id)}
                                    title="Link this member to your account"
                                  >
                                    <i className="bi bi-person-plus"></i>
                                  </button>
                                </div>
                              );
                            } else {
                              // Show dash for other cases
                              return '-';
                            }
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeView === 'generations' && (
        <div className="generations-view">
          {generations.length === 0 ? (
            <div className="no-generations">
              <p>No family members added yet. Start building your family tree!</p>
            </div>
          ) : (
            <div className="generations-list">
              {generations.map((generation) => {
                const generationMembers = familyMembers.filter(member => member.generation_level === generation.generation_level);
                const searchTerm = generationSearchTerms[generation.generation_level] || '';
                const sortConfig = generationSortConfigs[generation.generation_level] || { key: null, direction: 'asc' };
                const filteredAndSortedMembers = sortMembers(filterMembers(generationMembers, searchTerm), sortConfig);
                
                return (
                  <div key={generation.generation_level} className="generation-group">
                    <div className="generation-header">
                      <h3>
                        {getGenerationLabel(generation.generation_level)} 
                        <span className="member-count">({generation.member_count} members)</span>
                      </h3>
                      <div className="search-controls">
                        <div className="search-input-group">
                          <input
                            type="text"
                            placeholder="Search this generation..."
                            value={searchTerm}
                            onChange={(e) => setGenerationSearchTerms(prev => ({
                              ...prev,
                              [generation.generation_level]: e.target.value
                            }))}
                            className="search-input"
                          />
                          {searchTerm && (
                            <button 
                              className="clear-search-btn"
                              onClick={() => setGenerationSearchTerms(prev => ({
                                ...prev,
                                [generation.generation_level]: ''
                              }))}
                              title="Clear search"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="generation-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th 
                              onClick={() => handleGenerationSort(generation.generation_level, 'first_name')} 
                              onKeyDown={(e) => handleKeyboardSort(e, () => handleGenerationSort(generation.generation_level, 'first_name'))}
                              className="sortable"
                              tabIndex={0}
                              role="button"
                              aria-label="Sort by name"
                            >
                              Name {getSortIcon('first_name', sortConfig)}
                            </th>
                            <th 
                              onClick={() => handleGenerationSort(generation.generation_level, 'birth_date')} 
                              onKeyDown={(e) => handleKeyboardSort(e, () => handleGenerationSort(generation.generation_level, 'birth_date'))}
                              className="sortable"
                              tabIndex={0}
                              role="button"
                              aria-label="Sort by birth date"
                            >
                              Birth Date {getSortIcon('birth_date', sortConfig)}
                            </th>
                            <th 
                              onClick={() => handleGenerationSort(generation.generation_level, 'birth_place')} 
                              onKeyDown={(e) => handleKeyboardSort(e, () => handleGenerationSort(generation.generation_level, 'birth_place'))}
                              className="sortable"
                              tabIndex={0}
                              role="button"
                              aria-label="Sort by birth place"
                            >
                              Birth Place {getSortIcon('birth_place', sortConfig)}
                            </th>
                            <th 
                              onClick={() => handleGenerationSort(generation.generation_level, 'is_living')} 
                              onKeyDown={(e) => handleKeyboardSort(e, () => handleGenerationSort(generation.generation_level, 'is_living'))}
                              className="sortable"
                              tabIndex={0}
                              role="button"
                              aria-label="Sort by status"
                            >
                              Status {getSortIcon('is_living', sortConfig)}
                            </th>
                            <th>Social Media</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAndSortedMembers.map(member => (
                            <tr key={member.id}>
                              <td>
                                <div className="member-photo">
                                  {member.photo_url ? (
                                    <img 
                                      src={member.photo_url} 
                                      alt={`${member.first_name} ${member.last_name}`}
                                      className="member-photo-img"
                                    />
                                  ) : (
                                    <div className="member-photo-placeholder">
                                      <i className="bi bi-person-circle"></i>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="member-name" onClick={() => handleMemberClick(member)} style={{ cursor: 'pointer' }}>
                                  {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
                                  {member.maiden_name && (
                                    <div className="maiden-name">(y {member.maiden_name})</div>
                                  )}
                                </div>
                              </td>
                              <td>{member.birth_date ? formatDate(member.birth_date) : '-'}</td>
                              <td>{member.birth_place || '-'}</td>
                              <td>
                                <span className={`status-badge ${member.is_living ? 'living' : 'deceased'}`}>
                                  {member.is_living ? 'Living' : 'Deceased'}
                                </span>
                              </td>
                              <td>
                                <div className="social-media-links">
                                  {member.facebook_url && (
                                    <a href={member.facebook_url} target="_blank" rel="noopener noreferrer" className="social-link facebook">
                                      <i className="bi bi-facebook"></i>
                                    </a>
                                  )}
                                  {member.twitter_url && (
                                    <a href={member.twitter_url} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                                      <i className="bi bi-twitter-x"></i>
                                    </a>
                                  )}
                                  {member.instagram_url && (
                                    <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                                      <i className="bi bi-instagram"></i>
                                    </a>
                                  )}
                                  {!member.facebook_url && !member.twitter_url && !member.instagram_url && '-'}
                                </div>
                              </td>
                              <td>
                                {(() => {
                                  // In guest mode, always show dash
                                  if (isGuest) {
                                    return '-';
                                  }

                                  // Check if current user is already linked to any family member
                                  const userIsLinked = userLinkedMember !== null;
                                  // Check if this member is already linked to the current user
                                  const isUserLinkedMember = member.user_id === user?.id;
                                  // Check if this member is linked to any user
                                  const memberHasUser = member.user_id !== null;

                                  if (isAdmin) {
                                    // Admin always sees edit/delete buttons
                                    return (
                                      <div className="action-buttons">
                                        <button
                                          className="btn-icon-edit"
                                          onClick={() => handleEditClick(member)}
                                          title="Edit member"
                                        >
                                          <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button
                                          className="btn-icon-delete"
                                          onClick={() => handleDeleteClick(member)}
                                          disabled={deletingMember === member.id}
                                          title="Delete member"
                                        >
                                          <i className={`bi ${deletingMember === member.id ? 'bi-arrow-repeat' : 'bi-trash'}`}></i>
                                        </button>
                                      </div>
                                    );
                                  } else {
                                    // Non-admin logic
                                    if (isUserLinkedMember) {
                                      // User can edit their own linked member
                                      return (
                                        <div className="action-buttons">
                                          <button
                                            className="btn-icon-edit"
                                            onClick={() => handleEditClick(member)}
                                            title="Edit your profile"
                                          >
                                            <i className="bi bi-pencil-square"></i>
                                          </button>
                                        </div>
                                      );
                                    } else if (!userIsLinked && !memberHasUser) {
                                      // User can link to this member if they're not linked and member is not linked
                                      return (
                                        <div className="action-buttons">
                                          <button
                                            className="btn-icon-link"
                                            onClick={() => handleLinkToMe(member.id)}
                                            title="Link this member to your account"
                                          >
                                            <i className="bi bi-person-plus"></i>
                                          </button>
                                        </div>
                                      );
                                    } else {
                                      // Show dash for other cases
                                      return '-';
                                    }
                                  }
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === 'relationships' && (
        <div className="relationships-view">
          {isAdmin ? (
            <div className="quick-actions-section">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="quick-action-btn action-btn add-relationship"
                  onClick={() => setShowRelationshipForm(true)}
                >
                  <i className="bi bi-plus-circle"></i>
                  <span>Add New Relationship</span>
                </button>
                <button 
                  className="quick-action-btn action-btn manage-relationships"
                  onClick={() => setShowRelationshipManager(true)}
                >
                  <i className="bi bi-pencil-square"></i>
                  <span>Edit Relationships</span>
                </button>
                <button 
                  className="quick-action-btn action-btn view-tree"
                  onClick={() => navigate('/family-tree')}
                >
                  <i className="bi bi-diagram-3"></i>
                  <span>View Family Tree</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="non-admin-relationships-message">
              <div className="message-content">
                <i className="bi bi-info-circle"></i>
                <div className="message-text">
                  <h3>Relationships Management</h3>
                  <p>Only administrators can add, edit, or delete family relationships. You can view family relationships in the <strong>Family View</strong> and <strong>Family Tree</strong> sections.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {deleteConfirmation.show && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete <strong>{deleteConfirmation.memberName}</strong>?</p>
            <p className="warning-text">This will also delete all relationships (marriages and parent-child) associated with this person.</p>
            <div className="confirmation-buttons">
              <button 
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deletingMember !== null}
              >
                {deletingMember !== null ? 'Deleting...' : 'Delete'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleDeleteCancel}
                disabled={deletingMember !== null}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRelationshipManager && (
        <RelationshipManager
          onClose={() => setShowRelationshipManager(false)}
          onRelationshipChanged={() => {
            fetchData();
            setShowRelationshipManager(false);
          }}
        />
      )}

      {showMemberProfile && selectedMember && (
        <div className="member-profile-overlay">
          <div className="member-profile-modal">
            <button 
              className="close-profile-btn"
              onClick={handleCloseProfile}
              title="Close profile"
            >
              <i className="bi bi-x-lg"></i>
            </button>
            
            <div className="member-profile-content">
              <div className="profile-header-section">
                <div className="profile-photo-section">
                  {selectedMember.photo_url ? (
                    <img 
                      src={selectedMember.photo_url} 
                      alt={`${selectedMember.first_name} ${selectedMember.last_name}`}
                      className="profile-photo"
                    />
                  ) : (
                    <div className="profile-photo-placeholder">
                      <i className="bi bi-person-circle"></i>
                    </div>
                  )}
                </div>
                
                <div className="profile-title-section">
                  <h1 className="profile-name">
                    {selectedMember.first_name} {selectedMember.middle_name && `${selectedMember.middle_name} `}{selectedMember.last_name}
                  </h1>
                  {selectedMember.maiden_name && (
                    <p className="maiden-name-subtitle">y {selectedMember.maiden_name}</p>
                  )}
                  <div className="profile-status">
                    <span className={`status-badge ${selectedMember.is_living ? 'living' : 'deceased'}`}>
                      {selectedMember.is_living ? 'Living' : 'Deceased'}
                    </span>
                    <span className="generation-badge">
                      {getGenerationLabel(selectedMember.generation_level)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="profile-details-grid">
                <div className="profile-section">
                  <h3>Personal Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Gender:</strong> 
                      <span>{selectedMember.gender.charAt(0).toUpperCase() + selectedMember.gender.slice(1)}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Birth Date:</strong> 
                      <span>{selectedMember.birth_date ? formatDate(selectedMember.birth_date) : 'No Information'}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Birth Place:</strong> 
                      <span>{selectedMember.birth_place || 'No Information'}</span>
                    </div>
                    {!selectedMember.is_living && (
                      <>
                        <div className="detail-item">
                          <strong>Death Date:</strong> 
                          <span>{selectedMember.death_date ? formatDate(selectedMember.death_date) : 'No Information'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Death Place:</strong> 
                          <span>{selectedMember.death_place || 'No Information'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {selectedMember.bio && (
                  <div className="profile-section">
                    <h3>Biography</h3>
                    <div className="biography-text">
                      {selectedMember.bio}
                    </div>
                  </div>
                )}

                {(selectedMember.facebook_url || selectedMember.twitter_url || selectedMember.instagram_url) && (
                  <div className="profile-section">
                    <h3>Social Media</h3>
                    <div className="social-media-profile">
                      {selectedMember.facebook_url && (
                        <a href={selectedMember.facebook_url} target="_blank" rel="noopener noreferrer" className="social-link facebook">
                          <i className="bi bi-facebook"></i>
                          <span>Facebook</span>
                        </a>
                      )}
                      {selectedMember.twitter_url && (
                        <a href={selectedMember.twitter_url} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                          <i className="bi bi-twitter-x"></i>
                          <span>Twitter/X</span>
                        </a>
                      )}
                      {selectedMember.instagram_url && (
                        <a href={selectedMember.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                          <i className="bi bi-instagram"></i>
                          <span>Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {selectedMember.notes && (
                  <div className="profile-section">
                    <h3>Notes</h3>
                    <div className="notes-text">
                      {selectedMember.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
