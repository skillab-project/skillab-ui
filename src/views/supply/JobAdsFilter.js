import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button } from 'reactstrap';
import axios from 'axios';

const JobAdsFilter = ({onApplyFilters}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    
    // Handle Apply Filter Button
    const handleApplyFilter = () => {
        console.log('Applied Filters:');
        if (onApplyFilters) {
            onApplyFilters(1);
        }
    };

    return (
        <Card>
            <CardBody>
                <i className="fa fa-filter"></i>
                <div>
                    <label htmlFor="occupation-input" style={{ fontWeight: 'bold' }}>
                        time:
                    </label>
                    
                    <>time period....</>
                    
                    {isLoading && (
                        <div class="lds-dual-ring"></div>
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

export default JobAdsFilter;
