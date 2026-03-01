import React, { useState } from 'react';
import { 
    Row, Col, Card, CardBody, Button, CardHeader, 
    CardTitle, Tooltip, Badge, Progress, ListGroup, ListGroupItem 
} from 'reactstrap';
import { FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const RecommendOccupation = ({ skills }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [visibleCount, setVisibleCount] = useState(5);
    const [buttonPressed, setButtonPressed] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);

    const handleApply = async () => {
        setLoading(true);
        setButtonPressed(true);
        if (skills.length === 0) {
            setData(null);
            setLoading(false);
            return;
        }
        try {
            const strippedSkills = skills.map(skill => skill.skill.label);
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_SKILLS_REQUIRED}/required_skill_recommender?matching_number=1`, //toDO: make matching_number dynamic
                { skill_list: strippedSkills }
            );
            setData(res.data);
            setVisibleCount(5);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                            <CardTitle tag="h5">Recommended Occupations</CardTitle>
                            <FaInfoCircle
                                id="recommendedOccupationInfo"
                                className="ms-2"
                                style={{ cursor: 'pointer', marginLeft:'10px' }}
                            />
                            <Tooltip
                                isOpen={tooltipOpen}
                                target="recommendedOccupationInfo"
                                toggle={() => setTooltipOpen(!tooltipOpen)}
                            >
                                This are the roles that match your skills.
                            </Tooltip>
                        </div>
                        <Button
                            className="btn-round"
                            color="info"
                            onClick={handleApply}
                            style={{marginTop: '12px'}}
                        >
                            Apply
                        </Button>
                    </CardHeader>

                    <CardBody>
                        {loading && (
                            <div className="text-center py-5">
                                <div className="spinner-border text-info" role="status"></div>
                                <p className="mt-2">Analyzing your skills...</p>
                            </div>
                        )}

                        {!loading && data && data.Results.length > 0 && (
                            <>
                                <ListGroup flush>
                                    {data.Results.slice(0, visibleCount).map((item, index) => (
                                        <ListGroupItem key={index} className="px-0 border-bottom py-3">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div style={{ flex: 1 }}>
                                                    <h6 className="mb-1 fw-bold text-primary">{item.Occupation}</h6>
                                                    
                                                    {/* Display Matched Skills */}
                                                    <div className="mb-2">
                                                        <small className="text-muted d-block mb-1">Matched skills:</small>
                                                        {data.Skills[item.Occupation]?.map((s, i) => (
                                                            <Badge key={i} color="light" pill className="text-dark border me-1">
                                                                <FaCheckCircle className="text-success me-1" size={10} />
                                                                {s}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="text-end ms-3" style={{ minWidth: '120px' }}>
                                                    <small className="text-muted">Match Score</small>
                                                    <Progress 
                                                        value={Math.min(item.Matching * 20, 100)} 
                                                        color={item.Matching > 1 ? "success" : "info"} 
                                                        style={{ height: '8px' }} 
                                                        className="mt-1"
                                                    />
                                                    <small className="fw-bold">{item.Matching.toFixed(2)}</small>
                                                </div>
                                            </div>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>

                                {visibleCount < data.Results.length && (
                                    <div className="text-center mt-3">
                                        <Button color="link" onClick={() => setVisibleCount(visibleCount + 10)}>
                                            Show More Recommendations
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {!loading && buttonPressed && (!data || data.Results.length === 0) && (
                            <div className="text-center py-4">
                                <p className="text-muted">No specific recommendations found for these skills.</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
};

export default RecommendOccupation;