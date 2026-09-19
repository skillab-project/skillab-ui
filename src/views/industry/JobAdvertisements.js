import React, { useState, useEffect } from "react";
import {Button, Card, CardHeader, CardBody, Row, Col, Nav, NavItem, NavLink } from "reactstrap";
import axios from 'axios';
import classnames from 'classnames';

import SidebarCard from './advertisements/LeftCard/SidebarCard';
import Candidates from './advertisements/Candidates/Candidates';
import Questions from './advertisements/Questions/Questions';
import Interview from './advertisements/Interview/Interview';
import DescriptionCard from './advertisements/Description/DescriptionCard';
import Hire from './advertisements/Hire/Hire';
import Analytics from './advertisements/Analytics/Analytics';
import ToastHost from './advertisements/Toast/ToastHost';


const normalizeStatus = (s) =>
    String(s ?? '').replace(/\u00A0/g, ' ').trim().toLowerCase().replace(/\s+/g, '');

const LOCKED_TABS = ['candidates', 'analytics', 'hire'];

const TABS = [
    { key: 'description', label: 'Description' },
    { key: 'interview', label: 'Interview' },
    { key: 'questions', label: 'Questions' },
    { key: 'candidates', label: 'Candidates' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'hire', label: 'Hire' },
];

function LockNotice({ statusLabel = 'Pending' }) {
    return (
        <div
            style={{
                padding: 16,
                borderRadius: 12,
                background: '#E5E7EB',
                border: '1px solid #bbbbbb',
                color: '#374151',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 8,
            }}
        >
            <div>🔒 Το συγκεκριμένο Job Ad είναι σε κατάσταση</div>
            <div style={{ fontWeight: 700, color: '#111827' }}>{statusLabel}</div>
            <div>και οι ενότητες αυτές δεν είναι διαθέσιμες.</div>
        </div>
    );
}

