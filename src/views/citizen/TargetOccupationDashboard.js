import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Row, Col, Card, CardBody, CardHeader, CardTitle, Button,
    Tooltip, Badge, Progress, Table, Nav, NavItem, NavLink,
    TabContent, TabPane, Input
} from 'reactstrap';
import { FaInfoCircle, FaTrophy, FaCrown, FaChartLine, FaGraduationCap, FaCompass, FaSearch, FaChartBar } from 'react-icons/fa';
// import OccupationSelection from './OccupationSelection'; // disabled for testing — using plain text input
import "../../assets/css/loader.css";
import axios from 'axios';

/**
 * TargetOccupationDashboard
 * -------------------------
 * Comprehensive dashboard for a citizen's target occupation, powered by the
 * diversity-analysis micro-services:
 *   - fit_score_calculation_service
 *   - skill_profile_radar_data
 *   - missing_skills
 *   - skill_learning_lader
 *   - alternative_careers
 *   - Transferable_skills
 *
 * Upskilling for missing skills reuses the existing courses + universities
 * services (REACT_APP_API_URL_TRACKER + REACT_APP_API_URL_CURRICULUM_SKILLS).
 */

const TIER_COLORS = {
    Novice:       { bg: '#fef3c7', fg: '#92400e', accent: '#f59e0b' },
    Intermediate: { bg: '#dbeafe', fg: '#1e40af', accent: '#3b82f6' },
    Advanced:     { bg: '#dcfce7', fg: '#166534', accent: '#22c55e' },
    Elite:        { bg: '#ede9fe', fg: '#5b21b6', accent: '#8b5cf6' },
};

const PRIORITY_COLORS = {
    High:     { bg: '#fee2e2', fg: '#991b1b', bar: '#ef4444' },
    Moderate: { bg: '#fef3c7', fg: '#92400e', bar: '#f59e0b' },
    Low:      { bg: '#dcfce7', fg: '#166534', bar: '#22c55e' },
};

const PILLAR_LABEL = { K: 'Knowledge', T: 'Transversal', L: 'Language', S: 'Skill' };

