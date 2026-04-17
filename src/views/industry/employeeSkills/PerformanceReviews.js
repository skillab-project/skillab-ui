import React, { useState, useEffect, useMemo } from "react";
import {
  Button, Card, CardHeader, CardBody, Table, Row, Col,
  FormGroup, Label, Input, Badge, Spinner, Collapse,
  Modal, ModalHeader, ModalBody, ModalFooter, Form
} from "reactstrap";
import axios from "axios";
import { getOrganization } from "../../../utils/Tokens";
import {
  API_BASE_URL,
  getAuthHeaders,
} from "./generalSkills/generalSkillsUtils";

/** 
 * CONSTANTS & SUB-COMPONENTS 
 */
const INITIAL_FORM_STATE = {
    id: null,
    departmentId: "",
    employeeId: "",
    reporterId: "",
    reporterName: "",
    rawText: "",
    comments: "",
    overallRating: "",
    reviewDate: new Date().toISOString().split('T')[0]
};

function RatingBadge({ rating }) {
    if (rating == null) return <span className="text-muted">—</span>;
    let color = rating >= 4 ? "success" : rating >= 3 ? "info" : rating >= 2 ? "warning" : "danger";
    return <Badge color={color} pill>{Number(rating).toFixed(1)}</Badge>;
}