function JobAdvertisements() {
    const [allskills, setAllSkills] = React.useState(['JavaScript', 'CSS', 'React']);
    const [selectedTab, setSelectedTab] = React.useState('description');
    const [selectedJobAdId, setSelectedJobAdId] = React.useState(null);
    const [selectedJobAdMeta, setSelectedJobAdMeta] = React.useState(null);
    const [selectedDepartment, setSelectedDepartment] = React.useState(null);
    const [selectedOccupation, setSelectedOccupation] = React.useState(null);

    const [reloadKey, setReloadKey] = React.useState(0);

    const [jobStatus, setJobStatus] = React.useState(null);
    const statusLabel = jobStatus ?? '—';
    const isPending = React.useMemo(() => {
        const n = normalizeStatus(jobStatus);
        return n === 'pending' || n === 'pedding' || n === 'draft';
    }, [jobStatus]);

    React.useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL_HIRING_MANAGEMENT}/skills`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                },
            })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch all skills');
                return res.json();
            })
            .then((data) => {
                const skillNames = (data || [])
                    .map((skill) =>
                        typeof skill === 'string' ? skill : (skill?.name ?? skill?.title ?? '')
                    )
                    .filter(Boolean);
                setAllSkills(skillNames);
            })
            .catch(console.error);
    }, []);

    React.useEffect(() => {
        if (!selectedJobAdId) {
            setJobStatus(null);
            return;
        }
        const load = async () => {
            try {
                const r = await fetch(`${process.env.REACT_APP_API_URL_HIRING_MANAGEMENT}/api/v1/jobAds/details?jobAdId=${selectedJobAdId}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache', 
                        'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
                    });
                if (!r.ok) throw new Error();
                const d = await r.json();
                setJobStatus(d?.status ?? null);
            } catch {
                setJobStatus(null);
            }
        };
        load();
    }, [selectedJobAdId]);

    React.useEffect(() => {
        const jobSelected = !!selectedJobAdId;
        const disabledNow =
            (!jobSelected && selectedTab !== 'description') ||
            (isPending && LOCKED_TABS.includes(selectedTab));
        if (disabledNow) setSelectedTab('description');
    }, [isPending, selectedTab, selectedJobAdId]);

    React.useEffect(() => {
        const onUpdated = (e) => {
            const { id, status } = e.detail || {};
            if (!id) return;
            if (selectedJobAdId && Number(id) === Number(selectedJobAdId)) {
                setJobStatus(status || 'Published');
            }
            setReloadKey((k) => k + 1);
        };
        window.addEventListener('hf:jobad-updated', onUpdated);
        return () => window.removeEventListener('hf:jobad-updated', onUpdated);
    }, [selectedJobAdId]);

    const handleJobAdDeleted = () => {
        setSelectedJobAdId(null);
        setReloadKey((k) => k + 1);
        setJobStatus(null);
        setSelectedTab('description');
    };

    const jobSelected = !!selectedJobAdId;

    const isTabDisabled = (tab) => {
        if (tab === 'description') return false;
        if (!jobSelected) return true;
        if (isPending && LOCKED_TABS.includes(tab)) return true;
        return false;
    };

    const disabledReason = (tab) => {
        if (tab === 'description') return '';
        if (!jobSelected) return 'Select a Job Ad first';
        if (isPending && LOCKED_TABS.includes(tab)) return 'Available after you publish this Job Ad';
        return '';
    };

    const toggleTab = tab => {
        if (selectedTab === tab) return;
        if (isTabDisabled(tab)) return;
        setSelectedTab(tab);
    }

    const showSidebar = selectedTab === 'description';

    return (
        <div className="content">
            <Row>
                <Col md="12">
                    <Nav tabs style={{marginBottom:"5px"}}>
                        {TABS.map(({ key, label }) => (
                            <NavItem
                                key={key}
                                title={disabledReason(key)}
                                style={{ cursor: isTabDisabled(key) ? "not-allowed" : "pointer" }}
                            >
                                <NavLink
                                    disabled={isTabDisabled(key)}
                                    aria-disabled={isTabDisabled(key)}
                                    className={classnames({
                                        active: selectedTab === key,
                                        disabled: isTabDisabled(key),
                                    })}
                                    onClick={() => { toggleTab(key); }}
                                >
                                    {label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>
                    <div
                        style={{
                            margin: "0 0 10px",
                            fontSize: 12.5,
                            color: "#6b7280",
                            lineHeight: 1.4,
                        }}
                    >
                        {!selectedJobAdId ? (
                            <>Select a Job Ad on the left to begin. Only <b>Description</b> is available until then.</>
                        ) : isPending ? (
                            <>Complete the <b>Description</b> (details &amp; required skills), define <b>Interview</b> steps and add <b>Questions</b> per step, then <b>Publish</b> to unlock <b>Candidates</b>, <b>Hire</b> and <b>Analytics</b>.</>
                        ) : (
                            <>This Job Ad is published — all steps are available.</>
                        )}
                    </div>
                </Col>
            </Row>

            <Row>
                {showSidebar && (
                <Col lg="3" md="12">
                    <SidebarCard
                        onJobAdSelect={(jobOrId) => {
                            const id =
                                (jobOrId && typeof jobOrId === 'object') ? (Number(jobOrId.id) || null) : (Number(jobOrId) || null);
                            setSelectedJobAdId(id);
                            setSelectedJobAdMeta(
                                (jobOrId && typeof jobOrId === 'object')
                                    ? {
                                        id,
                                        title: jobOrId.title ?? null,
                                        departmentId: jobOrId.departmentId ?? null,
                                        departmentName: jobOrId.departmentName ?? null,
                                        occupationId: jobOrId.occupationId ?? null,
                                        occupationName: jobOrId.occupationName ?? null,
                                        status: jobOrId.status ?? null,
                                    }
                                    : (id ? { id } : null)
                            );
                            if (jobOrId && typeof jobOrId === 'object') {
                                if (jobOrId.departmentId || jobOrId.departmentName) {
                                    setSelectedDepartment({
                                        id: jobOrId.departmentId ?? null,
                                        name: jobOrId.departmentName ?? null,
                                    });
                                }
                                if (jobOrId.occupationId || jobOrId.occupationName) {
                                    setSelectedOccupation({
                                        id: jobOrId.occupationId ?? null,
                                        name: jobOrId.occupationName ?? null,
                                    });
                                }
                            } else {
                                if (id != null) setSelectedOccupation(null);
                            }
                        }}
                        selectedJobAdId={selectedJobAdId}
                        reloadKey={reloadKey}
                        onDepartmentSelect={(dept) => {
                            setSelectedDepartment(dept);
                            setSelectedOccupation(null);
                            setSelectedJobAdId(null);
                            setSelectedJobAdMeta(null);
                        }}
                        onClearOrganization={() => {
                            setSelectedDepartment(null);
                            setSelectedOccupation(null);
                            setSelectedJobAdId(null);
                            setSelectedJobAdMeta(null);
                        }}
                        selectedDepartmentId={selectedDepartment?.id ?? null}
                        onOccupationSelect={(occ) => {
                            const obj = (occ && typeof occ === 'object') ? occ : { id: Number(occ) || null };
                            setSelectedOccupation(obj);
                            setSelectedJobAdId(null);
                            setSelectedJobAdMeta(null);
                        }}
                        selectedOccupationId={selectedOccupation?.id ?? null}
                    />
                </Col>
                )}

                <Col lg={showSidebar ? "9" : "12"} md="12" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {!showSidebar && selectedJobAdId && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'wrap',
                                margin: '0 0 8px',
                                padding: '6px 12px',
                                background: '#F3F4F6',
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 13,
                            }}
                        >
                            <span style={{ color: '#6b7280' }}>Editing:</span>
                            <b>{selectedJobAdMeta?.title || `Job Ad #${selectedJobAdId}`}</b>
                            {selectedJobAdMeta?.departmentName && (
                                <span style={{ color: '#6b7280' }}>· {selectedJobAdMeta.departmentName}</span>
                            )}
                            {selectedJobAdMeta?.occupationName && (
                                <span style={{ color: '#6b7280' }}>· {selectedJobAdMeta.occupationName}</span>
                            )}
                            {jobStatus && (
                                <span
                                    style={{
                                        marginLeft: 2,
                                        padding: '1px 8px',
                                        borderRadius: 999,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: isPending ? '#FEF3C7' : '#DCFCE7',
                                        color: isPending ? '#92400E' : '#166534',
                                    }}
                                >
                                    {statusLabel}
                                </span>
                            )}
                            <Button
                                color="link"
                                onClick={() => setSelectedTab('description')}
                                style={{ padding: 0, marginLeft: 'auto', fontSize: 13 }}
                            >
                                Change Job Ad
                            </Button>
                        </div>
                    )}
                    <Card
                        className="shadow-sm"
                        style={{
                            flex: 1,
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <CardBody
                            style={{
                                flex: 1,
                                minHeight: 0,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {selectedTab === 'description' && (
                                <DescriptionCard
                                    selectedJobAdId={selectedJobAdId}
                                    allskills={allskills}
                                    onDeleted={handleJobAdDeleted}
                                    onPublished={() => {
                                        setJobStatus('Published');
                                        window.dispatchEvent(
                                            new CustomEvent('hf:jobad-updated', {
                                                detail: { id: selectedJobAdId, status: 'Published' },
                                            })
                                        );
                                    }}
                                />
                            )}

                            {selectedTab === 'questions' && <Questions selectedJobAdId={selectedJobAdId} />}

                            {selectedTab === 'interview' && <Interview selectedJobAdId={selectedJobAdId} />}

                            {selectedTab === 'candidates' &&
                                (isPending ? (
                                    <LockNotice statusLabel={statusLabel} />
                                ) : (
                                    <Candidates key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                ))}

                            {selectedTab === 'analytics' &&
                                (isPending ? (
                                    <LockNotice statusLabel={statusLabel} />
                                ) : (
                                    <Analytics
                                        orgId={3}
                                        departmentData={selectedDepartment}
                                        occupationData={selectedOccupation}
                                        jobAdData={selectedJobAdMeta}
                                        onGoToOrganization={() => {
                                            setSelectedJobAdId(null);
                                            setSelectedJobAdMeta(null);
                                            setSelectedDepartment(null);
                                            setSelectedOccupation(null);
                                        }}
                                    />
                                ))}

                            {selectedTab === 'hire' &&
                                (isPending ? (
                                    <LockNotice statusLabel={statusLabel} />
                                ) : (
                                    <Hire key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                ))}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Mount once, global για όλα τα toasts */}
            <ToastHost />

        </div>
    );
}

export default JobAdvertisements;