const TargetOccupationDashboard = ({ skills }) => {
    // -- selection / loading state -----------------------------------------
    const [selectedOccupation, setSelectedOccupation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // -- service responses --------------------------------------------------
    const [fitData, setFitData] = useState(null);            // fit_score_calculation_service
    const [radarData, setRadarData] = useState([]);          // skill_profile_radar_data
    const [missing, setMissing] = useState(null);            // missing_skills
    const [ladder, setLadder] = useState([]);                // skill_learning_lader
    const [altCareers, setAltCareers] = useState([]);        // alternative_careers
    const [transferable, setTransferable] = useState(null);  // Transferable_skills
    const [contribution, setContribution] = useState([]);    // skill_contribution (skills the user has)
    const [mocgData, setMocgData] = useState([]);            // mocg (skills the user doesn't have)
    const [mocgLearning, setMocgLearning] = useState([]);    // mocg_learning_opportunities

    // -- drill-down for a missing skill ------------------------------------
    const [selectedGapSkill, setSelectedGapSkill] = useState(null);
    const [institutes, setInstitutes] = useState([]);
    const [selectedInstitute, setSelectedInstitute] = useState(null);
    const [coursesForUpskilling, setCoursesForUpskilling] = useState([]);
    const [loadingUpskill, setLoadingUpskill] = useState(false);

    // -- tooltip ------------------------------------------------------------
    const [tooltipOpen, setTooltipOpen] = useState(false);

    // -- table filters ------------------------------------------------------
    const [skillGapSearch, setSkillGapSearch] = useState('');
    const [knowledgeGapSearch, setKnowledgeGapSearch] = useState('');
    const [roadmapSearch, setRoadmapSearch] = useState('');
    const [careerSearch, setCareerSearch] = useState('');

    // -- TESTING: plain text input for the target occupation ---------------
    const [testOccupationInput, setTestOccupationInput] = useState('software developer');

    // -- Auto-scroll to the upskilling drill-down when a skill is selected -
    const drillDownRef = useRef(null);
    useEffect(() => {
        if (selectedGapSkill && drillDownRef.current) {
            // Small delay so the panel has time to mount before we scroll.
            setTimeout(() => {
                drillDownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
        }
    }, [selectedGapSkill]);

    // ----------------------------------------------------------------------
    //  Trigger: occupation selected
    // ----------------------------------------------------------------------
    const handleApplyOccupationSelection = (selectedArr) => {
        const occ = selectedArr[0];
        setSelectedOccupation(occ);
        setSelectedGapSkill(null);
        setInstitutes([]);
        setSelectedInstitute(null);
        setCoursesForUpskilling([]);
        fetchAllAnalyses(occ.label);
    };

    // TESTING handler — wraps the plain string into the same shape the
    // original OccupationSelection callback produced.
    const handleApplyTestOccupation = () => {
        const label = testOccupationInput.trim();
        if (!label) return;
        handleApplyOccupationSelection([{ id: `test-${label}`, label }]);
    };

    // ----------------------------------------------------------------------
    //  Re-fetch if skills change while an occupation is already chosen
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (selectedOccupation && skills) {
            fetchAllAnalyses(selectedOccupation.label);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skills]);

    const fetchAllAnalyses = async (occupationLabel) => {
        setLoading(true);
        const candidate_skills = (skills || []).map(s => s.skill.id);
        const body = { candidate_skills };
        const base = process.env.REACT_APP_API_URL_SKILLS_DIVERSITY;
        const url  = (endpoint) =>
            `${base}/${endpoint}?occupation_name=${encodeURIComponent(occupationLabel)}`;

        try {
            const [fit, radar, miss, lad, alt, trans, contrib, mocg, mocgLearn] = await Promise.allSettled([
                axios.post(url('fit_score_calculation_service'), body),
                axios.post(url('skill_profile_radar_data'),       body),
                axios.post(url('missing_skills'),                 body),
                axios.post(url('skill_learning_lader'),           body),
                axios.post(url('alternative_careers'),            body),
                axios.post(url('Transferable_skills'),            body),
                axios.post(url('skill_contribution'),             body),
                axios.post(url('mocg'),                           body),
                axios.post(url('mocg_learning_opportunities'),    body),
            ]);

            if (fit.status   === 'fulfilled') setFitData(fit.value.data);
            if (radar.status === 'fulfilled') setRadarData(radar.value.data?.data || []);
            if (miss.status  === 'fulfilled') setMissing(miss.value.data);
            if (lad.status   === 'fulfilled') setLadder(lad.value.data?.['Skill.Learning'] || []);
            if (alt.status   === 'fulfilled') setAltCareers(alt.value.data?.['alternative.careers'] || []);
            if (trans.status === 'fulfilled') setTransferable(trans.value.data);
            if (contrib.status === 'fulfilled') setContribution(contrib.value.data?.['Skill.Contribution'] || []);
            if (mocg.status  === 'fulfilled') setMocgData(mocg.value.data?.['MOCG'] || []);
            if (mocgLearn.status === 'fulfilled') setMocgLearning(mocgLearn.value.data?.['Learning_opportunities'] || []);
        } catch (err) {
            console.error('Error fetching dashboard analyses:', err);
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------------------
    //  Drill-down for a missing skill: reuse existing courses + universities
    // ----------------------------------------------------------------------
    const handleSelectGapSkill = async (skillLabel) => {
        setSelectedGapSkill(skillLabel);
        setLoadingUpskill(true);
        setInstitutes([]);
        setSelectedInstitute(null);
        setCoursesForUpskilling([]);
        await Promise.all([
            fetchUniversitiesForSkill(skillLabel),
            fetchCoursesForSkill(skillLabel),
        ]);
        setLoadingUpskill(false);
    };

    const fetchCoursesForSkill = async (skillLabel) => {
        try {
            const skillsRes = await axios.post(
                `${process.env.REACT_APP_API_URL_TRACKER}/api/skills`,
                new URLSearchParams({ keywords: skillLabel }),
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessTokenSkillabTracker')}`,
                    },
                }
            );
            const items = skillsRes.data.items || [];
            const matched = items.find(i => i.label.toLowerCase() === skillLabel.toLowerCase());
            if (!matched) return;

            const courseRes = await axios.post(
                `${process.env.REACT_APP_API_URL_TRACKER}/api/courses?page=1`,
                new URLSearchParams({ skill_ids: matched.id }),
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessTokenSkillabTracker')}`,
                    },
                }
            );
            const courses = (courseRes.data.items || []).map(c => ({
                title: c.title, rating: c.rating, url: c.url, source: c.source,
            }));
            setCoursesForUpskilling(courses);
        } catch (err) {
            console.error('Error fetching courses:', err);
        }
    };

    const fetchUniversitiesForSkill = async (skillLabel) => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL_CURRICULUM_SKILLS}/get_universities_by_skills?skills=${encodeURIComponent(skillLabel)}`
            );
            if (res.data?.message?.includes('No universities')) {
                setInstitutes([]);
                return;
            }
            const formatted = Object.entries(res.data).map(([uni, courses]) => ({
                name: uni,
                courses: Object.entries(courses).map(([cName, sk]) => ({ name: cName, skills: sk })),
            }));
            setInstitutes(formatted);
        } catch (err) {
            console.error('Error fetching universities:', err);
        }
    };

    // ======================================================================
    //  Render helpers
    // ======================================================================

    // ---- Stat card (used 3x on overview) ---------------------------------
    const StatCard = ({ label, value, suffix, color, icon, sub }) => (
        <Card style={{
            borderLeft: `4px solid ${color}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            minHeight: '110px',
        }}>
            <CardBody>
                <Row className="align-items-center">
                    <Col xs="9">
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', fontWeight: 600 }}>
                            {label}
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1.1, marginTop: '4px' }}>
                            {value}{suffix && <span style={{ fontSize: '18px', color: '#6b7280', marginLeft: '4px' }}>{suffix}</span>}
                        </div>
                        {sub && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{sub}</div>
                        )}
                    </Col>
                    <Col xs="3" className="text-right">
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: `${color}22`, color,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '22px',
                        }}>
                            {icon}
                        </div>
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );

    // ---- Occupational Competitiveness gauge (SVG) -------------------------------------
    //  Shows where the candidate stands relative to the quantile distribution
    //  of competitors. Quantiles[0] = lowest score, Quantiles[3] = top.
    const CompetitivenessGauge = ({ standing, quantiles }) => {
        if (standing == null || !quantiles?.length) return null;
        const max = Math.max(quantiles[quantiles.length - 1] * 100, standing, 100);
        const norm = (v) => Math.min(100, (v / max) * 100);

        // Arc geometry
        const cx = 150, cy = 150, r = 110;
        const startAngle = 180, endAngle = 360; // half-circle, left to right
        const polar = (deg) => {
            const rad = (deg * Math.PI) / 180;
            return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
        };
        const arc = (fromDeg, toDeg, color) => {
            const start = polar(fromDeg);
            const end = polar(toDeg);
            const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
            return (
                <path
                    d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
                    fill="none" stroke={color} strokeWidth="22" strokeLinecap="round"
                />
            );
        };

        // Map quantile thresholds to angles
        const angleAt = (val) => startAngle + (norm(val) / 100) * (endAngle - startAngle);
        const standingAngle = angleAt(standing);

        // Needle
        const needleEnd = polar(standingAngle);
        const innerR = r - 30;
        const needleStart = {
            x: cx + innerR * Math.cos((standingAngle * Math.PI) / 180),
            y: cy + innerR * Math.sin((standingAngle * Math.PI) / 180),
        };

        // Quantile zones — paint a continuous red→green ramp.
        //
        // With N quantile thresholds the arc is divided into N+1 zones:
        //   zone 0:        0    → Q1   (worst)
        //   zone 1:        Q1   → Q2
        //   ...
        //   zone N-1:      Q[N-1] → Q[N]
        //   zone N (tail): Q[N]  → top   (best)
        //
        // Each zone gets a colour from a red→green ramp so the gauge reads
        // continuously regardless of how the quantile values are spaced.
        const RAMP = ['#ef4444', '#f97316', '#fbbf24', '#84cc16', '#22c55e'];
        const totalZones = quantiles.length + 1;
        const colorForZone = (idx) => {
            if (totalZones <= 1) return RAMP[RAMP.length - 1];
            const t = idx / (totalZones - 1);           // 0..1
            const pos = t * (RAMP.length - 1);          // 0..RAMP.length-1
            return RAMP[Math.round(pos)];
        };

        const zones = [];
        let prev = startAngle;
        quantiles.forEach((q, i) => {
            const a = angleAt(q * 100);
            zones.push(<g key={i}>{arc(prev, a, colorForZone(i))}</g>);
            prev = a;
        });
        if (prev < endAngle) {
            zones.push(<g key="tail">{arc(prev, endAngle, colorForZone(quantiles.length))}</g>);
        }

        return (
            <div style={{ textAlign: 'center' }}>
                <svg viewBox="0 0 300 200" style={{ width: '100%', maxWidth: '360px' }}>
                    {zones}
                    {/* needle */}
                    <line x1={needleStart.x} y1={needleStart.y} x2={needleEnd.x} y2={needleEnd.y}
                          stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
                    <circle cx={cx} cy={cy} r="8" fill="#1f2937" />
                    {/* labels */}
                    <text x={cx} y={cy + 40} textAnchor="middle" fontSize="28" fontWeight="700" fill="#111827">
                        {standing}
                    </text>
                    <text x={cx} y={cy + 60} textAnchor="middle" fontSize="11" fill="#6b7280" letterSpacing="1">
                        CURRENT STANDING
                    </text>
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '11px', color: '#6b7280', marginTop: '-8px' }}>
                    {quantiles.map((q, i) => (
                        <span key={i}>Q{i + 1}: {(q * 100).toFixed(1)}</span>
                    ))}
                </div>
            </div>
        );
    };

    // ---- Skill Profile radar (SVG) ---------------------------------------
    const SkillRadar = ({ data }) => {
        if (!data?.length) return <div className="text-center text-muted py-4">No skill profile data.</div>;
        const N = data.length;
        const cx = 200, cy = 200, R = 140;
        const maxImp = Math.max(...data.map(d => d.Importance), 1);

        const point = (i, value) => {
            const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
            const radius = (value / maxImp) * R;
            return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
        };
        const axisEnd = (i) => {
            const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
            return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
        };
        const labelPos = (i) => {
            const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
            return { x: cx + (R + 22) * Math.cos(angle), y: cy + (R + 22) * Math.sin(angle), angle };
        };

        const polygon = data.map((d, i) => {
            const p = point(i, d.Importance);
            return `${p.x},${p.y}`;
        }).join(' ');

        return (
            <div style={{ textAlign: 'center' }}>
                <svg viewBox="0 0 400 400" style={{ width: '100%', maxWidth: '420px' }}>
                    {/* concentric rings */}
                    {[0.25, 0.5, 0.75, 1].map((f, i) => (
                        <circle key={i} cx={cx} cy={cy} r={R * f}
                                fill="none" stroke="#e5e7eb" strokeWidth="1" />
                    ))}
                    {/* axes */}
                    {data.map((_, i) => {
                        const e = axisEnd(i);
                        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="#e5e7eb" strokeWidth="1" />;
                    })}
                    {/* polygon fill */}
                    <polygon points={polygon} fill="#3b82f6" fillOpacity="0.25" stroke="#3b82f6" strokeWidth="2" />
                    {/* points */}
                    {data.map((d, i) => {
                        const p = point(i, d.Importance);
                        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#1d4ed8">
                            <title>{d.Skill}: {d.Importance}</title>
                        </circle>;
                    })}
                    {/* labels */}
                    {data.map((d, i) => {
                        const l = labelPos(i);
                        const anchor = Math.cos(l.angle) > 0.3 ? 'start' :
                                       Math.cos(l.angle) < -0.3 ? 'end' : 'middle';
                        return (
                            <text key={i} x={l.x} y={l.y} textAnchor={anchor}
                                  fontSize="11" fill="#374151" dy="4"
                                  style={{ cursor: 'default' }}>
                                {d.Skill.length > 22 ? d.Skill.slice(0, 20) + '…' : d.Skill}
                                <title>{d.Skill}</title>
                            </text>
                        );
                    })}
                </svg>
            </div>
        );
    };

    // ---- Horizontal bar list (Critical Skill Gaps / Knowledge Gaps) ------
    const HorizontalBars = ({ items, max }) => {
        if (!items?.length) return <div className="text-center text-muted py-4">No gaps to display.</div>;
        const maxValue = max || Math.max(...items.map(i => i.Importance), 0.01);
        return (
            <div style={{ padding: '8px 4px' }}>
                {items.map((item, idx) => {
                    const pct = (item.Importance / maxValue) * 100;
                    const c = PRIORITY_COLORS[item.Priority] || PRIORITY_COLORS.Low;
                    return (
                        <div key={idx} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#374151', marginBottom: '3px' }}>
                                <span style={{ fontWeight: 500 }}>{item.Skill}</span>
                                <span style={{ color: '#6b7280' }}>{(item.Importance * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ background: '#f3f4f6', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${pct}%`, height: '100%',
                                    background: c.bar, borderRadius: '5px',
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ---- Skill contribution horizontal bars (with "show more") -----------
    //  Reused for both charts on the Skill Contribution tab. Generic over the
    //  value key ("Contribution" for owned skills, "MOCG" for missing ones).
    const ContributionBars = ({ items, valueKey, color, collapsedCount = 8 }) => {
        const [expanded, setExpanded] = useState(false);
        if (!items?.length) return <div className="text-center text-muted py-4">No data to display.</div>;
        const maxValue = Math.max(...items.map(i => i[valueKey]), 1);
        const visible = expanded ? items : items.slice(0, collapsedCount);
        return (
            <div style={{ padding: '8px 4px' }}>
                {visible.map((item, idx) => {
                    const pct = (item[valueKey] / maxValue) * 100;
                    return (
                        <div key={idx} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 500 }} title={item.Skill}>{item.Skill}</span>
                                <span style={{ color: '#6b7280', fontWeight: 600 }}>{item[valueKey]}</span>
                            </div>
                            <div style={{ background: '#f3f4f6', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${pct}%`, height: '100%',
                                    background: color, borderRadius: '7px',
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>
                    );
                })}
                {items.length > collapsedCount && (
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <Button color="link" size="sm" onClick={() => setExpanded(!expanded)} style={{ textDecoration: 'none' }}>
                            {expanded ? 'Show less' : `Show ${items.length - collapsedCount} more`}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    // ---- MOCG learning-opportunities table -------------------------------
    //  Ranked qualifications / learning opportunities and the fit +
    //  competitiveness improvement each one delivers, with the skills gained.
    const MocgLearningTable = ({ items, collapsedCount = 10 }) => {
        const [search, setSearch] = useState('');
        const [expanded, setExpanded] = useState(false);
        if (!items?.length) return <div className="text-center text-muted py-4">No learning opportunities available.</div>;

        const oppMeta = (u) => ({
            id: (u || '').split('/').pop(),
            type: u?.includes('/qualification/') ? 'Qualification'
                : u?.includes('/learningOpportunity/') ? 'Learning Opportunity'
                : 'Opportunity',
        });

        const maxFit = Math.max(...items.map(i => i['Fit.Improvement'] || 0), 0.0001);

        const filtered = items.filter(it =>
            (it['Skills.Acquired'] || []).some(s => s.toLowerCase().includes(search.toLowerCase())) ||
            oppMeta(it['Learning.Opportunity']).type.toLowerCase().includes(search.toLowerCase())
        );
        const visible = expanded ? filtered : filtered.slice(0, collapsedCount);

        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <Input type="text" placeholder="Search skills..." value={search}
                           onChange={(e) => { setSearch(e.target.value); setExpanded(false); }}
                           style={{ maxWidth: '220px', fontSize: '13px' }} bsSize="sm" />
                </div>
                <Table striped size="sm" style={{ fontSize: '13px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th>Learning Opportunity</th>
                            <th style={{ width: '150px' }}>Fit Improvement</th>
                            <th style={{ width: '150px' }}>Competitiveness</th>
                            <th>Skills Acquired</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((it, i) => {
                            const meta = oppMeta(it['Learning.Opportunity']);
                            const fitImp = it['Fit.Improvement'] || 0;
                            return (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>
                                        <a href={it['Learning.Opportunity']} target="_blank" rel="noreferrer"
                                           style={{ color: '#3b82f6', textDecoration: 'none' }}
                                           title={it['Learning.Opportunity']}>
                                            <Badge style={{ background: '#ede9fe', color: '#5b21b6', fontWeight: 600, marginRight: 6 }} pill>
                                                {meta.type}
                                            </Badge>
                                            {meta.id.slice(0, 8)}…
                                        </a>
                                    </td>
                                    <td>
                                        <Progress value={(fitImp / maxFit) * 100} color="success" style={{ height: '8px' }} />
                                        <small>+{(fitImp * 100).toFixed(1)}%</small>
                                    </td>
                                    <td>
                                        <Progress value={it['Competitiveness.Improvement'] || 0} color="info" style={{ height: '8px' }} />
                                        <small>{it['Competitiveness.Improvement']}</small>
                                    </td>
                                    <td>
                                        {(it['Skills.Acquired'] || []).map((s, si) => (
                                            <Badge key={si} style={{
                                                background: '#f3f4f6', color: '#374151', fontWeight: 500,
                                                margin: '2px 4px 2px 0', fontSize: '11px',
                                            }} pill>{s}</Badge>
                                        ))}
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan="5" className="text-center text-muted">No matching opportunities.</td></tr>
                        )}
                    </tbody>
                </Table>
                {filtered.length > collapsedCount && (
                    <div style={{ textAlign: 'center' }}>
                        <Button color="link" size="sm" onClick={() => setExpanded(!expanded)} style={{ textDecoration: 'none' }}>
                            {expanded ? 'Show less' : `Show ${filtered.length - collapsedCount} more`}
                        </Button>
                    </div>
                )}
            </>
        );
    };

    // ---- Gap table with priority badges + drill-down button --------------
    const GapTable = ({ items, search, setSearch }) => {
        const filtered = items.filter(i =>
            i.Skill.toLowerCase().includes(search.toLowerCase())
        );
        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <Input type="text" placeholder="Search..." value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           style={{ maxWidth: '220px', fontSize: '13px' }} bsSize="sm" />
                </div>
                <Table striped size="sm" style={{ fontSize: '13px' }}>
                    <thead>
                        <tr>
                            <th>Skill</th>
                            <th style={{ width: '90px' }}>Importance</th>
                            <th style={{ width: '110px' }}>Priority</th>
                            <th style={{ width: '70px' }}>Upskill</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((item, idx) => {
                            const c = PRIORITY_COLORS[item.Priority] || PRIORITY_COLORS.Low;
                            return (
                                <tr key={idx}>
                                    <td>{item.Skill}</td>
                                    <td>{(item.Importance * 100).toFixed(1)}%</td>
                                    <td>
                                        <Badge style={{
                                            background: c.bg, color: c.fg,
                                            fontWeight: 600, fontSize: '11px',
                                            padding: '4px 8px',
                                        }} pill>{item.Priority?.toUpperCase()}</Badge>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleSelectGapSkill(item.Skill)}
                                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                                            aria-label="View learning resources"
                                            title="View courses & universities for this skill"
                                        >
                                            <FaSearch />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan="4" className="text-center text-muted">No matching entries.</td></tr>
                        )}
                    </tbody>
                </Table>
            </>
        );
    };

    // ---- Skill Learning Ladder (cumulative fit progression) --------------
    //  Horizontal layout: one row per skill so the (often long) skill names
    //  stay fully readable regardless of how many skills there are.
    //  Each row shows the cumulative readiness (faint bar 0→Fit) with the
    //  gain from that skill highlighted (solid segment prev→Fit).
    const LearningLadder = ({ items }) => {
        if (!items?.length) return <div className="text-center text-muted py-4">No learning progression data.</div>;
        const baseFit = fitData?.['Fit.Score']?.[0] != null ? fitData['Fit.Score'][0] * 100 : 0;

        // Compute the delta added by each skill (cumulative diff)
        const steps = items.map((it, i) => {
            const prev = i === 0 ? baseFit : items[i - 1].Fit;
            return { ...it, delta: it.Fit - prev, prev };
        });

        const rowH = 26;
        const barH = 13;
        const padding = { l: 230, r: 55, t: 34, b: 34 };
        const width = 760;
        const innerW = width - padding.l - padding.r;
        const innerH = steps.length * rowH;
        const height = padding.t + innerH + padding.b;
        const maxX = 100;
        const xScale = (v) => padding.l + (v / maxX) * innerW;

        return (
            <div style={{ overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '600px' }}>
                    {/* vertical gridlines + top axis labels */}
                    {[0, 25, 50, 75, 100].map(v => (
                        <g key={v}>
                            <line x1={xScale(v)} y1={padding.t} x2={xScale(v)} y2={padding.t + innerH} stroke="#f3f4f6" />
                            <text x={xScale(v)} y={padding.t - 12} fontSize="11" fill="#6b7280" textAnchor="middle">{v}</text>
                        </g>
                    ))}

                    {/* current-standing baseline (vertical) */}
                    <line x1={xScale(baseFit)} y1={padding.t} x2={xScale(baseFit)} y2={padding.t + innerH}
                          stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" />
                    <text x={xScale(baseFit)} y={padding.t - 12} fontSize="10" fill="#3b82f6" textAnchor="middle">
                        current ({baseFit.toFixed(0)})
                    </text>

                    {/* one horizontal bar per skill */}
                    {steps.map((s, i) => {
                        const y = padding.t + i * rowH + rowH / 2;
                        const x0 = xScale(0);
                        const xPrev = xScale(s.prev);
                        const xFit = xScale(s.Fit);
                        const label = s.Skills.length > 32 ? s.Skills.slice(0, 30) + '…' : s.Skills;
                        return (
                            <g key={i}>
                                {/* skill label (left, fully readable) */}
                                <text x={padding.l - 12} y={y + 4} fontSize="11" fill="#374151" textAnchor="end">
                                    {label}
                                    <title>{s.Skills}</title>
                                </text>
                                {/* cumulative readiness (faint) */}
                                <rect x={x0} y={y - barH / 2} width={Math.max(0, xFit - x0)} height={barH}
                                      fill="#a7f3d0" opacity="0.55" rx="3" />
                                {/* gain from this skill (solid) */}
                                <rect x={xPrev} y={y - barH / 2} width={Math.max(2, xFit - xPrev)} height={barH}
                                      fill="#10b981" opacity="0.9" rx="3">
                                    <title>{s.Skills}: +{s.delta.toFixed(1)} Fit (→ {s.Fit})</title>
                                </rect>
                                {/* cumulative value at the end of the bar */}
                                <text x={xFit + 6} y={y + 4} fontSize="10" fill="#374151" textAnchor="start">
                                    {typeof s.Fit === 'number' ? s.Fit.toFixed(0) : s.Fit}
                                </text>
                            </g>
                        );
                    })}

                    {/* x axis title */}
                    <text x={padding.l + innerW / 2} y={height - 8} fontSize="11" fill="#6b7280" textAnchor="middle">
                        Projected Occupational Readiness
                    </text>
                </svg>
            </div>
        );
    };

    // ---- Alternative careers bubble chart --------------------------------
    const CareerBubbleChart = ({ items }) => {
        // Hover state for the cluster tooltip
        const [hoverCluster, setHoverCluster] = useState(null); // { x, y, roles }

        if (!items?.length) return <div className="text-center text-muted py-4">No alternative careers found.</div>;

        // Drop roles with zero competition, and convert Fit (a fraction) to a percentage.
        const data = items
            .filter(i => i.Competition !== 0)
            .map(i => ({ ...i, Fit: Math.round(i.Fit * 100 * 100) / 100 }));

        if (!data.length) return <div className="text-center text-muted py-4">No alternative careers with market competition to display.</div>;

        const width = 700, height = 380, padding = { l: 55, r: 20, t: 20, b: 50 };
        const innerW = width - padding.l - padding.r;
        const innerH = height - padding.t - padding.b;

        const fits = data.map(i => i.Fit);
        const comps = data.map(i => i.Competition);
        const maxFit = Math.max(...fits, 100);
        const maxComp = Math.max(...comps, 100);

        const xScale = (v) => padding.l + (v / maxComp) * innerW;
        const yScale = (v) => padding.t + (1 - v / maxFit) * innerH;

        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

        // ----- Group items by coordinate so overlapping points become one bubble
        const clusters = {};
        data.forEach((it, i) => {
            const key = `${it.Fit}|${it.Competition}`;
            if (!clusters[key]) {
                clusters[key] = { fit: it.Fit, comp: it.Competition, roles: [], firstIdx: i };
            }
            clusters[key].roles.push(it);
        });
        const clusterList = Object.values(clusters);

        return (
            <div style={{ overflowX: 'auto', position: 'relative' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '600px' }}
                     onMouseLeave={() => setHoverCluster(null)}>
                    {/* grid */}
                    {[0, 25, 50, 75, 100].map(v => (
                        <g key={v}>
                            <line x1={padding.l} y1={yScale(v)} x2={width - padding.r} y2={yScale(v)} stroke="#f3f4f6" />
                            <text x={padding.l - 6} y={yScale(v) + 4} fontSize="11" fill="#6b7280" textAnchor="end">{v}</text>
                            <line x1={xScale(v)} y1={padding.t} x2={xScale(v)} y2={padding.t + innerH} stroke="#f3f4f6" />
                            <text x={xScale(v)} y={padding.t + innerH + 16} fontSize="11" fill="#6b7280" textAnchor="middle">{v}</text>
                        </g>
                    ))}
                    {/* axes */}
                    <line x1={padding.l} y1={padding.t} x2={padding.l} y2={padding.t + innerH} stroke="#9ca3af" />
                    <line x1={padding.l} y1={padding.t + innerH} x2={width - padding.r} y2={padding.t + innerH} stroke="#9ca3af" />
                    <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="600">Market Competition</text>
                    <text x={15} y={padding.t + innerH / 2} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="600"
                          transform={`rotate(-90 15 ${padding.t + innerH / 2})`}>Candidate Fit</text>

                    {/* bubbles (one per cluster) */}
                    {clusterList.map((cl, i) => {
                        const cx = xScale(cl.comp);
                        const cy = yScale(cl.fit);
                        // Size by the cluster's best (smallest) original index —
                        // first role from the endpoint is the largest, last is the smallest.
                        const N = data.length;
                        const R_MAX = 26, R_MIN = 10;
                        const rank = cl.firstIdx;        // 0 == best
                        const t = N > 1 ? rank / (N - 1) : 0;
                        const baseR = R_MAX - t * (R_MAX - R_MIN);
                        // Small bonus when a cluster contains multiple roles
                        const r = baseR + (cl.roles.length > 1 ? 4 : 0);
                        const color = palette[cl.firstIdx % palette.length];
                        const isCluster = cl.roles.length > 1;

                        // Label: single role name OR "+N roles"
                        const label = isCluster
                            ? `${cl.roles.length} roles`
                            : cl.roles[0].Roles;

                        return (
                            <g key={i}
                               style={{ cursor: 'pointer' }}
                               onMouseEnter={() => setHoverCluster({
                                   x: cx, y: cy, r,
                                   fit: cl.fit, comp: cl.comp,
                                   roles: cl.roles.map(r => r.Roles),
                               })}
                            >
                                <circle cx={cx} cy={cy} r={r} fill={color} opacity="0.55" stroke={color} strokeWidth="1.5" />
                                {isCluster && (
                                    <text x={cx} y={cy + 4} fontSize="12" fontWeight="700" fill="#fff" textAnchor="middle"
                                          pointerEvents="none">
                                        {cl.roles.length}
                                    </text>
                                )}
                                <text x={cx} y={cy - r - 4} fontSize="11" fontWeight="600" fill="#1f2937" textAnchor="middle"
                                      pointerEvents="none">
                                    {label}
                                </text>
                                {/* Native fallback tooltip — works even before React state hydrates */}
                                <title>
                                    {isCluster
                                        ? `${cl.roles.length} roles at Fit ${cl.fit}, Competition ${cl.comp}:\n• ${cl.roles.map(r => r.Roles).join('\n• ')}`
                                        : `${cl.roles[0].Roles} — Fit ${cl.fit}, Competition ${cl.comp}`}
                                </title>
                            </g>
                        );
                    })}
                </svg>

                {/* Hover tooltip — positioned proportionally over the SVG */}
                {hoverCluster && (
                    <div style={{
                        position: 'absolute',
                        // Convert SVG coords (0–width / 0–height) to percent of the container
                        left: `${(hoverCluster.x / width) * 100}%`,
                        top:  `${(hoverCluster.y / height) * 100}%`,
                        transform: 'translate(-50%, calc(-100% - 12px))',
                        background: '#1f2937',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        maxWidth: '260px',
                        whiteSpace: 'nowrap',
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                            Fit {hoverCluster.fit} · Competition {hoverCluster.comp}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {hoverCluster.roles.map((roleName, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                        display: 'inline-block', width: '6px', height: '6px',
                                        borderRadius: '50%', background: '#10b981',
                                    }} />
                                    {roleName}
                                </div>
                            ))}
                        </div>
                        {/* little arrow at the bottom */}
                        <div style={{
                            position: 'absolute', left: '50%', bottom: '-5px',
                            transform: 'translateX(-50%)',
                            width: 0, height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #1f2937',
                        }} />
                    </div>
                )}
            </div>
        );
    };

    // ---- Transferable Skills Sankey-style flow ---------------------------
    //  Pillar (left) → Occupation (middle) → Skill (right)
    const TransferableFlow = ({ items }) => {
        // Hover state for the skill-node tooltip
        const [hoverSkill, setHoverSkill] = useState(null); // { x, y, name, entries, side }

        if (!items?.length) return <div className="text-center text-muted py-4">No transferable-skill data.</div>;

        const colorByPillar = { K: '#f59e0b', T: '#3b82f6', L: '#8b5cf6', S: '#10b981' };

        // ----- Split items by pillar: K → left, S → right.
        // T and L don't fit into the two-sided story, so we keep them aside
        // and surface them as a small footnote.
        const kItems = items.filter(i => i.Pillar === 'K');
        const sItems = items.filter(i => i.Pillar === 'S');
        const otherItems = items.filter(i => i.Pillar !== 'K' && i.Pillar !== 'S');

        // Skills on each side — preserve order of first appearance for stability
        const leftSkills  = Array.from(new Set(kItems.map(i => i.Skill || i.Skills)));
        const rightSkills = Array.from(new Set(sItems.map(i => i.Skill || i.Skills)));

        // Roles that connect to anything we're drawing
        const roles = Array.from(new Set([...kItems, ...sItems].map(i => i.Roles)));

        if (leftSkills.length === 0 && rightSkills.length === 0) {
            return <div className="text-center text-muted py-4">No Knowledge or Skill entries in transferable-skills data.</div>;
        }

        // Geometry
        const width = 900;
        const maxRows = Math.max(leftSkills.length, roles.length, rightSkills.length, 1);
        const height = Math.max(320, 50 + maxRows * 36);
        const padX = 20;
        const skillW = 130;       // wider so labels don't truncate as aggressively
        const roleW  = 180;
        const colX = [
            padX + skillW / 2,        // K-skills column centre
            width / 2,                 // roles column centre
            width - padX - skillW / 2, // S-skills column centre
        ];

        const yFor = (arr, idx) => {
            const step = (height - 60) / Math.max(arr.length, 1);
            return 40 + step * idx + step / 2;
        };

        const leftPos  = (s) => ({ x: colX[0], y: yFor(leftSkills,  leftSkills.indexOf(s))  });
        const rolePos  = (r) => ({ x: colX[1], y: yFor(roles,       roles.indexOf(r))       });
        const rightPos = (s) => ({ x: colX[2], y: yFor(rightSkills, rightSkills.indexOf(s)) });

        const curve = (a, b) => {
            const dx = (b.x - a.x) / 2;
            return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
        };

        // Group entries by skill (for the tooltip)
        const entriesBySkill = {};
        items.forEach(it => {
            const name = it.Skill || it.Skills;
            if (!entriesBySkill[name]) entriesBySkill[name] = [];
            entriesBySkill[name].push({
                role: it.Roles,
                pillar: it.Pillar,
                importance: it.Importance,
            });
        });

        return (
            <div style={{ overflowX: 'auto', position: 'relative' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '750px' }}
                     onMouseLeave={() => setHoverSkill(null)}>

                    {/* Column headers */}
                    <g>
                        <rect x={colX[0] - skillW / 2} y="6" width={skillW} height="24" rx="4" fill={colorByPillar.K} />
                        <text x={colX[0]} y="22" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">
                            Knowledge
                        </text>

                        <rect x={colX[1] - roleW / 2} y="6" width={roleW} height="24" rx="4" fill="#374151" />
                        <text x={colX[1]} y="22" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">
                            Occupations
                        </text>

                        <rect x={colX[2] - skillW / 2} y="6" width={skillW} height="24" rx="4" fill={colorByPillar.S} />
                        <text x={colX[2]} y="22" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">
                            Skills
                        </text>
                    </g>

                    {/* K → role flows — anchored to block edges so the line
                        never runs across a box and its endpoints are clear. */}
                    {kItems.map((it, i) => {
                        const sLabel = it.Skill || it.Skills;
                        const p1 = leftPos(sLabel);
                        const p2 = rolePos(it.Roles);
                        const from = { x: p1.x + skillW / 2, y: p1.y };  // right edge of Knowledge box
                        const to   = { x: p2.x - roleW / 2,  y: p2.y };  // left edge of Occupation box
                        const stroke = 2 + (it.Importance || 0.1) * 8;
                        return (
                            <path key={`k-${i}`} d={curve(from, to)} fill="none"
                                  stroke={colorByPillar.K} strokeOpacity="0.35" strokeWidth={stroke} />
                        );
                    })}

                    {/* role → S flows — anchored to block edges. */}
                    {sItems.map((it, i) => {
                        const sLabel = it.Skill || it.Skills;
                        const p1 = rolePos(it.Roles);
                        const p2 = rightPos(sLabel);
                        const from = { x: p1.x + roleW / 2,  y: p1.y };  // right edge of Occupation box
                        const to   = { x: p2.x - skillW / 2, y: p2.y };  // left edge of Skills box
                        const stroke = 2 + (it.Importance || 0.1) * 8;
                        return (
                            <path key={`s-${i}`} d={curve(from, to)} fill="none"
                                  stroke={colorByPillar.S} strokeOpacity="0.35" strokeWidth={stroke} />
                        );
                    })}

                    {/* Left column: Knowledge skills */}
                    {leftSkills.map((s) => {
                        const pos = leftPos(s);
                        const entries = entriesBySkill[s] || [];
                        return (
                            <g key={`L-${s}`}
                               style={{ cursor: 'pointer' }}
                               onMouseEnter={() => setHoverSkill({
                                   x: pos.x, y: pos.y - 14, name: s, entries, side: 'left',
                               })}>
                                <rect x={pos.x - skillW / 2} y={pos.y - 14}
                                      width={skillW} height="28" rx="4"
                                      fill="#fef3c7" stroke={colorByPillar.K} strokeWidth="1" />
                                <text x={pos.x} y={pos.y + 5} textAnchor="middle"
                                      fontSize="11" fill="#92400e" pointerEvents="none">
                                    {s.length > 18 ? s.slice(0, 16) + '…' : s}
                                </text>
                                <title>
                                    {s}
                                    {entries.map(e =>
                                        `\n• ${e.role} — Importance ${e.importance?.toFixed?.(2) ?? e.importance}`
                                    ).join('')}
                                </title>
                            </g>
                        );
                    })}

                    {/* Middle column: Roles */}
                    {roles.map((r) => {
                        const pos = rolePos(r);
                        return (
                            <g key={`R-${r}`}>
                                <rect x={pos.x - roleW / 2} y={pos.y - 14}
                                      width={roleW} height="28" rx="4" fill="#374151">
                                    <title>{r}</title>
                                </rect>
                                <text x={pos.x} y={pos.y + 5} textAnchor="middle"
                                      fontSize="12" fill="#fff" fontWeight="600" pointerEvents="none">
                                    {r.length > 26 ? r.slice(0, 24) + '…' : r}
                                </text>
                            </g>
                        );
                    })}

                    {/* Right column: Skill-pillar skills */}
                    {rightSkills.map((s) => {
                        const pos = rightPos(s);
                        const entries = entriesBySkill[s] || [];
                        return (
                            <g key={`S-${s}`}
                               style={{ cursor: 'pointer' }}
                               onMouseEnter={() => setHoverSkill({
                                   x: pos.x, y: pos.y - 14, name: s, entries, side: 'right',
                               })}>
                                <rect x={pos.x - skillW / 2} y={pos.y - 14}
                                      width={skillW} height="28" rx="4"
                                      fill="#dcfce7" stroke={colorByPillar.S} strokeWidth="1" />
                                <text x={pos.x} y={pos.y + 5} textAnchor="middle"
                                      fontSize="11" fill="#166534" pointerEvents="none">
                                    {s.length > 18 ? s.slice(0, 16) + '…' : s}
                                </text>
                                <title>
                                    {s}
                                    {entries.map(e =>
                                        `\n• ${e.role} — Importance ${e.importance?.toFixed?.(2) ?? e.importance}`
                                    ).join('')}
                                </title>
                            </g>
                        );
                    })}
                </svg>

                {/* Footnote for T/L pillars we didn't draw */}
                {otherItems.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                        Hidden from diagram: {otherItems.length} transversal / language entr{otherItems.length === 1 ? 'y' : 'ies'}.
                    </div>
                )}

                {/* Hover tooltip for skill nodes */}
                {hoverSkill && (
                    <div style={{
                        position: 'absolute',
                        left: `${(hoverSkill.x / width) * 100}%`,
                        top:  `${(hoverSkill.y / height) * 100}%`,
                        transform: 'translate(-50%, calc(-100% - 10px))',
                        background: '#1f2937',
                        color: '#fff',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        minWidth: '220px',
                        maxWidth: '340px',
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid #4b5563', paddingBottom: '4px' }}>
                            {hoverSkill.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {hoverSkill.entries.map((e, idx) => {
                                const dotColor = colorByPillar[e.pillar] || '#9ca3af';
                                return (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                            <span style={{
                                                display: 'inline-block', width: '8px', height: '8px',
                                                borderRadius: '50%', background: dotColor, flexShrink: 0,
                                            }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {e.role}
                                            </span>
                                        </span>
                                        <span style={{ fontWeight: 600, color: '#fbbf24', whiteSpace: 'nowrap' }}>
                                            {typeof e.importance === 'number' ? e.importance.toFixed(2) : e.importance}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{
                            position: 'absolute', left: '50%', bottom: '-5px',
                            transform: 'translateX(-50%)',
                            width: 0, height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #1f2937',
                        }} />
                    </div>
                )}
            </div>
        );
    };

    // ======================================================================
    //  Derived
    // ======================================================================
    const fitScore   = fitData?.['Fit.Score']?.[0];
    const standing   = fitData?.['Current.Standing']?.[0];
    const quantiles  = fitData?.['Quantiles'] || [];
    const tier       = fitData?.['Candidate.tier']?.[0];
    const tierStyle  = tier ? TIER_COLORS[tier] || TIER_COLORS.Novice : null;

    const skillGaps     = missing?.['ESCO.Skills.Gaps'] || [];
    const knowledgeGaps = missing?.['ESCO.Knowledge.Gaps'] || [];
    const transferList  = transferable?.['Transferable.Skills'] || [];
    const graphTransfer = transferable?.['Graph.Transferable.Skills'] || [];

    // Filtered roadmap (combines learning ladder w/ priority info from gaps)
    const allGapsByLabel = useMemo(() => {
        const m = {};
        [...skillGaps, ...knowledgeGaps].forEach(g => { m[g.Skill] = g.Priority; });
        return m;
    }, [skillGaps, knowledgeGaps]);

    const roadmapRows = useMemo(() => {
        return ladder.map(l => ({
            Skill: l.Skills,
            Priority: allGapsByLabel[l.Skills] || 'Moderate',
            ProjectedFit: l.Fit,
            Competition: l.Competition,
        })).filter(r => r.Skill.toLowerCase().includes(roadmapSearch.toLowerCase()));
    }, [ladder, allGapsByLabel, roadmapSearch]);

    const careerRows = useMemo(() => {
        return altCareers
            .filter(c => c.Roles.toLowerCase().includes(careerSearch.toLowerCase()))
            .map(c => ({
                Career: c.Roles,
                Fit: Math.round(c.Fit * 100 * 100) / 100,
                Competition: c.Competition,
            }));
    }, [altCareers, careerSearch]);

    // ======================================================================
    //  Tab content
    // ======================================================================
    const renderUpskillDrillDown = () => {
        if (!selectedGapSkill) return null;
        return (
            <div ref={drillDownRef} style={{ scrollMarginTop: '20px' }}>
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader style={{ background: '#f3e8ff', borderBottom: '1px solid #c4b5fd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <CardTitle tag="h6" style={{ margin: 0, color: '#5b21b6' }}>
                                    <FaGraduationCap style={{ marginRight: 6 }} />
                                    Upskilling for: <strong>{selectedGapSkill}</strong>
                                </CardTitle>
                                <Button close onClick={() => {
                                    setSelectedGapSkill(null);
                                    setInstitutes([]); setSelectedInstitute(null); setCoursesForUpskilling([]);
                                }} />
                            </div>
                        </CardHeader>
                        <CardBody>
                            {loadingUpskill ? <div className="lds-dual-ring" /> : (
                                <Row>
                                    {/* Universities column */}
                                    <Col md="6">
                                        <h6 style={{ color: '#374151' }}>Universities offering this skill</h6>
                                        <ul style={{ paddingLeft: 0, listStyle: 'none', maxHeight: '320px', overflowY: 'auto' }}>
                                            {institutes.length === 0 && <li className="text-muted">No matching universities.</li>}
                                            {institutes.map(inst => (
                                                <li key={inst.name}
                                                    style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '10px 12px', marginBottom: '6px', borderRadius: '6px',
                                                        border: '1px solid #e5e7eb',
                                                        background: inst.name === selectedInstitute?.name ? '#dcfce7' : '#fff',
                                                    }}>
                                                    <span style={{ fontSize: '13px' }}>{inst.name}</span>
                                                    <button onClick={() => setSelectedInstitute(inst)}
                                                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>
                                                        <i className="fas fa-eye" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        {selectedInstitute && (
                                            <div style={{ marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '6px' }}>
                                                <h6 style={{ marginBottom: '8px', color: '#1f2937' }}>Courses @ {selectedInstitute.name}</h6>
                                                <ul style={{ paddingLeft: 18, marginBottom: 0, fontSize: '13px' }}>
                                                    {selectedInstitute.courses.map(c => <li key={c.name}>{c.name}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </Col>
                                    {/* Online courses column */}
                                    <Col md="6">
                                        <h6 style={{ color: '#374151' }}>Online courses</h6>
                                        {coursesForUpskilling.length === 0 && <p className="text-muted">No online courses found.</p>}
                                        <Row>
                                            {coursesForUpskilling.map((course, i) => (
                                                <Col md="6" key={i} style={{ marginBottom: '10px' }}>
                                                    <Card style={{ height: '100%' }}>
                                                        <CardBody style={{ padding: '12px' }}>
                                                            <a href={course.url} target="_blank" rel="noreferrer"
                                                               style={{ color: '#1f2937', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                                                                {course.title}
                                                            </a>
                                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                                                                {course.rating != null && <span style={{ marginRight: 8 }}>★ {course.rating}/10</span>}
                                                                {course.source}
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Col>
                                </Row>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            </div>
        );
    };

    const renderOverview = () => (
        <>
            {/* Top stat cards */}
            <Row>
                <Col md="4">
                    <StatCard
                        label="Competitive Standing"
                        value={standing != null ? standing : '—'}
                        icon={<FaTrophy />}
                        color="#f59e0b"
                        sub="based on your current skills"
                    />
                </Col>
                <Col md="4">
                    <StatCard
                        label="Overall Occupational Readiness"
                        value={fitScore != null ? (fitScore * 100).toFixed(0) : '—'}
                        suffix="%"
                        icon={<FaChartLine />}
                        color="#10b981"
                        sub="based on your current skills"
                    />
                </Col>
                <Col md="4">
                    <StatCard
                        label="Candidate Tier"
                        value={tier || '—'}
                        icon={<FaCrown />}
                        color={tierStyle?.accent || '#6b7280'}
                        sub={tier ? 'classification badge' : ''}
                    />
                </Col>
            </Row>

            {/* Gauge + Radar */}
            <Row>
                <Col md="6">
                    <Card>
                        <CardHeader style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#92400e' }}>Occupational Competitiveness Gauge</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <CompetitivenessGauge standing={standing} quantiles={quantiles} />
                        </CardBody>
                    </Card>
                </Col>
                <Col md="6">
                    <Card>
                        <CardHeader style={{ background: '#dbeafe', borderBottom: '1px solid #93c5fd' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#1e3a8a' }}>Skill Profile</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <SkillRadar data={radarData} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </>
    );

    const renderGaps = () => (
        <>
            {/* Horizontal bar charts */}
            <Row>
                <Col md="6">
                    <Card>
                        <CardHeader style={{ background: '#fee2e2', borderBottom: '1px solid #fca5a5' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#991b1b' }}>Critical Skill Gaps</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <HorizontalBars items={skillGaps.slice(0, 10)} />
                        </CardBody>
                    </Card>
                </Col>
                <Col md="6">
                    <Card>
                        <CardHeader style={{ background: '#cffafe', borderBottom: '1px solid #67e8f9' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#155e75' }}>Knowledge Gaps</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <HorizontalBars items={knowledgeGaps.slice(0, 10)} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Detail tables */}
            <Row>
                <Col md="6">
                    <Card>
                        <CardHeader style={{ background: '#fee2e2', borderBottom: '1px solid #fca5a5' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#991b1b' }}>ESCO Skills Gaps</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <GapTable items={skillGaps} search={skillGapSearch} setSearch={setSkillGapSearch} />
                        </CardBody>
                    </Card>
                </Col>
                <Col md="6">
                    <Card>
                        <CardHeader style={{ background: '#cffafe', borderBottom: '1px solid #67e8f9' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#155e75' }}>ESCO Knowledge Gaps</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <GapTable items={knowledgeGaps} search={knowledgeGapSearch} setSearch={setKnowledgeGapSearch} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Drill-down area for a single skill */}
            {renderUpskillDrillDown()}
        </>
    );

    const renderRoadmap = () => (
        <>
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader style={{ background: '#dcfce7', borderBottom: '1px solid #86efac' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#166534' }}>Skill Learning Ladder</CardTitle>
                            <small className="text-muted">
                                Projected Occupational Readiness after learning each successive missing skill.
                            </small>
                        </CardHeader>
                        <CardBody>
                            <LearningLadder items={ladder} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader style={{ background: '#dcfce7', borderBottom: '1px solid #86efac' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#166534' }}>Personalized Learning Roadmap</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                                <Input type="text" placeholder="Search..." value={roadmapSearch}
                                       onChange={(e) => setRoadmapSearch(e.target.value)}
                                       style={{ maxWidth: '220px', fontSize: '13px' }} bsSize="sm" />
                            </div>
                            <Table striped size="sm" style={{ fontSize: '13px' }}>
                                <thead>
                                    <tr>
                                        <th>Skill</th>
                                        <th style={{ width: '110px' }}>Priority</th>
                                        <th style={{ width: '140px' }}>Projected Fit</th>
                                        <th style={{ width: '140px' }}>Competition</th>
                                        <th style={{ width: '90px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roadmapRows.map((r, i) => {
                                        const c = PRIORITY_COLORS[r.Priority] || PRIORITY_COLORS.Low;
                                        return (
                                            <tr key={i}>
                                                <td>{r.Skill}</td>
                                                <td>
                                                    <Badge style={{ background: c.bg, color: c.fg, fontWeight: 600, padding: '4px 8px' }} pill>
                                                        {r.Priority?.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Progress value={r.ProjectedFit} color="success" style={{ height: '8px' }} />
                                                    <small>{r.ProjectedFit}</small>
                                                </td>
                                                <td>
                                                    <Progress value={r.Competition} color="warning" style={{ height: '8px' }} />
                                                    <small>{r.Competition?.toFixed(1)}</small>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleSelectGapSkill(r.Skill)}
                                                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                                                        title="View learning resources">
                                                        <FaSearch /> Learn
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {roadmapRows.length === 0 && (
                                        <tr><td colSpan="5" className="text-center text-muted">No roadmap entries.</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader style={{ background: '#ede9fe', borderBottom: '1px solid #c4b5fd' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#5b21b6' }}>Learning Opportunities</CardTitle>
                            <small className="text-muted">
                                Qualifications and courses ranked by the fit and competitiveness improvement they deliver (MOCG).
                            </small>
                        </CardHeader>
                        <CardBody>
                            <MocgLearningTable items={mocgLearning} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Reuse the drill-down */}
            {renderUpskillDrillDown()}
        </>
    );

    const renderContribution = () => (
        <Row>
            <Col md="6">
                <Card>
                    <CardHeader style={{ background: '#dcfce7', borderBottom: '1px solid #86efac' }}>
                        <CardTitle tag="h6" style={{ margin: 0, color: '#166534' }}>Your Skills' Contribution</CardTitle>
                        <small className="text-muted">
                            How much each skill you already have contributes to this occupation.
                        </small>
                    </CardHeader>
                    <CardBody>
                        <ContributionBars items={contribution} valueKey="Contribution" color="#22c55e" />
                    </CardBody>
                </Card>
            </Col>
            <Col md="6">
                <Card>
                    <CardHeader style={{ background: '#fee2e2', borderBottom: '1px solid #fca5a5' }}>
                        <CardTitle tag="h6" style={{ margin: 0, color: '#991b1b' }}>Missing Skills' Contribution</CardTitle>
                        <small className="text-muted">
                            Skills you don't have yet, ranked by their contribution (MOCG).
                        </small>
                    </CardHeader>
                    <CardBody>
                        <ContributionBars items={mocgData} valueKey="MOCG" color="#ef4444" />
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );

    const renderCareer = () => (
        <>
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader style={{ background: '#dbeafe', borderBottom: '1px solid #93c5fd' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#1e3a8a' }}>Career Opportunity Landscape</CardTitle>
                            <small className="text-muted">
                                Bubble position = Fit vs. Competition for alternative careers.
                            </small>
                        </CardHeader>
                        <CardBody>
                            <CareerBubbleChart items={altCareers} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#92400e' }}>
                                Knowledge → Occupation → Skills
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <TransferableFlow items={graphTransfer.length ? graphTransfer : transferList} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader style={{ background: '#cffafe', borderBottom: '1px solid #67e8f9' }}>
                            <CardTitle tag="h6" style={{ margin: 0, color: '#155e75' }}>Career Transition Analysis</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                                <Input type="text" placeholder="Search..." value={careerSearch}
                                       onChange={(e) => setCareerSearch(e.target.value)}
                                       style={{ maxWidth: '220px', fontSize: '13px' }} bsSize="sm" />
                            </div>
                            <Table striped size="sm" style={{ fontSize: '13px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>#</th>
                                        <th>Career</th>
                                        <th style={{ width: '90px' }}>Fit (%)</th>
                                        <th style={{ width: '130px' }}>Competition</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {careerRows.map((r, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{r.Career}</td>
                                            <td><strong>{r.Fit}</strong></td>
                                            <td>{r.Competition}</td>
                                        </tr>
                                    ))}
                                    {careerRows.length === 0 && (
                                        <tr><td colSpan="4" className="text-center text-muted">No alternative careers.</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </>
    );

    // ======================================================================
    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CardTitle tag="h5">Target Occupation</CardTitle>
                            <FaInfoCircle
                                id="targetOccupationDashInfo"
                                className="ms-2"
                                style={{ cursor: 'pointer', marginLeft: '10px' }}
                            />
                            <Tooltip
                                isOpen={tooltipOpen}
                                target="targetOccupationDashInfo"
                                toggle={() => setTooltipOpen(!tooltipOpen)}
                            >
                                Choose a role you’re aiming for to unlock a full skills dashboard.
                            </Tooltip>
                        </div>
                        {/* TESTING: plain text input instead of OccupationSelection */}
                        <Card style={{ marginTop: '8px' }}>
                            <CardBody>
                                <Row className="align-items-center">
                                    <Col md="9">
                                        <Input
                                            type="text"
                                            placeholder="Type an occupation label (e.g. software developer)"
                                            value={testOccupationInput}
                                            onChange={(e) => setTestOccupationInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleApplyTestOccupation(); }}
                                            style={{ marginBottom: 0 }}
                                        />
                                    </Col>
                                    <Col md="3">
                                        <Button
                                            className="btn-round"
                                            color="info"
                                            onClick={handleApplyTestOccupation}
                                            style={{ width: '100%', marginBottom: 0 }}
                                            disabled={!testOccupationInput.trim()}
                                        >
                                            Apply
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </CardHeader>

                    {selectedOccupation && (
                        <CardBody>
                            {loading && (
                                <div className="text-center py-4">
                                    <div className="lds-dual-ring" />
                                    <p className="mt-2 text-muted">Analyzing your fit for {selectedOccupation.label}…</p>
                                </div>
                            )}

                            {!loading && fitData && (
                                <>
                                    {/* Tabs / sections */}
                                    <Nav tabs style={{ marginBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
                                        {[
                                            { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
                                            { id: 'gaps',     label: 'Skill Gaps & Upskilling', icon: <FaGraduationCap /> },
                                            { id: 'contribution', label: 'Skill Contribution', icon: <FaChartBar /> },
                                            { id: 'roadmap',  label: 'Personalized Learning Roadmap', icon: <FaCompass /> },
                                            { id: 'career',   label: 'Career Path Explorer', icon: <FaCrown /> },
                                        ].map(t => (
                                            <NavItem key={t.id}>
                                                <NavLink
                                                    style={{
                                                        cursor: 'pointer',
                                                        color: activeTab === t.id ? '#1f2937' : '#6b7280',
                                                        fontWeight: activeTab === t.id ? 600 : 400,
                                                        borderBottom: activeTab === t.id ? '3px solid #3b82f6' : '3px solid transparent',
                                                        background: 'transparent',
                                                        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                                    }}
                                                    onClick={() => setActiveTab(t.id)}
                                                >
                                                    <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
                                                </NavLink>
                                            </NavItem>
                                        ))}
                                    </Nav>

                                    <TabContent activeTab={activeTab}>
                                        <TabPane tabId="overview">{renderOverview()}</TabPane>
                                        <TabPane tabId="gaps">{renderGaps()}</TabPane>
                                        <TabPane tabId="contribution">{renderContribution()}</TabPane>
                                        <TabPane tabId="roadmap">{renderRoadmap()}</TabPane>
                                        <TabPane tabId="career">{renderCareer()}</TabPane>
                                    </TabContent>
                                </>
                            )}
                        </CardBody>
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default TargetOccupationDashboard;