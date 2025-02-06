import React, { useState, useEffect } from 'react';
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button, CardSubtitle } from "reactstrap";
import axios from 'axios';

const PerOccupation = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allItems, setAllItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState({}); 

    const handleSelectItem = (selectedItem) => {
        setSelectedItem(selectedItem);
        setSearchTerm(selectedItem.label);
        setFilteredItems([]); // Clear suggestions
    };


    // Fetch items when the user types 3 or more characters
    useEffect(() => {
        const fetchItems = async () => {
            if (searchTerm.length === 3) {
                setIsLoading(true);
                const accumulatedItems = [];
                let currentPage = 1;
                let hasMorePages = true;
    
                try {
                    while (hasMorePages) {
                        var response = await axios.post(
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
                                },
                            }
                        );

                        if(response.data.items.length==0){
                            break;
                        }
    
                        const items = response.data.items.map((item) => ({
                            label: item.label,
                            id: item.id,
                        }));
                        accumulatedItems.push(...items);
                        currentPage += 1;
                    }
    
                    setAllItems(accumulatedItems);
                } catch (error) {
                    console.error('Error fetching items:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
    
        fetchItems();
    }, [searchTerm]);

    // Filter the list of itmes based on the current input
    useEffect(() => {
        if (searchTerm.length >= 3 && allItems.length > 0) {
            setFilteredItems(
                allItems.filter((item) =>
                    item.label.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredItems([]);
        }
    }, [searchTerm, allItems]);

    
    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardSubtitle style={{margin:"10px"}}>
                        <input
                            id="skill-input"
                            type="text"
                            placeholder="Select an Occupation"
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
                        {filteredItems.length > 0 && (
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
                                {filteredItems.map((item) => (
                                    <li
                                        key={item.id}
                                        onClick={() => handleSelectItem(item)}
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
                                        {item.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardSubtitle>
                    <CardBody>
                            mm
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}
export default PerOccupation;