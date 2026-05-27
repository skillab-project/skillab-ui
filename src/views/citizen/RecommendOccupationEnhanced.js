import React, { useState } from 'react';
import {
    Row, Col, Card, CardBody, Button, CardHeader,
    CardTitle, Tooltip, Badge, Progress, Table, Input
} from 'reactstrap';
import { FaInfoCircle, FaCheckCircle, FaSearch, FaLightbulb } from 'react-icons/fa';
import axios from 'axios';

/**
 * RecommendOccupationEnhanced
 * ---------------------------
 * "Discover roles" panel — independent of the target occupation. Calls
 * required_skill_recommender to surface occupations that match the user's
 * current skills, and presents them with a richer visual treatment than
 * the original list view.
 */
const RecommendOccupationEnhanced = ({ skills }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [visibleCount, setVisibleCount] = useState(8);
    const [buttonPressed, setButtonPressed] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [matchingNumber, setMatchingNumber] = useState(1);

    const handleApply = async () => {
        setLoading(true);
        setButtonPressed(true);
        if (!skills || skills.length === 0) {
            setData(null);
            setLoading(false);
            return;
        }
        try {
            const strippedSkills = skills.map(s => s.skill.label);
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_SKILLS_DIVERSITY}/required_skill_recommender?matching_number=${matchingNumber}`,
                { skill_list: strippedSkills }
            );
            setData(res.data);
            setVisibleCount(8);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        } finally {
            setLoading(false);
        }
    };

    const results = data?.Results || [];
    const filtered = results.filter(r => r.Occupation.toLowerCase().includes(search.toLowerCase()));

    // Color tier based on matching score
    const tierFor = (m) => {
        if (m >= 3) return { color: '#10b981', label: 'STRONG', bg: '#dcfce7', fg: '#166534' };
        if (m >= 2) return { color: '#3b82f6', label: 'GOOD',   bg: '#dbeafe', fg: '#1e40af' };
        if (m >= 1) return { color: '#f59e0b', label: 'FAIR',   bg: '#fef3c7', fg: '#92400e' };
        return         { color: '#9ca3af', label: 'WEAK',     bg: '#f3f4f6', fg: '#374151' };
    };

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CardTitle tag="h5">
                                <FaLightbulb style={{ marginRight: 8, color: '#f59e0b' }} />
                                Discover Roles That Match Your Skills
                            </CardTitle>
                            <FaInfoCircle
                                id="recommendedOccupationInfoEnhanced"
                                className="ms-2"
                                style={{ cursor: 'pointer', marginLeft: '10px' }}
                            />
                            <Tooltip
                                isOpen={tooltipOpen}
                                target="recommendedOccupationInfoEnhanced"
                                toggle={() => setTooltipOpen(!tooltipOpen)}
                            >
                                Occupations whose required skills overlap with yours, ranked by match strength.
                            </Tooltip>
                        </div>

                        <Row style={{ marginTop: '12px', alignItems: 'center' }}>
                            <Col md="4">
                                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                                    Minimum matched skills
                                </label>
                                <Input type="number" min="1" max="20" value={matchingNumber}
                                       bsSize="sm"
                                       onChange={(e) => setMatchingNumber(parseInt(e.target.value, 10) || 1)}
                                       style={{ maxWidth: '120px' }} />
                            </Col>
                            <Col md="8" className="text-right">
                                <Button className="btn-round" color="info" onClick={handleApply} disabled={loading}>
                                    {loading ? 'Analyzing…' : 'Apply'}
                                </Button>
                            </Col>
                        </Row>
                    </CardHeader>

                    <CardBody>
                        {loading && (
                            <div className="text-center py-5">
                                <div className="lds-dual-ring" />
                                <p className="mt-2 text-muted">Analyzing your skills…</p>
                            </div>
                        )}

                        {!loading && results.length > 0 && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                        Showing <strong>{Math.min(visibleCount, filtered.length)}</strong> of{' '}
                                        <strong>{filtered.length}</strong> matches
                                    </div>
                                    <div style={{ position: 'relative', maxWidth: '260px', width: '100%' }}>
                                        <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '12px' }} />
                                        <Input type="text" placeholder="Search by role…" value={search}
                                               onChange={(e) => setSearch(e.target.value)}
                                               style={{ paddingLeft: '30px', fontSize: '13px' }} bsSize="sm" />
                                    </div>
                                </div>

                                <Row>
                                    {filtered.slice(0, visibleCount).map((item, index) => {
                                        const t = tierFor(item.Matching);
                                        const matchedSkills = data.Skills[item.Occupation] || [];
                                        return (
                                            <Col md="6" lg="4" key={index} style={{ marginBottom: '14px' }}>
                                                <Card style={{
                                                    height: '100%',
                                                    borderTop: `3px solid ${t.color}`,
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                                }}>
                                                    <CardBody>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                            <h6 style={{ margin: 0, color: '#1f2937', fontWeight: 600, lineHeight: 1.3 }}>
                                                                {item.Occupation}
                                                            </h6>
                                                            <Badge style={{
                                                                background: t.bg, color: t.fg,
                                                                fontWeight: 700, fontSize: '10px',
                                                                padding: '4px 8px', whiteSpace: 'nowrap', marginLeft: '6px',
                                                            }} pill>{t.label}</Badge>
                                                        </div>

                                                        <div style={{ marginBottom: '10px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>
                                                                <span>Match score</span>
                                                                <span style={{ fontWeight: 600, color: t.color }}>{item.Matching.toFixed(2)}</span>
                                                            </div>
                                                            <Progress value={Math.min(item.Matching * 20, 100)}
                                                                      style={{ height: '6px', background: '#f3f4f6' }}>
                                                                <div style={{
                                                                    width: `${Math.min(item.Matching * 20, 100)}%`,
                                                                    background: t.color, height: '100%',
                                                                }} />
                                                            </Progress>
                                                        </div>

                                                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
                                                            Matched skills ({matchedSkills.length})
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                            {matchedSkills.slice(0, 6).map((s, i) => (
                                                                <Badge key={i} style={{
                                                                    background: '#f9fafb', color: '#374151',
                                                                    border: '1px solid #e5e7eb', fontWeight: 400,
                                                                    fontSize: '10px', padding: '3px 6px',
                                                                }} pill>
                                                                    <FaCheckCircle style={{ color: t.color, fontSize: '9px', marginRight: '3px' }} />
                                                                    {s}
                                                                </Badge>
                                                            ))}
                                                            {matchedSkills.length > 6 && (
                                                                <Badge style={{
                                                                    background: '#f3f4f6', color: '#6b7280',
                                                                    fontWeight: 600, fontSize: '10px', padding: '3px 6px',
                                                                }} pill>+{matchedSkills.length - 6}</Badge>
                                                            )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>

                                {visibleCount < filtered.length && (
                                    <div className="text-center mt-3">
                                        <Button color="link" onClick={() => setVisibleCount(visibleCount + 12)}>
                                            Show More Recommendations
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {!loading && buttonPressed && (!results || results.length === 0) && (
                            <div className="text-center py-4">
                                <p className="text-muted">No specific recommendations found for these skills.</p>
                            </div>
                        )}

                        {!loading && !buttonPressed && (
                            <div className="text-center py-4 text-muted">
                                <FaLightbulb style={{ fontSize: '32px', marginBottom: '8px', color: '#fbbf24' }} />
                                <p style={{ margin: 0 }}>Click <strong>Apply</strong> to discover roles that fit your skill set.</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
};

export default RecommendOccupationEnhanced;
