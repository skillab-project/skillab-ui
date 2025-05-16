import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button } from 'reactstrap';
import axios from 'axios';

const OccupationFilter = ({onApplyFilters}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allOccupations, setAllOccupations] = useState([]); // Holds the full list fetched from the API
    const [filteredOccupations, setFilteredOccupations] = useState([]); // Filtered Occupations for the dropdown
    const [isLoading, setIsLoading] = useState(false);
    // toDo
    //  change to [] afterwards
    const [selectedOccupations, setSelectedOccupations] = useState([{id: "http://data.europa.eu/esco/isco/C2512",
                                                                    label: "Software developers"}]);

    // Fetch Occupations when the user types 3 or more characters
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
                            process.env.REACT_APP_API_URL_TRACKER+'/api/occupations',
                            new URLSearchParams({
                                'keywords': searchTerm,
                                'max_level': '3'
                            }),
                            {
                                params: {
                                    'page': currentPage.toString(),
                                },
                                headers: {
                                    'accept': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillabTracker")}`
                                },
                            }
                        );

                        if(response.data.items.length==0){
                            break;
                        }
    
                        const occupations = response.data.items.map((occupation) => ({
                            label: occupation.label,
                            id: occupation.id,
                        }));
                        accumulatedOccupations.push(...occupations);
                        currentPage += 1;
                    }
    
                    // Update the state with all occupations
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

    // Filter the list of occupations based on the current input
    // ?just includes or we should have all?
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

    // Add a occupation to the selected list
    const handleSelectOccupation = (selectedOccupation) => {
        if (!selectedOccupations.find((occupation) => occupation.label === selectedOccupation.label)) {
            setSelectedOccupations([...selectedOccupations, selectedOccupation]);
        }
        setSearchTerm(''); // Reset the input
        setFilteredOccupations([]); // Clear suggestions
    };

    // Remove a occupation from the selected list
    const handleRemoveOccupation = (label) => {
        setSelectedOccupations(selectedOccupations.filter((occupation) => occupation.label !== label));
    };

    // Handle Apply Filter Button
    const handleApplyFilter = () => {
        console.log('Applied Filters:', selectedOccupations);
        if (onApplyFilters) {
            onApplyFilters(selectedOccupations);
        }
    };

    return (
        <Card>
            <CardBody>
                <i className="fa fa-filter"></i>
                <div>
                    <label htmlFor="occupation-input" style={{ fontWeight: 'bold' }}>
                        Occupations:
                    </label>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '8px',
                        }}
                    >
                        {selectedOccupations.map((occupation) => (
                            <div
                                key={occupation.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: '#e0e0e0',
                                    borderRadius: '16px',
                                    padding: '4px 8px',
                                }}
                            >
                                <span style={{ marginRight: '8px' }}>{occupation.label}</span>
                                <button
                                    onClick={() => handleRemoveOccupation(occupation.label)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        lineHeight: '1',
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                    <input
                        id="occupation-input"
                        type="text"
                        placeholder="Type an occupation..."
                        autocomplete="off"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginTop: '8px',
                            fontSize: '14px',
                        }}
                    />
                    {isLoading && (
                        <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                            Loading...
                        </div>
                    )}
                    {filteredOccupations.length > 0 && (
                        <ul
                            style={{
                                listStyleType: 'none',
                                padding: 0,
                                margin: 0,
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                position: 'absolute',
                                background: '#fff',
                                width: '95%',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 1000,
                            }}
                        >
                            {filteredOccupations.map((occupation) => (
                                <li
                                    key={occupation.id}
                                    onClick={() => handleSelectOccupation(occupation)}
                                    style={{
                                        padding: '10px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f0f0f0',
                                        background: '#fff',
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = '#f5f5f5')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = '#fff')
                                    }
                                >
                                    {occupation.label}
                                </li>
                            ))}
                        </ul>
                    )}
                    <Button
                        className="btn-round"
                        color="info"
                        onClick={handleApplyFilter}
                        style={{
                            marginTop: '12px'
                        }}
                    >
                        Apply Filters
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};

export default OccupationFilter;
