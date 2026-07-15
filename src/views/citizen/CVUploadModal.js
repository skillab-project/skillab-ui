import React, { useState } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Row, Col, Input, Spinner
} from 'reactstrap';
import axios from 'axios';
import { getId } from '../../utils/Tokens';

const CVUploadModal = ({ isOpen, toggle, onSkillsImported }) => {
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

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/${userId}/cv`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessTokenSkillab')}`,
                        // 'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const results = Array.isArray(response.data) ? response.data : [];
            setExtractedSkills(results);
            const initial = {};
            results.forEach((s) => { initial[s.skillId] = ''; });
            setYearsMap(initial);
            
            setStep('review');
        } catch (err) {
            console.error('CV upload error:', err);
            setError('Failed to process the CV. Please try again.');
        } finally {
            setUploading(false);
        }
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
        setFile(null);
        setExtractedSkills([]);
        setYearsMap({});
        setStep('upload');
        setError('');
        toggle();
    };

    const filledCount = Object.values(yearsMap).filter(Boolean).length;

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
                            {extractedSkills.map((skill) => (
                                <div
                                    key={skill.skillId}
                                    style={{
                                        background: yearsMap[skill.skillId] ? '#f0fdf4' : '#ffffff',
                                        border: `1px solid ${yearsMap[skill.skillId] ? '#86efac' : '#e5e7eb'}`,
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                        marginBottom: '8px',
                                        transition: 'background 0.15s, border-color 0.15s',
                                    }}
                                >
                                    <Row style={{ alignItems: 'center' }}>
                                        <Col md="8" style={{ fontWeight: '500', fontSize: '14px', color: '#111827', margin: 'auto' }}>
                                            {skill.skillLabel}
                                        </Col>
                                        <Col md="4">
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
                                        </Col>
                                    </Row>
                                </div>
                            ))}
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