import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Label } from 'reactstrap';
import Select from 'react-select';
import axios from 'axios';

const JobAdsFilter = ({ filters, onApplyFilters }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allOccupations, setAllOccupations] = useState([]);
    const [filteredOccupations, setFilteredOccupations] = useState([]);
    const [selectedOccupation, setSelectedOccupation] = useState(filters.occupation || {id: "http://data.europa.eu/esco/isco/C2512", label: "Software developers"});
    const [isLoading, setIsLoading] = useState(false);
    const [dataSource, setDataSource] = useState(filters.dataSource || []);
    const [dataLimit, setDataLimit] = useState(filters.dataLimit || '1000');

    const dataSources = ['OJA', 'kariera.gr', 'kariera.fr', 'jobbguru', 'jobbguru.se', 'jobbland', 
        'jobbland.se', 'jobmedic', 'jobmedic.co.uk', 'jobscentral', 'jobs.de',
        'lesjeudis', 'lesjeudis.com', ];
    const dataSourceOptions = dataSources.map(s => ({ label: s, value: s }));

    // Occupation search
    useEffect(() => {
        const fetchOccupations = async () => {
            if (searchTerm.length === 3) {
                setIsLoading(true);
                const accumulatedOccupations = [];
                let currentPage = 1;

                try {
                    while (true) {
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

                        const occupations = response.data.items.map((o) => ({
                            label: o.label,
                            id: o.id,
                        }));
                        accumulatedOccupations.push(...occupations);
                        currentPage++;
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
        setSelectedOccupation(occupation);
        setSearchTerm('');
        setFilteredOccupations([]);
    };

    const handleApplyFilter = () => {
        // Ensure dataLimit is a multiple of 100 if a value exists
        const finalLimit = dataLimit ? Math.round(dataLimit / 100) * 100 : '';
        const filters = {
            dataSource,
            dataLimit: finalLimit,
            occupation: selectedOccupation
        };
        const activeFilterCount = [
            finalLimit,
            ...dataSource,
            selectedOccupation
        ].filter(Boolean).length;

        console.log("Applying filters:", filters);
        console.log("activeFilterCount:", activeFilterCount);
        onApplyFilters({ filters, activeFilterCount });
    };

    return (
        <Card>
            <CardBody>
                <i className="fa fa-filter"></i>
                <div style={{ marginBottom: '16px' }}>
                    <Label className="mt-2">Data Source:</Label>
                    <Select
                        isMulti
                        options={dataSourceOptions}
                        value={dataSourceOptions.filter(opt => dataSource.includes(opt.value))}
                        onChange={(selected) => setDataSource(selected.map(opt => opt.value))}
                        className="mt-1"
                        classNamePrefix="select"
                        styles={{
                            control: (provided) => ({
                                ...provided,
                                borderRadius: '4px',
                                borderColor: '#ced4da',
                                boxShadow: 'none',
                                minHeight: '38px',
                            }),
                            multiValue: (base) => ({
                                ...base,
                                backgroundColor: '#e9ecef',
                            }),
                            multiValueLabel: (base) => ({
                                ...base,
                                color: '#495057',
                            }),
                            multiValueRemove: (base) => ({
                                ...base,
                                color: '#6c757d',
                                ':hover': {
                                    backgroundColor: '#ced4da',
                                    color: '#212529',
                                },
                            }),
                        }}
                    />

                    <Label className="mt-2">Data Limit:</Label>
                    <Input
                        type="number"
                        step="100"
                        min="1000"
                        placeholder="Enter max number of results"
                        value={dataLimit}
                        onChange={(e) => setDataLimit(e.target.value)}
                    />

                    <Label className="mt-3">Occupation:</Label>
                    <div className="d-flex flex-wrap mb-2">
                        {selectedOccupation && (
                            <div
                                key={selectedOccupation.id}
                                style={{
                                    background: '#e0e0e0',
                                    borderRadius: '16px',
                                    padding: '4px 8px',
                                    marginRight: '6px',
                                    marginBottom: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {selectedOccupation.label}
                            </div>
                        )}
                    </div>

                    <Input
                        type="text"
                        placeholder="Search occupation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {isLoading && <div style={{ marginTop: '8px' }}>Loading...</div>}

                    {filteredOccupations.length > 0 && (
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                marginTop: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                backgroundColor: '#fff',
                                zIndex: 1000,
                                position: 'absolute',
                            }}
                        >
                            {filteredOccupations.map((occupation) => (
                                <li
                                    key={occupation.id}
                                    onClick={() => handleSelectOccupation(occupation)}
                                    style={{
                                        padding: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {occupation.label}
                                </li>
                            ))}
                        </ul>
                    )}

                    <Button
                        color="info"
                        className="btn-round mt-3"
                        onClick={handleApplyFilter}
                    >
                        Apply Filters
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};

export default JobAdsFilter;