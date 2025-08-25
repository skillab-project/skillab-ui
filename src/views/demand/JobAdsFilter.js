import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Label } from 'reactstrap';
import Select from 'react-select';
import axios from 'axios';

const JobAdsFilter = ({ onApplyFilters }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allOccupations, setAllOccupations] = useState([]);
    const [filteredOccupations, setFilteredOccupations] = useState([]);
    const [selectedOccupations, setSelectedOccupations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');
    const [dataSource, setDataSource] = useState([]);
    const [dataLimit, setDataLimit] = useState('20000');
    const [dateError, setDateError] = useState('');

    const dataSources = ['OJA', 'kariera.gr', 'kariera.fr', 'jobbguru', 'jobbguru.se', 'jobbland', 
        'jobbland.se', 'jobmedic', 'jobmedic.co.uk', 'jobscentral', 'jobs.de',
        'lesjeudis', 'lesjeudis.com', ]; // Get dynamicaly?
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
        if (!selectedOccupations.find((o) => o.id === occupation.id)) {
            setSelectedOccupations([...selectedOccupations, occupation]);
        }
        setSearchTerm('');
        setFilteredOccupations([]);
    };

    const handleRemoveOccupation = (id) => {
        setSelectedOccupations(selectedOccupations.filter((o) => o.id !== id));
    };

    const handleApplyFilter = () => {
        // --- Date Validation ---
        if (minDate && maxDate && new Date(maxDate) < new Date(minDate)) {
            setDateError('Max Date cannot be earlier than Min Date.');
            return;
        }
        setDateError('');

        const filters = {
            minDate,
            maxDate,
            dataSource,
            dataLimit,
            occupations: selectedOccupations
        };
        const activeFilterCount = [
            minDate,
            maxDate,
            dataLimit,
            ...dataSource,
            ...selectedOccupations
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
                    <Label>Min Date:</Label>
                    <Input type="date" value={minDate} onChange={(e) => setMinDate(e.target.value)} />

                    <Label className="mt-2">Max Date:</Label>
                    <Input type="date" value={maxDate} onChange={(e) => setMaxDate(e.target.value)} />

                    {/* Display validation error message here */}
                    {dateError && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>
                            {dateError}
                        </div>
                    )}

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
                        placeholder="Enter max number of results"
                        value={dataLimit}
                        onChange={(e) => setDataLimit(e.target.value)}
                    />

                    <Label className="mt-3">Occupations:</Label>
                    <div className="d-flex flex-wrap mb-2">
                        {selectedOccupations.map((occupation) => (
                            <div
                                key={occupation.id}
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
                                {occupation.label}
                                <button
                                    onClick={() => handleRemoveOccupation(occupation.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        marginLeft: '6px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
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