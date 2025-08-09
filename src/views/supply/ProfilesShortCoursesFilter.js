import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Label } from 'reactstrap';
import Select from 'react-select';

const ProfilesShortCoursesFilter = ({supply, onApplyFilters}) => {
    const [dataSource, setDataSource] = useState([]);
    const [dataLimit, setDataLimit] = useState('20000');

    // toDo Get dynamicaly?
    const dataSources = supply === "profiles"
        ? ["linkedin", "stack-biology", "stack-chemistry", "stack-earthscience", "stack-electronics",
            "stack-interpersonal", "stack-law", "stack-linguistics", "stack-literature", "stack-math",
            "stack-philosophy", "stack-physics", "stack-politics", "stack-sports", "stack-stackoverflow"]
        : supply === "courses"
        ? ["europass", "Udacity"]
        : [];

    const dataSourceOptions = dataSources.map(s => ({ label: s, value: s }));


    const handleApplyFilter = () => {
        const filters = {
            dataSource,
            dataLimit
        };
        const activeFilterCount = [
            dataLimit,
            ...dataSource,
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
                        placeholder="Enter max number of results"
                        value={dataLimit}
                        onChange={(e) => setDataLimit(e.target.value)}
                    />

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

export default ProfilesShortCoursesFilter;