function DeleteConfirmModal({ isOpen, toggle, onConfirm, itemDetails, loading }) {
    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Confirm Delete</ModalHeader>
            <ModalBody>
                <p>Are you sure you want to delete this performance review? This will also remove associated skill entries.</p>
                {itemDetails && (
                    <div className="p-2 bg-light border rounded">
                        <strong>{itemDetails.employeeName}</strong><br/>
                        <small className="text-muted">{itemDetails.displayDate}</small>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={toggle} disabled={loading}>Cancel</Button>
                <Button color="danger" onClick={onConfirm} disabled={loading}>{loading ? <Spinner size="sm" /> : "Confirm Delete"}</Button>
            </ModalFooter>
        </Modal>
    );
}

/**
 * MAIN COMPONENT
 */
function PerformanceReviews() {
    const [organizationId, setOrganizationId] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [orgSkills, setOrgSkills] = useState([]);
    
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [skillEntries, setSkillEntries] = useState([]);

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ employeeName: "", deptId: "" });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);

    const fmtDate = (val) => {
        if (!val) return "—";
        const d = Array.isArray(val) ? new Date(val[0], val[1] - 1, val[2]) : new Date(val);
        return d.toLocaleDateString("en-GB");
    };

    useEffect(() => {
        const init = async () => {
            try {
                const orgName = await getOrganization();
                const headers = await getAuthHeaders();
                const orgsRes = await axios.get(`${API_BASE_URL}/organizations`, { headers });
                const org = orgsRes.data.find(o => o.name === orgName);
                if (org) setOrganizationId(org.id);
            } catch (err) { console.error(err); }
        };
        init();
    }, []);

    useEffect(() => {
        if (!organizationId) return;
        const loadMeta = async () => {
            setLoading(true);
            try {
                const headers = await getAuthHeaders();
                const [deptRes, empRes, skillRes, reviewRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/organizations/${organizationId}/departments`, { headers }),
                    axios.get(`${API_BASE_URL}/organizations/${organizationId}/employees`, { headers }),
                    axios.get(`${API_BASE_URL}/skills/organization/${organizationId}`, { headers }),
                    axios.get(`${API_BASE_URL}/performance-reviews/organization/${organizationId}`, { headers })
                ]);
                setDepartments(deptRes.data.content || deptRes.data || []);
                setAllEmployees(empRes.data.content || empRes.data || []);
                setOrgSkills(skillRes.data || []);
                setReviews(reviewRes.data || []);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        loadMeta();
    }, [organizationId]);

    const handleDeptChange = (deptId) => {
        const dept = departments.find(d => d.id.toString() === deptId);
        let reporter = null;
        if (dept?.managerId) {
            reporter = allEmployees.find(e => e.id === dept.managerId);
        }
        setFormData({
            ...formData,
            departmentId: deptId,
            employeeId: "",
            reporterId: reporter ? reporter.id : "",
            reporterName: reporter ? `${reporter.firstName} ${reporter.lastName}` : "No manager assigned"
        });
    };

    const handleGenerateSkills = async () => {
        if (!formData.rawText) return;
        setIsGenerating(true);
        try {
            const headers = await getAuthHeaders();
            const res = await axios.post(`${API_BASE_URL}/performance-reviews/generate-skill-entries`, { rawText: formData.rawText }, { headers });
            const generated = (res.data || []).map(s => ({
                skillId: s.skillId,
                skillName: s.skillName,
                rating: s.rating,
                tempId: Math.random()
            }));
            const existingIds = new Set(skillEntries.map(s => s.skillId));
            const filtered = generated.filter(s => !existingIds.has(s.skillId));
            setSkillEntries([...skillEntries, ...filtered]);
        } catch (err) { console.error(err); } finally { setIsGenerating(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const headers = await getAuthHeaders();
            const payload = {
                employeeId: parseInt(formData.employeeId),
                reporterId: parseInt(formData.reporterId),
                rawText: formData.rawText,
                comments: formData.comments,
                overallRating: parseFloat(formData.overallRating),
                reviewDate: formData.reviewDate
            };

            let reviewId = formData.id;
            if (formData.id) {
                await axios.put(`${API_BASE_URL}/performance-reviews/${reviewId}`, payload, { headers });
            } else {
                const res = await axios.post(`${API_BASE_URL}/performance-reviews`, payload, { headers });
                reviewId = res.data.performanceReviewId;
            }

            if (skillEntries.length > 0) {
                const skillPayload = skillEntries.map(s => ({ skillId: s.skillId, rating: parseFloat(s.rating), entryDate: formData.reviewDate }));
                await axios.post(`${API_BASE_URL}/performance-reviews/${reviewId}/skill-entries/bulk`, skillPayload, { headers });
            }

            // RESET FORM
            setFormData(INITIAL_FORM_STATE);
            setSkillEntries([]);
            setShowForm(false);

            // REFRESH DATA
            const refresh = await axios.get(`${API_BASE_URL}/performance-reviews/organization/${organizationId}`, { headers });
            setReviews(refresh.data || []);
        } catch (err) { console.error(err); alert("Error saving review"); } finally { setIsSaving(false); }
    };

    const handleEdit = (r) => {
        const dept = departments.find(d => d.name === r.departmentName);
        setFormData({
            id: r.id,
            departmentId: dept?.id || "",
            employeeId: r.employeeId || "",
            reporterId: r.reporterId || "",
            reporterName: r.reporterName || "",
            rawText: r.rawText || "",
            comments: r.comments || "",
            overallRating: r.overallRating || "",
            reviewDate: Array.isArray(r.reviewDateTime) ? new Date(r.reviewDateTime[0], r.reviewDateTime[1]-1, r.reviewDateTime[2]).toISOString().split('T')[0] : ""
        });
        setSkillEntries((r.skillEntryDtos || []).map(s => ({ ...s, tempId: Math.random() })));
        setShowForm(true);
        window.scrollTo(0,0);
    };

    const filteredReviews = useMemo(() => {
        const selectedDeptObj = departments.find(d => d.id.toString() === filters.deptId);
        const targetDeptName = selectedDeptObj ? selectedDeptObj.name : null;

        return (reviews || []).filter(r => {
            const matchesEmployee = r.employeeName?.toLowerCase().includes(filters.employeeName.toLowerCase());
            
            const matchesDept = !filters.deptId || r.departmentName === targetDeptName;
            
            return matchesEmployee && matchesDept;
        });
    }, [reviews, filters, departments]);

    const deptEmployees = allEmployees.filter(e => e.departmentId?.toString() === formData.departmentId);

    return (
        <Col md="12">
            <div className="d-flex justify-content-between mb-3 align-items-center">
                <Button color={showForm ? "secondary" : "primary"} onClick={() => { 
                    if(showForm) { setFormData(INITIAL_FORM_STATE); setSkillEntries([]); }
                    setShowForm(!showForm); 
                }}>
                    <i className={`bi bi-${showForm ? 'x-circle' : 'plus-lg'} me-1`}></i>
                    {showForm ? "Cancel" : "Create Performance Review"}
                </Button>
                <Button color="link" onClick={() => setShowFilters(!showFilters)}>
                    <i className="bi bi-filter me-1"></i>Filters
                </Button>
            </div>

            {/* --- FORM SECTION --- */}
            <Collapse isOpen={showForm}>
                <Card className="mb-4 shadow-sm border-primary">
                    <CardHeader className="bg-primary text-white">
                        <h6 className="mb-0">{formData.id ? 'Edit Performance Review' : 'New Performance Review'}</h6>
                    </CardHeader>
                    <CardBody>
                        <Form onSubmit={handleSave}>
                            <Row>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label>Department</Label>
                                        <Input type="select" value={formData.departmentId} onChange={e => handleDeptChange(e.target.value)} required disabled={!!formData.id}>
                                            <option value="">Select Dept...</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label>Reporter (Manager)</Label>
                                        <Input type="text" readOnly value={formData.reporterName} className="bg-light" />
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label>Employee</Label>
                                        <Input type="select" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} required disabled={!!formData.id}>
                                            <option value="">Select Employee...</option>
                                            {deptEmployees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                                        </Input>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <FormGroup>
                                        <Label>Review Text (Doesnt work at the moment)</Label>
                                        <Input type="textarea" rows="4" value={formData.rawText} onChange={e => setFormData({...formData, rawText: e.target.value})} />
                                        <Button color="info" outline size="sm" className="mt-2" onClick={handleGenerateSkills} disabled={!formData.rawText || isGenerating}>
                                            {isGenerating ? <Spinner size="sm" /> : <><i className="bi bi-magic me-1"></i> Generate Skills</>}
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Label><strong>Skills & Ratings</strong></Label>
                            <Table size="sm" bordered responsive className="align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-2">Skill Name</th>
                                        <th style={{ width: '130px' }}>Rating (1-5)</th>
                                        <th style={{ width: '80px' }} className="text-center">Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skillEntries.map((s, idx) => (
                                        <tr key={s.tempId || idx}>
                                            <td className="p-1">
                                                <Input 
                                                    type="select" 
                                                    value={s.skillId} 
                                                    required 
                                                    onChange={e => {
                                                        const copy = [...skillEntries];
                                                        copy[idx].skillId = e.target.value;
                                                        setSkillEntries(copy);
                                                    }}
                                                >
                                                    <option value="">Select Skill...</option>
                                                    {orgSkills.map(sk => (
                                                        <option key={sk.id} value={sk.id}>{sk.name}</option>
                                                    ))}
                                                </Input>
                                            </td>
                                            <td className="p-1">
                                                <Input 
                                                    type="number" 
                                                    step="0.1" 
                                                    min="1" 
                                                    max="5" 
                                                    value={s.rating} 
                                                    onChange={e => {
                                                        const copy = [...skillEntries]; 
                                                        copy[idx].rating = e.target.value; 
                                                        setSkillEntries(copy);
                                                    }} 
                                                />
                                            </td>
                                            <td className="text-center p-1">
                                                {/* THIS IS THE REMOVE BUTTON FOR EACH SKILL ROW */}
                                                <Button
                                                    type="button" // Important: prevents form submission
                                                    style={{ border: 'none' }}
                                                    onClick={() => {
                                                        const updatedEntries = skillEntries.filter((_, i) => i !== idx);
                                                        setSkillEntries(updatedEntries);
                                                    }}
                                                    title="Remove Skill"
                                                    color="danger" size="sm">Remove</Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {skillEntries.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center text-muted py-3 small">
                                                No skills added yet. Use "Generate" or add one manually below.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                            <Button color="link" size="sm" className="mb-3" onClick={() => setSkillEntries([...skillEntries, { skillId: "", rating: 3, tempId: Math.random() }])}>+ Add Skill Manually</Button>

                            <Row>
                                <Col md={6}><FormGroup><Label>Overall Rating (0-5)</Label><Input type="number" step="0.1" required value={formData.overallRating} onChange={e => setFormData({...formData, overallRating: e.target.value})}/></FormGroup></Col>
                                <Col md={6}><FormGroup><Label>Review Date</Label><Input type="date" required value={formData.reviewDate} onChange={e => setFormData({...formData, reviewDate: e.target.value})}/></FormGroup></Col>
                            </Row>
                            <div className="text-end mt-3"><Button color="primary" type="submit" disabled={isSaving || skillEntries.length === 0}>{isSaving ? <Spinner size="sm" /> : "Save Performance Review"}</Button></div>
                        </Form>
                    </CardBody>
                </Card>
            </Collapse>

            {/* --- FILTER SECTION --- */}
            <Collapse isOpen={showFilters && !showForm}>
                <Card className="mb-3 bg-light"><CardBody><Row>
                    <Col md={4}><Input placeholder="Employee Name..." onChange={e => setFilters({...filters, employeeName: e.target.value})} /></Col>
                    <Col md={4}><Input type="select" onChange={e => setFilters({...filters, deptId: e.target.value})}>
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Input></Col>
                </Row></CardBody></Card>
            </Collapse>

            {/* --- TABLE --- */}
            <Card>
                <CardHeader>Review History</CardHeader>
                <CardBody className="p-0">
                    <Table hover responsive className="mb-0">
                        <thead className="table-light">
                            <tr><th className="ps-3">Employee</th><th>Dept</th><th>Rating</th><th>Date</th><th className="text-end pe-3">Actions</th></tr>
                        </thead>
                        <tbody>
                            {filteredReviews.map(r => (
                                <tr key={r.id}>
                                    <td className="ps-3"><strong>{r.employeeName}</strong></td>
                                    <td>{r.departmentName}</td>
                                    <td><RatingBadge rating={r.overallRating} /></td>
                                    <td>{fmtDate(r.reviewDateTime)}</td>
                                    <td className="text-end pe-3">
                                        <Button color="info" size="sm" className="mr-2" onClick={() => handleEdit(r)}>Edit</Button>
                                        <Button color="danger" size="sm" onClick={() => { setReviewToDelete(r); setDeleteModalOpen(true); }}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            <DeleteConfirmModal 
                isOpen={deleteModalOpen} 
                toggle={() => setDeleteModalOpen(!deleteModalOpen)} 
                onConfirm={async () => {
                    setIsDeleting(true);
                    try {
                        const headers = await getAuthHeaders();
                        await axios.delete(`${API_BASE_URL}/performance-reviews/${reviewToDelete.id}`, { headers });
                        setDeleteModalOpen(false);
                        const res = await axios.get(`${API_BASE_URL}/performance-reviews/organization/${organizationId}`, { headers });
                        setReviews(res.data || []);
                    } catch (e) { console.error(e); } finally { setIsDeleting(false); }
                }}
                itemDetails={reviewToDelete ? { employeeName: reviewToDelete.employeeName, displayDate: fmtDate(reviewToDelete.reviewDateTime) } : null}
                loading={isDeleting}
            />
        </Col>
    );
}

export default PerformanceReviews;