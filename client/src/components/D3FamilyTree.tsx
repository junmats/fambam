import React, { useState, useEffect } from 'react';
import Tree from 'react-d3-tree';
import './D3FamilyTree.css';

interface TreeNode {
  name: string;
  attributes?: {
    birth_date?: string;
    death_date?: string;
    occupation?: string;
    is_living?: boolean;
    spouse_name?: string;
    spouse_birth?: string;
    spouse_living?: boolean;
    marriage_date?: string;
    person_id?: number;
    married_to?: string;
    photo_url?: string;
    spouse_photo_url?: string;
  };
  children?: TreeNode[];
}

interface D3FamilyTreeProps {
  hierarchyData: any;
}

interface NavigationState {
  searchTerm: string;
  selectedGeneration: number | null;
  zoom: number;
  showSearch: boolean;
  showMinimap: boolean;
}

const D3FamilyTree: React.FC<D3FamilyTreeProps> = ({ hierarchyData }) => {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [navigation, setNavigation] = useState<NavigationState>({
    searchTerm: '',
    selectedGeneration: null,
    zoom: 1,
    showSearch: false,
    showMinimap: false
  });
  const [searchResults, setSearchResults] = useState<TreeNode[]>([]);
  const [allNodes, setAllNodes] = useState<TreeNode[]>([]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setTranslate({
      x: width / 2,
      y: 100  // Start closer to the top
    });
  }, []);

  useEffect(() => {
    if (hierarchyData) {
      console.log('🌳 Raw hierarchy data:', hierarchyData);
      const convertedData = convertToD3Format(hierarchyData);
      setTreeData(convertedData);
      // Extract all nodes for search functionality
      const nodes = extractAllNodes(convertedData);
      setAllNodes(nodes);
    }
  }, [hierarchyData]);

  // Extract all nodes from tree for search functionality
  const extractAllNodes = (node: TreeNode): TreeNode[] => {
    const nodes: TreeNode[] = [node];
    if (node.children) {
      node.children.forEach(child => {
        nodes.push(...extractAllNodes(child));
      });
    }
    return nodes;
  };

  // Search functionality
  const handleSearch = (searchTerm: string) => {
    setNavigation(prev => ({ ...prev, searchTerm }));
    
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const results = allNodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.attributes?.spouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.attributes?.occupation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(results);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setNavigation(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 3) }));
  };

  const handleZoomOut = () => {
    setNavigation(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.3) }));
  };

  const handleZoomReset = () => {
    setNavigation(prev => ({ ...prev, zoom: 1 }));
  };

  // Center on specific node
  const centerOnNode = (node: TreeNode) => {
    // Close the search panel
    setNavigation(prev => ({ ...prev, showSearch: false, searchTerm: '' }));
    setSearchResults([]);
    
    // For demonstration, center on the tree root
    // In a real implementation, you would calculate the exact position of the selected node
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Center the tree view
    setTranslate({ x: width / 2, y: height / 4 });
    
    // Set zoom to a reasonable level to see the node
    setNavigation(prev => ({ ...prev, zoom: 1.2 }));
  };

  // Recursive function to add descendants to a person
  const addDescendants = (personId: number, allGenerations: any[]): TreeNode[] => {
    const descendants: TreeNode[] = [];
    
    allGenerations.forEach((generation: any) => {
      generation.members.forEach((member: any) => {
        if (member.parents && member.parents.some((p: any) => p.id === personId)) {
          if (member.type === 'couple') {
            // Handle married couple
            const coupleNode: TreeNode = {
              name: `${member.spouse1.first_name} ${member.spouse1.last_name || ''}`.trim(),
              attributes: {
                birth_date: member.spouse1.birth_date,
                death_date: member.spouse1.death_date,
                occupation: member.spouse1.occupation,
                is_living: member.spouse1.is_living,
                person_id: member.spouse1.id,
                photo_url: member.spouse1.photo_url,
                spouse_name: `${member.spouse2.first_name} ${member.spouse2.last_name || ''}`.trim(),
                spouse_birth: member.spouse2.birth_date,
                spouse_living: member.spouse2.is_living,
                spouse_photo_url: member.spouse2.photo_url,
                marriage_date: member.marriageInfo?.marriage_date,
                married_to: member.spouse2.first_name
              },
              children: []
            };
            
            // Recursively add their descendants
            coupleNode.children = addDescendants(member.spouse1.id, allGenerations);
            descendants.push(coupleNode);
          } else {
            // Handle individual
            const individualNode: TreeNode = {
              name: `${member.first_name} ${member.last_name || ''}`.trim(),
              attributes: {
                birth_date: member.birth_date,
                death_date: member.death_date,
                occupation: member.occupation,
                is_living: member.is_living,
                person_id: member.id,
                photo_url: member.photo_url
              },
              children: []
            };
            
            // Recursively add their descendants
            individualNode.children = addDescendants(member.id, allGenerations);
            descendants.push(individualNode);
          }
        }
      });
    });
    
    return descendants;
  };

  const convertToD3Format = (data: any): TreeNode => {
    if (!data.rootCouple) {
      return { name: 'No family data available', children: [] };
    }

    console.log('🔍 D3 CONVERSION DEBUG:');
    console.log('  Root couple data received:', data.rootCouple);
    console.log('  Spouse1 photo URL:', data.rootCouple.spouse1.photo_url);
    console.log('  Spouse2 photo URL:', data.rootCouple.spouse2.photo_url);

    // Create root couple as a single node with spouse information
    const rootCoupleNode: TreeNode = {
      name: `${data.rootCouple.spouse1.first_name} ${data.rootCouple.spouse1.last_name || ''}`.trim(),
      attributes: {
        birth_date: data.rootCouple.spouse1.birth_date,
        death_date: data.rootCouple.spouse1.death_date,
        occupation: data.rootCouple.spouse1.occupation,
        is_living: data.rootCouple.spouse1.is_living,
        person_id: data.rootCouple.spouse1.id,
        photo_url: data.rootCouple.spouse1.photo_url,
        spouse_name: `${data.rootCouple.spouse2.first_name} ${data.rootCouple.spouse2.last_name || ''}`.trim(),
        spouse_birth: data.rootCouple.spouse2.birth_date,
        spouse_living: data.rootCouple.spouse2.is_living,
        spouse_photo_url: data.rootCouple.spouse2.photo_url,
        marriage_date: data.rootCouple.marriageInfo?.marriage_date,
        married_to: data.rootCouple.spouse2.first_name
      },
      children: []
    };

    console.log('🔍 ROOT NODE CREATED:');
    console.log('  Main person photo_url:', rootCoupleNode.attributes?.photo_url);
    console.log('  Spouse photo_url:', rootCoupleNode.attributes?.spouse_photo_url);

    // Process children and all descendants recursively
    const childrenNodes: TreeNode[] = [];
    if (data.childrenRow) {
      data.childrenRow.forEach((child: any) => {
        if (child.type === 'couple') {
          // Married couple in children row
          const biologicalChild = child.spouse1;
          const marriedInSpouse = child.spouse2;
          
          const coupleNode: TreeNode = {
            name: `${biologicalChild.first_name} ${biologicalChild.last_name || ''}`.trim(),
            attributes: {
              birth_date: biologicalChild.birth_date,
              death_date: biologicalChild.death_date,
              occupation: biologicalChild.occupation,
              is_living: biologicalChild.is_living,
              person_id: biologicalChild.id,
              photo_url: biologicalChild.photo_url,
              spouse_name: `${marriedInSpouse.first_name} ${marriedInSpouse.last_name || ''}`.trim(),
              spouse_birth: marriedInSpouse.birth_date,
              spouse_living: marriedInSpouse.is_living,
              spouse_photo_url: marriedInSpouse.photo_url,
              marriage_date: child.marriageInfo?.marriage_date,
              married_to: marriedInSpouse.first_name
            },
            children: []
          };
          
          // Add descendants recursively
          const allGenerations = data.additionalGenerations || [];
          coupleNode.children = addDescendants(biologicalChild.id, allGenerations);
          
          childrenNodes.push(coupleNode);
        } else if (child.member && child.isOriginalChild) {
          // Single child
          const singleChildNode: TreeNode = {
            name: `${child.member.first_name} ${child.member.last_name || ''}`.trim(),
            attributes: {
              birth_date: child.member.birth_date,
              death_date: child.member.death_date,
              occupation: child.member.occupation,
              is_living: child.member.is_living,
              person_id: child.member.id,
              photo_url: child.member.photo_url
            },
            children: []
          };
          
          // Add descendants recursively
          const allGenerations = data.additionalGenerations || [];
          singleChildNode.children = addDescendants(child.member.id, allGenerations);
          
          childrenNodes.push(singleChildNode);
        }
      });
    }

    // Add children directly to the root couple node
    rootCoupleNode.children = childrenNodes;

    return rootCoupleNode;
  };

  const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
    const isSpouse = nodeDatum.attributes?.married_to;
    const spouseName = nodeDatum.attributes?.spouse_name;
    const marriageDate = nodeDatum.attributes?.marriage_date;
    const isLiving = nodeDatum.attributes?.is_living;
    const spouseLiving = nodeDatum.attributes?.spouse_living;
    const photoUrl = nodeDatum.attributes?.photo_url;
    const spousePhotoUrl = nodeDatum.attributes?.spouse_photo_url;

    return (
      <g>
        {/* Main node rectangle - Adjusted for photos */}
        <rect
          width="280"
          height={spouseName ? "140" : "90"}
          x="-140"
          y={spouseName ? "-70" : "-45"}
          fill={isLiving ? "#ffffff" : "#f0f2f5"}
          stroke={isSpouse ? "#e91e63" : isLiving ? "#1877f2" : "#ced0d4"}
          strokeWidth="3"
          rx="12"
          ry="12"
          onClick={toggleNode}
          style={{ cursor: 'pointer' }}
          className={isLiving ? "node-living" : "node-deceased"}
        />
        
        {/* Main person photo */}
        <g>
          {photoUrl ? (
            <foreignObject x="-125" y={spouseName ? "-55" : "-20"} width="40" height="40">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid var(--facebook-border)'
              }}>
                <img 
                  src={photoUrl}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </foreignObject>
          ) : (
            <circle
              cx="-105"
              cy={spouseName ? "-35" : "0"}
              r="20"
              fill="var(--facebook-light-gray)"
              stroke="var(--facebook-border)"
              strokeWidth="2"
            />
          )}
          {!photoUrl && (
            <foreignObject x="-115" y={spouseName ? "-45" : "-10"} width="20" height="20">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '20px',
                color: 'var(--facebook-gray)',
                height: '20px'
              }}>
                <i className="bi bi-person-circle"></i>
              </div>
            </foreignObject>
          )}
        </g>

        {/* Spouse photo (if married) */}
        {spouseName && (
          <g>
            {spousePhotoUrl ? (
              <foreignObject x="-125" y="15" width="40" height="40">
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--facebook-border)'
                }}>
                  <img 
                    src={spousePhotoUrl}
                    alt="Spouse Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </foreignObject>
            ) : (
              <circle
                cx="-105"
                cy="35"
                r="20"
                fill="var(--facebook-light-gray)"
                stroke="var(--facebook-border)"
                strokeWidth="2"
              />
            )}
            {!spousePhotoUrl && (
              <foreignObject x="-115" y="25" width="20" height="20">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'var(--facebook-gray)',
                  height: '20px'
                }}>
                  <i className="bi bi-person-circle"></i>
                </div>
              </foreignObject>
            )}
          </g>
        )}
        
        {/* Person name and status icon aligned horizontally */}
        <g>
          {/* Person name - adjusted position for photos */}
          <text 
            x="10" 
            y={spouseName ? "-35" : "0"} 
            textAnchor="middle" 
            dominantBaseline="central"
            className="node-name"
            fill={isLiving ? '#1877f2' : '#65676b'}
          >
            {nodeDatum.name}
          </text>
          
          {/* Living/Deceased status icon - Adjusted position */}
          <foreignObject x={nodeDatum.name.length * 3 + 40} y={spouseName ? "-40" : "-6"} width="16" height="16">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '16px',
              color: isLiving ? '#2e7d2e' : '#d32f2f',
              height: '16px',
              transform: 'translateY(0px)'
            }}>
              <i className={`bi ${isLiving ? 'bi-heart-pulse-fill' : 'bi-x-circle-fill'}`}></i>
            </div>
          </foreignObject>
        </g>
        
        {/* Spouse information with heart and date in between */}
        {spouseName && (
          <>
            {/* Marriage info line - heart and date with proper spacing */}
            <g>
              {/* Marriage heart icon - centered baseline */}
              <foreignObject x="-20" y="-5" width="14" height="14">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#e91e63',
                  height: '14px',
                  transform: 'translateY(0px)'
                }}>
                  <i className="bi bi-heart-fill"></i>
                </div>
              </foreignObject>
              
              {/* Marriage date with proper alignment */}
              {marriageDate && (
                <text 
                  x="0" 
                  y="1" 
                  textAnchor="start" 
                  dominantBaseline="central"
                  className="node-marriage-date" 
                  fontSize="14"
                >
                  {new Date(marriageDate).getFullYear()}
                </text>
              )}
            </g>
            
            {/* Spouse name and status icon aligned horizontally */}
            <g>
              {/* Spouse name - centered with proper baseline */}
              <text 
                x="10" 
                y="35" 
                textAnchor="middle" 
                dominantBaseline="central"
                className="node-spouse"
                fill={spouseLiving ? '#1877f2' : '#65676b'}
              >
                {spouseName}
              </text>
              
              {/* Spouse status icon - Perfectly aligned with text center */}
              <foreignObject x={spouseName.length * 3 + 30} y="29" width="16" height="16">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: spouseLiving ? '#2e7d2e' : '#d32f2f',
                  height: '16px',
                  transform: 'translateY(0px)'
                }}>
                  <i className={`bi ${spouseLiving ? 'bi-heart-pulse-fill' : 'bi-x-circle-fill'}`}></i>
                </div>
              </foreignObject>
            </g>
          </>
        )}
        
        {/* Expand/collapse indicator - Bottom right corner with different icon */}
        {nodeDatum.children && nodeDatum.children.length > 0 && (
          <foreignObject x="95" y={spouseName ? "45" : "20"} width="20" height="20">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '16px',
              color: '#1877f2',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              border: '2px solid #1877f2',
              width: '20px',
              height: '20px'
            }}
            onClick={toggleNode}
            >
              <i className="bi bi-chevron-down"></i>
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  if (!treeData) {
    return <div className="family-tree-loading">Loading family tree...</div>;
  }

  return (
    <div className="family-tree-container" style={{ width: '100%', height: '100vh', overflow: 'auto', position: 'relative' }}>
      
      {/* Navigation Controls */}
      <div className="family-tree-nav">
        
        {/* Search and Zoom Controls Combined */}
        <div className="nav-controls-container">
          
          {/* Search Section */}
          <div className="search-section">
            {/* <button
              className="nav-btn search-toggle"
              onClick={() => setNavigation(prev => ({ ...prev, showSearch: !prev.showSearch }))}
              title="Search Family Members"
            >
              <i className="bi bi-search"></i>
            </button> */}

            {/* Search Panel */}
            {navigation.showSearch && (
              <div className="search-panel">
                <div className="search-input-container">
                  <input
                    type="text"
                    placeholder="Search family members..."
                    value={navigation.searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                    autoFocus
                  />
                  <i className="bi bi-search search-input-icon"></i>
                  <button
                    className="search-close-btn"
                    onClick={() => setNavigation(prev => ({ ...prev, showSearch: false, searchTerm: '' }))}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((node, index) => (
                      <div
                        key={index}
                        className="search-result-item"
                        onClick={() => centerOnNode(node)}
                      >
                        <div className="search-result-name">{node.name}</div>
                        {node.attributes?.spouse_name && (
                          <div className="search-result-spouse">
                            Married to {node.attributes.spouse_name}
                          </div>
                        )}
                        {node.attributes?.occupation && (
                          <div className="search-result-occupation">
                            {node.attributes.occupation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Tree
        data={treeData}
        translate={translate}
        orientation="vertical"
        pathFunc="elbow"
        renderCustomNodeElement={renderCustomNode}
        separation={{ siblings: 1.8, nonSiblings: 2 }}
        nodeSize={{ x: 300, y: 180 }}
        zoom={navigation.zoom}
        enableLegacyTransitions={false}
        collapsible={true}
        initialDepth={3}
        dimensions={{ width: window.innerWidth, height: window.innerHeight }}
        scaleExtent={{ min: 0.2, max: 3 }}
        shouldCollapseNeighborNodes={false}
      />
    </div>
  );
};

export default D3FamilyTree;
