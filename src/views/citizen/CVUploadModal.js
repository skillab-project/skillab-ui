import React, { useState } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Row, Col, Input, Spinner
} from 'reactstrap';
import axios from 'axios';
import { getId } from '../../utils/Tokens';
import { isAuthenticatedTracker } from '../../utils/TrackerAuth';

const CVUploadModal = ({ isOpen, toggle, onSkillsImported, existingSkills = [] }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [extractedSkills, setExtractedSkills] = useState([]);
    const [yearsMap, setYearsMap] = useState({});
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState('upload');
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleUpload = async () => {
        if (!file) { setError('Please select a file first.'); return; }
        setUploading(true);
        setError('');
        try {
            const userId = await getId();
            const formData = new FormData();
            formData.append('file', file);
            const auth = { Authorization: `Bearer ${localStorage.getItem('accessTokenSkillab')}` };

            // 1. start the job — returns immediately with a jobId
            const { data: job } = await axios.put(
                `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/${userId}/cv`,
                formData,
                { headers: auth }
            );

            // 2. poll until DONE / FAILED
            const results = await pollCvJob(userId, job.id, auth);

            // 3. the user-management service returns skills without tracker IDs,
            //    so resolve each skill's ID from its label via the tracker.
            const mapped = await mapSkillsToIds(results);

            if (mapped.length === 0) {
                setError('We extracted skills from your CV but could not match them to the skill catalogue. Please try again or add skills manually.');
                return;
            }

            setExtractedSkills(mapped);
            const initial = {};
            mapped.forEach((s) => { initial[s.skillId] = ''; });
            setYearsMap(initial);
            setStep('review');
        } catch (err) {
            console.error('CV upload error:', err);
            setError('Failed to process the CV. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const pollCvJob = async (userId, jobId, auth, { interval = 4000, timeout = 120000 } = {}) => {
        const start = Date.now();
        while (true) {
            const { data: job } = await axios.get(
                `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/${userId}/cv/${jobId}`,
                { headers: auth }
            );
            if (job.status === 'DONE') return JSON.parse(job.skillsJson || '[]');
            if (job.status === 'FAILED') throw new Error(job.error || 'Extraction failed');
            await new Promise((r) => setTimeout(r, interval));
        }
        throw new Error('CV extraction timed out');
    };

    // Resolve a single skill label to its tracker ID by searching the tracker
    // skills endpoint and paging through the results until a label matches.
    const findSkillIdByLabel = async (label, { maxPages = 20 } = {}) => {
        const target = label.trim().toLowerCase();
        let page = 1;

        while (page <= maxPages) {
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL_TRACKER}/api/skills`,
                new URLSearchParams({ keywords: label }),
                {
                    params: { page: page.toString() },
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('accessTokenSkillabTracker')}`,
                    },
                }
            );

            const items = data.items || [];
            if (items.length === 0) break; // no more pages

            // Prefer an exact label match, fall back to an alternative-label match.
            const match =
                items.find((i) => i.label && i.label.trim().toLowerCase() === target) ||
                items.find((i) =>
                    (i.alternative_labels || []).some(
                        (alt) => alt && alt.trim().toLowerCase() === target
                    )
                );

            if (match) return match.id;
            page += 1;
        }

        return null;
    };

    // Map skills coming from the user-management service (which have no IDs)
    // to skills with tracker IDs. Skills that cannot be matched are dropped.
    const mapSkillsToIds = async (skills) => {
        await isAuthenticatedTracker(); // ensure a valid tracker token

        const mapped = [];
        for (const skill of skills) {
            const label = skill.skillLabel || skill.label || '';
            if (!label) continue;

            // Keep an existing ID if the backend ever provides one.
            const id = skill.skillId || (await findSkillIdByLabel(label));

            if (id) {
                mapped.push({ skillId: id, skillLabel: label });
            } else {
                console.warn(`No tracker match found for extracted skill: "${label}"`);
            }
        }
        return mapped;
    };

    const handleSaveSkills = async () => {
        const toAdd = extractedSkills.filter((s) => yearsMap[s.skillId]);
        if (toAdd.length === 0) {
            setError('Please enter years of experience for at least one skill.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const userId = await getId();
            const saved = [];

            for (const skill of toAdd) {
                await axios.put(
                    `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/${userId}/skills`,
                    {
                        skillId: skill.skillId,
                        skillLabel: skill.skillLabel,
                        years: yearsMap[skill.skillId],
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('accessTokenSkillab')}`,
                        },
                    }
                );
                saved.push({
                    skill: { id: skill.skillId, label: skill.skillLabel },
                    years: yearsMap[skill.skillId],
                });
            }

            if (onSkillsImported) onSkillsImported(saved);
            handleClose();
        } catch (err) {
            console.error('Error saving skills:', err);
            setError('Failed to save some skills. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        // Don't allow closing while the CV is being processed or skills are saving.
        if (uploading || saving) return;
        setFile(null);
        setExtractedSkills([]);
        setYearsMap({});
        setStep('upload');
        setError('');
        toggle();
    };

    const filledCount = Object.values(yearsMap).filter(Boolean).length;

    // Map of skill id -> years for skills the user has already added, so the
    // review step can flag duplicates found in the CV.
    const existingYearsById = {};
    (existingSkills || []).forEach((s) => {
        if (s && s.skill && s.skill.id != null) {
            existingYearsById[s.skill.id] = s.years;
        }
    });

    return (
        <Modal isOpen={isOpen} toggle={handleClose} size="lg">
            <ModalHeader toggle={handleClose}>
                {step === 'upload'
                    ? <><i className="fa fa-file-text-o" style={{ marginRight: 8 }} />Upload CV for Automatic Skill Extraction</>
                    : <><i className="fa fa-list-ul" style={{ marginRight: 8 }} />Review Extracted Skills</>
                }
            </ModalHeader>

            <ModalBody>
                {/* ── Upload ── */}
                {step === 'upload' && (
                    <div>
                        {uploading ? (
                            /* ── Processing state ── */
                            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                                <Spinner style={{ width: '3rem', height: '3rem', color: '#3b82f6' }} />
                                <p style={{ fontWeight: '600', color: '#111827', fontSize: '18px', marginTop: '20px', marginBottom: '8px' }}>
                                    Analyzing your CV…
                                </p>
                                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
                                    We're reading your CV and matching your skills. This can take a few minutes.
                                </p>
                                <p style={{ color: '#b45309', fontSize: '14px', fontWeight: '500', marginBottom: 0 }}>
                                    <i className="fa fa-exclamation-circle" style={{ marginRight: 6 }} />
                                    Please keep this window open — closing it will cancel the extraction.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                                    Upload your CV and we'll automatically extract your skills.
                                    You'll review them and add years of experience before saving.
                                </p>

                                <div
                                    style={{
                                        border: '2px dashed #d1d5db',
                                        borderRadius: '12px',
                                        padding: '40px',
                                        textAlign: 'center',
                                        background: '#f9fafb',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => document.getElementById('cv-file-input').click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const dropped = e.dataTransfer.files[0];
                                        if (dropped) setFile(dropped);
                                    }}
                                >
                                    <i className="fa fa-cloud-upload" style={{ fontSize: '48px', color: '#9ca3af', display: 'block', marginBottom: '12px' }} />
                                    {file ? (
                                        <div>
                                            <p style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                                {file.name}
                                            </p>
                                            <p style={{ color: '#6b7280', fontSize: '14px' }}>
                                                {(file.size / 1024).toFixed(1)} KB — click to change
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                                Drag & drop your CV here
                                            </p>
                                            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                or click to browse — PDF
                                            </p>
                                        </div>
                                    )}
                                    <input
                                        id="cv-file-input"
                                        type="file"
                                        accept=".pdf"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {error && (
                                    <p style={{ color: '#ef4444', marginTop: '12px', fontSize: '14px' }}>
                                        <i className="fa fa-exclamation-circle" style={{ marginRight: 4 }} />{error}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── Review ── */}
                {step === 'review' && (
                    <div>
                        <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
                            We found <strong>{extractedSkills.length} skill{extractedSkills.length !== 1 ? 's' : ''}</strong> in your CV.
                            Enter years of experience for the ones you want to add — leave blank to skip.
                        </p>

                        <Row style={{ padding: '0 8px', marginBottom: '6px' }}>
                            <Col md="8" style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                                Skill
                            </Col>
                            <Col md="4" style={{ fontWeight: '600', fontSize: '13px', color: '#374151', textAlign: 'center' }}>
                                Years of Experience
                            </Col>
                        </Row>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                            {extractedSkills.map((skill) => {
                                const alreadyAdded = skill.skillId in existingYearsById;
                                return (
                                <div
                                    key={skill.skillId}
                                    style={{
                                        background: alreadyAdded ? '#f3f4f6' : (yearsMap[skill.skillId] ? '#f0fdf4' : '#ffffff'),
                                        border: `1px solid ${alreadyAdded ? '#d1d5db' : (yearsMap[skill.skillId] ? '#86efac' : '#e5e7eb')}`,
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                        marginBottom: '8px',
                                        transition: 'background 0.15s, border-color 0.15s',
                                    }}
                                >
                                    <Row style={{ alignItems: 'center' }}>
                                        <Col md="8" style={{ fontWeight: '500', fontSize: '14px', color: '#111827', margin: 'auto' }}>
                                            {skill.skillLabel}
                                            {alreadyAdded && (
                                                <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', marginLeft: '8px' }}>
                                                    <i className="fa fa-check-circle" style={{ marginRight: 4 }} />
                                                    Already added
                                                </span>
                                            )}
                                        </Col>
                                        <Col md="4">
                                            {alreadyAdded ? (
                                                <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                                                    {existingYearsById[skill.skillId]} year{Number(existingYearsById[skill.skillId]) === 1 ? '' : 's'}
                                                </div>
                                            ) : (
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="50"
                                                    placeholder="—"
                                                    value={yearsMap[skill.skillId] || ''}
                                                    onChange={(e) =>
                                                        setYearsMap({ ...yearsMap, [skill.skillId]: e.target.value })
                                                    }
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: '13px',
                                                        borderColor: yearsMap[skill.skillId] ? '#86efac' : '#d1d5db',
                                                    }}
                                                />
                                            )}
                                        </Col>
                                    </Row>
                                </div>
                                );
                            })}
                        </div>

                        {filledCount > 0 && (
                            <p style={{ color: '#16a34a', fontSize: '13px', marginTop: '10px', marginBottom: 0 }}>
                                <i className="fa fa-check-circle" style={{ marginRight: 4 }} />
                                {filledCount} skill{filledCount !== 1 ? 's' : ''} selected
                            </p>
                        )}

                        {error && (
                            <p style={{ color: '#ef4444', marginTop: '8px', fontSize: '14px' }}>
                                <i className="fa fa-exclamation-circle" style={{ marginRight: 4 }} />{error}
                            </p>
                        )}
                    </div>
                )}
            </ModalBody>

            <ModalFooter>
                {step === 'upload' && (
                    <>
                        <Button color="secondary" onClick={handleClose} disabled={uploading}>Cancel</Button>
                        <Button color="info" onClick={handleUpload} disabled={uploading || !file}>
                            {uploading
                                ? <><Spinner size="sm" style={{ marginRight: 6 }} />Extracting skills…</>
                                : <><i className="fa fa-magic" style={{ marginRight: 6 }} />Extract Skills</>
                            }
                        </Button>
                    </>
                )}
                {step === 'review' && (
                    <>
                        <Button color="secondary" onClick={() => setStep('upload')} disabled={saving}>
                            <i className="fa fa-arrow-left" style={{ marginRight: 6 }} />Back
                        </Button>
                        <Button color="success" onClick={handleSaveSkills} disabled={saving}>
                            {saving
                                ? <><Spinner size="sm" style={{ marginRight: 6 }} />Saving…</>
                                : <><i className="fa fa-check" style={{ marginRight: 6 }} />Add Selected Skills</>
                            }
                        </Button>
                    </>
                )}
            </ModalFooter>
        </Modal>
    );
};

export default CVUploadModal;
