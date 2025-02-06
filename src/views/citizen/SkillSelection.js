import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, Input } from 'reactstrap';
import axios from 'axios';

const SkillSelection = ({onAddSkill}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allSkills, setAllSkills] = useState([]); // Holds the full list fetched from the API
    const [filteredSkills, setFilteredSkills] = useState([]); // Filtered skills for the dropdown
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState([]); 
    const [newSkill, setNewSkill] = useState('');
    const [newSkillYears, setNewSkillYears] = useState('');

    // Fetch skills when the user types 3 or more characters
    useEffect(() => {
        const fetchSkills = async () => {
            if (searchTerm.length === 3) {
                setIsLoading(true);
                const accumulatedSkills = [];
                let currentPage = 1;
                let hasMorePages = true;
    
                try {
                    while (hasMorePages) {
                        const response = await axios.post(
                            process.env.REACT_APP_API_URL_TRACKER+'/api/skills',
                            new URLSearchParams({
                                'min_skill_level': '1',
                                'keywords': searchTerm
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
    
                        const skills = response.data.items.map((skill) => ({
                            label: skill.label,
                            id: skill.id,
                        }));
                        accumulatedSkills.push(...skills);
                        currentPage += 1;
                    }
    
                    // Update the state with all skills
                    setAllSkills(accumulatedSkills);
                } catch (error) {
                    console.error('Error fetching skills:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
    
        fetchSkills();
    }, [searchTerm]);

    // Filter the list of skills based on the current input
    useEffect(() => {
        if (searchTerm.length >= 3 && allSkills.length > 0) {
            setFilteredSkills(
                allSkills.filter((skill) =>
                    skill.label.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredSkills([]);
        }
    }, [searchTerm, allSkills]);

    // Add a skill to the selected list
    const handleSelectSkill = (selectedSkill) => {
        if (!selectedSkills.find((skill) => skill.label === selectedSkill.label)) {
            setSelectedSkills([...selectedSkills, selectedSkill]);
        }
        setSearchTerm(''); // Reset the input
        setFilteredSkills([]); // Clear suggestions

        setNewSkill(selectedSkill);
    };

    // Remove a skill from the selected list
    const handleRemoveSkill = (label) => {
        setSelectedSkills(selectedSkills.filter((skill) => skill.label !== label));
    };

    // Handle new add of skill
    const handleAddSkill = () => {
        console.log('Selected Skills:', {skill:newSkill,years:newSkillYears});
        if (onAddSkill) {
            onAddSkill({skill:newSkill,years:newSkillYears});

            setNewSkill('');
            setSelectedSkills([]);
            setNewSkillYears('');
        }
    };

    return (
        <Row>
            <Col md="12">
                <Card style={{marginBottom:"5px"}}>
                    <CardBody>
                        <Row>
                            <Col md="8">
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '8px'
                                        }}
                                    >
                                        {selectedSkills.map((skill) => (
                                            <div
                                                key={skill.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    background: '#e0e0e0',
                                                    borderRadius: '16px',
                                                    padding: '4px 8px',
                                                }}
                                            >
                                                <span style={{ marginRight: '8px' }}>{skill.label}</span>
                                                <button
                                                    onClick={() => handleRemoveSkill(skill.label)}
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
                                    {selectedSkills.length==0 && (<input
                                        id="skill-input"
                                        type="text"
                                        placeholder="Type a skill..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            fontSize: '14px',
                                        }}
                                    />)}
                                    {isLoading && (
                                        <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                                            Loading...
                                        </div>
                                    )}
                                    {filteredSkills.length > 0 && (
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
                                            {filteredSkills.map((skill) => (
                                                <li
                                                    key={skill.id}
                                                    onClick={() => handleSelectSkill(skill)}
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
                                                    {skill.label}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    
                                </div>
                            </Col>
                            <Col md="4" style={{margin: "auto"}}>
                                <Input
                                    placeholder="Years"
                                    type="text"
                                    style={{textAlign:"center"}}
                                    value={newSkillYears} 
                                    onChange={(e) => setNewSkillYears(e.target.value)}
                                />
                            </Col>
                        </Row>

                        <Row>
                            <Col md="12">
                                <Button
                                        className="btn-round btn-icon"
                                        color="success"
                                        outline
                                        size="m"
                                        onClick={() => handleAddSkill()}
                                    >
                                        <i className="fa fa-plus-circle" />
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
};

export default SkillSelection;
