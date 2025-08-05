import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RelationshipManager.css';

interface FamilyMember {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: string;
}

interface Marriage {
  id: number;
  marriage_date?: string;
  marriage_place?: string;
  marriage_type: string;
  status: string;
  notes?: string;
  spouse1_id: number;
  spouse1_first_name: string;
  spouse1_last_name?: string;
  spouse2_id: number;
  spouse2_first_name: string;
  spouse2_last_name?: string;
}

interface ParentChildRelationship {
  type: 'parent-child';
  id: number;
  relationship_type: string;
  person1_id: number;
  person1_name: string;
  person2_id: number;
  person2_name: string;
  created_at: string;
}

interface RelationshipManagerProps {
  onClose: () => void;
  onRelationshipChanged: () => void;
}

const RelationshipManager: React.FC<RelationshipManagerProps> = ({ onClose, onRelationshipChanged }) => {
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [parentChildRels, setParentChildRels] = useState<ParentChildRelationship[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [editingMarriage, setEditingMarriage] = useState<Marriage | null>(null);
  const [editingParentChild, setEditingParentChild] = useState<ParentChildRelationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'marriages' | 'parentChild'>('marriages');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('authentication_required');
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      // Load marriages
      const marriagesResponse = await axios.get('/api/family/marriages', { headers });
      setMarriages(marriagesResponse.data);

      // Load parent-child relationships from dedicated endpoint
      const parentChildResponse = await axios.get('/api/family/relationships/parent-child', { headers });
      setParentChildRels(parentChildResponse.data);

      // Load family members for dropdowns
      const membersResponse = await axios.get('/api/family/members', { headers });
      setFamilyMembers(membersResponse.data);
    } catch (error: any) {
      console.error('❌ Error loading relationship data:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        setError('authentication_required');
      } else if (error.response?.status === 404) {
        setError('endpoints_not_found');
      } else if (error.response?.status >= 500) {
        setError('server_error');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('network_error');
      } else {
        setError('unknown_error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMarriage = async (marriageId: number) => {
    if (!window.confirm('Are you sure you want to delete this marriage? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/family/marriages/${marriageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadData();
      onRelationshipChanged();
    } catch (error) {
      console.error('Error deleting marriage:', error);
      alert('Failed to delete marriage. Please try again.');
    }
  };

  const handleDeleteParentChild = async (relationshipId: number) => {
    if (!window.confirm('Are you sure you want to delete this parent-child relationship? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/family/relationships/parent-child/${relationshipId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadData();
      onRelationshipChanged();
    } catch (error) {
      console.error('Error deleting parent-child relationship:', error);
      alert('Failed to delete relationship. Please try again.');
    }
  };

  const handleEditMarriage = async (marriage: Marriage, updatedData: Partial<Marriage>) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/family/marriages/${marriage.id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingMarriage(null);
      await loadData();
      onRelationshipChanged();
    } catch (error) {
      console.error('Error updating marriage:', error);
      alert('Failed to update marriage. Please try again.');
    }
  };

  const handleEditParentChild = async (relationship: ParentChildRelationship, updatedData: Partial<ParentChildRelationship>) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/family/relationships/parent-child/${relationship.id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingParentChild(null);
      await loadData();
      onRelationshipChanged();
    } catch (error) {
      console.error('Error updating parent-child relationship:', error);
      alert('Failed to update relationship. Please try again.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const MarriageEditForm: React.FC<{ marriage: Marriage }> = ({ marriage }) => {
    const [formData, setFormData] = useState({
      marriage_date: marriage.marriage_date ? marriage.marriage_date.split('T')[0] : '',
      marriage_place: marriage.marriage_place || '',
      marriage_type: marriage.marriage_type || 'marriage',
      status: marriage.status || 'married',
      notes: marriage.notes || ''
    });

    return (
      <div className="edit-form">
        <h4>Edit Marriage</h4>
        <div className="form-group">
          <label>Marriage Date:</label>
          <input
            type="date"
            value={formData.marriage_date}
            onChange={(e) => setFormData({ ...formData, marriage_date: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Marriage Place:</label>
          <input
            type="text"
            value={formData.marriage_place}
            onChange={(e) => setFormData({ ...formData, marriage_place: e.target.value })}
            placeholder="Marriage location"
          />
        </div>
        <div className="form-group">
          <label>Marriage Type:</label>
          <select
            value={formData.marriage_type}
            onChange={(e) => setFormData({ ...formData, marriage_type: e.target.value })}
          >
            <option value="marriage">Marriage</option>
            <option value="civil_union">Civil Union</option>
            <option value="domestic_partnership">Domestic Partnership</option>
          </select>
        </div>
        <div className="form-group">
          <label>Status:</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="separated">Separated</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>
        <div className="form-group">
          <label>Notes:</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about the marriage"
          />
        </div>
        <div className="form-actions">          <button
            className="btn btn-primary"
            onClick={() => handleEditMarriage(marriage, formData)}
            title="Save Changes"
          >
            <i className="bi bi-check"></i>
          </button>          <button
            className="btn btn-secondary"
            onClick={() => setEditingMarriage(null)}
            title="Cancel"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      </div>
    );
  };

  const ParentChildEditForm: React.FC<{ relationship: ParentChildRelationship }> = ({ relationship }) => {
    const [relationshipType, setRelationshipType] = useState(relationship.relationship_type || 'biological');

    return (
      <div className="edit-form">
        <h4>Edit Parent-Child Relationship</h4>
        <div className="form-group">
          <label>Relationship Type:</label>
          <select
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
          >
            <option value="biological">Biological</option>
            <option value="adopted">Adopted</option>
            <option value="step">Step</option>
            <option value="foster">Foster</option>
            <option value="guardian">Guardian</option>
          </select>
        </div>
        <div className="form-actions">          <button
            className="btn btn-primary"
            onClick={() => handleEditParentChild(relationship, { relationship_type: relationshipType })}
            title="Save Changes"
          >
            <i className="bi bi-check"></i>
          </button>          <button
            className="btn btn-secondary"
            onClick={() => setEditingParentChild(null)}
            title="Cancel"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="relationship-manager-overlay">
        <div className="relationship-manager">
          <div className="loading">Loading relationships...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relationship-manager-overlay">
        <div className="relationship-manager">
          <div className="relationship-manager-header">
            <h2>Manage Relationships</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="error-state">
            <div className="error-icon">
              {error === 'authentication_required' ? '🔒' : '⚠️'}
            </div>
            <h3>
              {error === 'authentication_required' 
                ? 'Authentication Required' 
                : 'Unable to Load Data'
              }
            </h3>
            <p>
              {error === 'authentication_required' 
                ? 'Please log in to view and manage family relationships.'
                : error === 'network_error'
                ? 'Network error. Please check your connection and try again.'
                : error === 'server_error'
                ? 'Server error. Please try again later.'
                : error === 'endpoints_not_found'
                ? 'Family data endpoints not found. Please contact support.'
                : 'Failed to load relationship data. Please try again.'
              }
            </p>
            {error === 'authentication_required' ? (
              <div className="error-actions">
                <button className="btn btn-primary" onClick={() => window.location.href = '/login'}>
                  Go to Login
                </button>
                <button className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={loadData}>
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relationship-manager-overlay">
      <div className="relationship-manager">
        <div className="relationship-manager-header">
          <h2>Manage Relationships</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'marriages' ? 'active' : ''}`}
            onClick={() => setActiveTab('marriages')}
          >
            Marriages ({marriages.length})
          </button>
          <button 
            className={`tab ${activeTab === 'parentChild' ? 'active' : ''}`}
            onClick={() => setActiveTab('parentChild')}
          >
            Parent-Child ({parentChildRels.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'marriages' && (
            <div className="relationships-list">
              <h3>Marriages</h3>
              {marriages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💍</div>
                  <h4>No marriages found</h4>
                  <p>Marriage relationships will appear here once they are added to your family tree.</p>
                </div>
              ) : (
                marriages.map((marriage) => (
                  <div key={marriage.id} className="relationship-item">
                    {editingMarriage?.id === marriage.id ? (
                      <MarriageEditForm marriage={marriage} />
                    ) : (
                      <>
                        <div className="relationship-info">
                          <div className="relationship-title">
                            <strong>
                              {marriage.spouse1_first_name} {marriage.spouse1_last_name} 
                              ❤️ 
                              {marriage.spouse2_first_name} {marriage.spouse2_last_name}
                            </strong>
                          </div>
                          <div className="relationship-details">
                            <span>Date: {formatDate(marriage.marriage_date)}</span>
                            {marriage.marriage_place && <span>Place: {marriage.marriage_place}</span>}
                            <span>Status: {marriage.status}</span>
                            <span>Type: {marriage.marriage_type}</span>
                          </div>
                          {marriage.notes && (
                            <div className="relationship-notes">Notes: {marriage.notes}</div>
                          )}
                        </div>
                        <div className="relationship-actions">                          <button
                            className="btn btn-icon btn-edit"
                            onClick={() => setEditingMarriage(marriage)}
                            title="Edit Marriage"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>                          <button
                            className="btn btn-icon btn-delete"
                            onClick={() => handleDeleteMarriage(marriage.id)}
                            title="Delete Marriage"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'parentChild' && (
            <div className="relationships-list">
              <h3>Parent-Child Relationships</h3>
              {parentChildRels.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👨‍👩‍👧‍👦</div>
                  <h4>No parent-child relationships found</h4>
                  <p>Parent-child relationships will appear here once they are added to your family tree.</p>
                </div>
              ) : (
                parentChildRels.map((relationship) => (
                  <div key={relationship.id} className="relationship-item">
                    {editingParentChild?.id === relationship.id ? (
                      <ParentChildEditForm relationship={relationship} />
                    ) : (
                      <>
                        <div className="relationship-info">
                          <div className="relationship-title">
                            <strong>
                              {relationship.person1_name} → {relationship.person2_name}
                            </strong>
                          </div>
                          <div className="relationship-details">
                            <span>Type: {relationship.relationship_type}</span>
                            <span>Created: {formatDate(relationship.created_at)}</span>
                          </div>
                        </div>
                        <div className="relationship-actions">                          <button
                            className="btn btn-icon btn-edit"
                            onClick={() => setEditingParentChild(relationship)}
                            title="Edit Relationship"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>                          <button
                            className="btn btn-icon btn-delete"
                            onClick={() => handleDeleteParentChild(relationship.id)}
                            title="Delete Relationship"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipManager;
