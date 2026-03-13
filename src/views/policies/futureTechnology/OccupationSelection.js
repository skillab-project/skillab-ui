import React, { useState, useEffect } from 'react';
import { Row, Col, Badge } from 'reactstrap';
import axios from 'axios';

const OccupationSelection = ({ onChange, selectedValue }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allOccupations, setAllOccupations] = useState([]);
    const [filteredOccupations, setFilteredOccupations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchOccupations = async () => {
            if (searchTerm.length === 3) {
                setIsLoading(true);
                const accumulatedOccupations = [];
                let currentPage = 1;
                let hasMorePages = true;
    
                try {
                    while (hasMorePages) {
                        const response = await axios.post(
                            process.env.REACT_APP_API_URL_TRACKER + '/api/occupations',
                            new URLSearchParams({
                                'keywords': searchTerm,
                                'max_level': '3'
                            }),
                            {
                                params: { 'page': currentPage.toString() },
                                headers: {
                                    'accept': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                                },
                            }
                        );

                        if (response.data.items.length === 0) break;
    
                        const occupations = response.data.items.map((occupation) => ({
                            label: occupation.label,
                            id: occupation.id,
                        }));
                        accumulatedOccupations.push(...occupations);
                        currentPage += 1;
                    }
                    setAllOccupations(accumulatedOccupations);
                } catch (error) {
                    console.error('Error fetching occupations:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchOccupations();
    }, [searchTerm]);

    useEffect(() => {
        if (searchTerm.length >= 3 && allOccupations.length > 0) {
            setFilteredOccupations(
                allOccupations.filter((occupation) =>
                    occupation.label.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredOccupations([]);
        }
    }, [searchTerm, allOccupations]);

    const handleSelectOccupation = (occupation) => {
        onChange(occupation); // Notify parent immediately
        setSearchTerm('');
        setFilteredOccupations([]);
    };

    const handleRemoveOccupation = () => {
        onChange(null); // Clear in parent
    };

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
                {selectedValue && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#e0e0e0',
                        borderRadius: '16px',
                        padding: '4px 12px',
                    }}>
                        <span style={{ marginRight: '8px' }}>{selectedValue.label}</span>
                        <button
                            onClick={handleRemoveOccupation}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                        >
                            &times;
                        </button>
                    </div>
                )}
            </div>

            {!selectedValue && (
                <input
                    type="text"
                    placeholder="Search and select an occupation..."
                    autoComplete="off"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                    }}
                />
            )}

            {isLoading && <div style={{ fontSize: '12px', marginTop: '4px' }}>Loading...</div>}

            {filteredOccupations.length > 0 && (
                <ul style={{
                    listStyleType: 'none',
                    padding: 0,
                    margin: 0,
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    position: 'absolute',
                    background: '#fff',
                    width: '100%',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                }}>
                    {filteredOccupations.map((occ) => (
                        <li
                            key={occ.id}
                            onClick={() => handleSelectOccupation(occ)}
                            style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                            {occ.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OccupationSelection;