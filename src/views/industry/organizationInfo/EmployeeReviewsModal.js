import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Badge,
  Spinner,
  Collapse,
  Alert,
  Form,
} from "reactstrap";
import axios from "axios";
import Select from "react-select";
import { API_BASE_URL, getAuthHeaders } from "../employeeSkills/generalSkills/generalSkillsUtils";

function RatingBadge({ rating }) {
  if (rating === null || rating === undefined || rating === "") return <span className="text-muted">—</span>;
  const color = rating >= 4 ? "success" : rating >= 3 ? "info" : rating >= 2 ? "warning" : "danger";
  return (
    <Badge color={color} pill>
      {Number(rating).toFixed(1)}
    </Badge>
  );
}

// Searchable skill selector — shows org skills by default, hits /skills/search?q= for anything else.
function SkillSelect({ value, orgSkills, onSkillChange }) {
  const [searchedSkills, setSearchedSkills] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!inputValue.trim()) {
      setSearchedSkills([]);
      return;
    }

    setIsSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${API_BASE_URL}/skills/search?q=${encodeURIComponent(inputValue.trim())}`, {
          headers,
        });
        setSearchedSkills(res.data || []);
      } catch (err) {
        console.error("Skill search failed:", err);
        setSearchedSkills([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inputValue]);

  const skillsToShow = inputValue.trim() ? searchedSkills : orgSkills;
  const options = skillsToShow.map((sk) => ({ value: sk.id, label: sk.name }));
  const selected = options.find((o) => o.value?.toString() === value?.toString()) || null;

  return (
    <Select
      options={options}
      value={selected}
      onChange={(opt) => onSkillChange(opt ? { skillId: opt.value, skillName: opt.label } : { skillId: "", skillName: "" })}
      onInputChange={(val, meta) => {
        if (meta.action === "input-change") setInputValue(val);
      }}
      isLoading={isSearching}
      isClearable
      placeholder="Search skills…"
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
    />
  );
}

const fmtDate = (val) => {
  if (!val) return "—";
  const d = Array.isArray(val) ? new Date(val[0], val[1] - 1, val[2]) : new Date(val);
  return d.toLocaleDateString("en-GB");
};

// The org-wide performance-reviews list doesn't carry an employeeId on the
// review itself (only inside each skillEntryDto), so match on whichever of
// the two is available: an employeeId on a skill entry is exact, employeeName
// is the reliable fallback for reviews with no skill entries yet.
const reviewBelongsToEmployee = (review, employee) => {
  if (!review || !employee) return false;
  const hasEntryMatch = (review.skillEntryDtos || []).some((s) => s.employeeId === employee.id);
  if (hasEntryMatch) return true;
  const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim().toLowerCase();
  return (review.employeeName || "").trim().toLowerCase() === fullName;
};

const emptyForm = (employeeId, reporterId, reporterName) => ({
  id: null,
  employeeId,
  reporterId: reporterId || "",
  reporterName: reporterName || "No manager assigned",
  comments: "",
  overallRating: "",
  reviewDate: new Date().toISOString().split("T")[0],
});

/**
 * Shows the performance-review history for a single employee, and lets the
 * user create a new review (with per-skill ratings) or edit/delete an
 * existing one — without leaving the Organization Information page.
 */
function EmployeeReviewsModal({ isOpen, toggle, employee, organizationId, departments, employees }) {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [orgSkills, setOrgSkills] = useState([]);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [skillEntries, setSkillEntries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getReporter = () => {
    const dept = departments?.find((d) => d.id === employee?.departmentId);
    if (!dept?.managerId) return { reporterId: "", reporterName: "No manager assigned" };
    const manager = employees?.find((e) => e.id === dept.managerId);
    return {
      reporterId: dept.managerId,
      reporterName: manager ? `${manager.firstName} ${manager.lastName}` : "Manager",
    };
  };

  // Reset local UI state whenever a different employee's modal is opened.
  useEffect(() => {
    if (!isOpen) return;
    setShowForm(false);
    setFormData(null);
    setSkillEntries([]);
    setExpandedReviewId(null);
    setPendingDeleteId(null);
    setError("");
  }, [isOpen, employee?.id]);

  useEffect(() => {
    if (!isOpen || !employee || !organizationId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = await getAuthHeaders();
        const [reviewRes, skillRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/performance-reviews/organization/${organizationId}`, { headers }),
          axios.get(`${API_BASE_URL}/skills/organization/${organizationId}`, { headers }),
        ]);
        if (cancelled) return;
        const allReviews = reviewRes.data || [];
        setReviews(allReviews.filter((r) => reviewBelongsToEmployee(r, employee)));
        setOrgSkills(skillRes.data || []);
      } catch (err) {
        console.error("Failed to load performance reviews:", err);
        if (!cancelled) setError("Could not load performance reviews for this employee.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, employee, organizationId]);

  const refreshReviews = async () => {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/performance-reviews/organization/${organizationId}`, { headers });
    setReviews((res.data || []).filter((r) => reviewBelongsToEmployee(r, employee)));
  };

  const handleOpenNewForm = () => {
    const { reporterId, reporterName } = getReporter();
    setFormData(emptyForm(employee.id, reporterId, reporterName));
    setSkillEntries([]);
    setShowForm(true);
  };

  const handleEdit = (r) => {
    setFormData({
      id: r.id,
      employeeId: employee.id,
      reporterId: r.reporterId || "",
      reporterName: r.reporterName || "",
      comments: r.comments || "",
      overallRating: r.overallRating ?? "",
      reviewDate: Array.isArray(r.reviewDateTime)
        ? new Date(r.reviewDateTime[0], r.reviewDateTime[1] - 1, r.reviewDateTime[2]).toISOString().split("T")[0]
        : "",
    });
    setSkillEntries((r.skillEntryDtos || []).map((s) => ({ ...s, tempId: Math.random() })));
    setShowForm(true);
    setExpandedReviewId(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData(null);
    setSkillEntries([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const payload = {
        employeeId: employee.id,
        reporterId: parseInt(formData.reporterId, 10),
        comments: formData.comments,
        overallRating: parseFloat(formData.overallRating),
        reviewDate: formData.reviewDate,
      };

      let reviewId = formData.id;
      if (formData.id) {
        await axios.put(`${API_BASE_URL}/performance-reviews/${reviewId}`, payload, { headers });
      } else {
        const res = await axios.post(`${API_BASE_URL}/performance-reviews`, payload, { headers });
        reviewId = res.data.performanceReviewId;
      }

      if (skillEntries.length > 0) {
        const skillPayload = skillEntries.map((s) => ({
          skillId: s.skillId,
          rating: parseFloat(s.rating),
          entryDate: formData.reviewDate,
        }));
        await axios.post(`${API_BASE_URL}/performance-reviews/${reviewId}/skill-entries/bulk`, skillPayload, {
          headers,
        });
      }

      handleCancelForm();
      await refreshReviews();
    } catch (err) {
      console.error("Failed to save performance review:", err);
      setError("Failed to save the performance review. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (reviewId) => {
    setIsDeleting(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/performance-reviews/${reviewId}`, { headers });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setPendingDeleteId(null);
      if (expandedReviewId === reviewId) setExpandedReviewId(null);
    } catch (err) {
      console.error("Failed to delete performance review:", err);
      setError("Failed to delete the performance review.");
    } finally {
      setIsDeleting(false);
    }
  };

  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : "";

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" scrollable>
      <ModalHeader toggle={toggle}>Performance Reviews {employee ? `— ${employeeName}` : ""}</ModalHeader>
      <ModalBody>
        {error && <Alert color="danger">{error}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 text-muted">
            {showForm
              ? (formData?.id ? "Editing review" : "New review")
              : `${reviews.length} past review${reviews.length === 1 ? "" : "s"}`}
          </h6>
          <Button color={showForm ? "secondary" : "primary"} size="sm" onClick={() => (showForm ? handleCancelForm() : handleOpenNewForm())}>
            {showForm ? "Cancel" : "+ New Review"}
          </Button>
        </div>

        <Collapse isOpen={showForm}>
          {formData && (
            <Form onSubmit={handleSave} className="mb-4 p-3 border rounded bg-light">
              <Row>
                <Col md="4">
                  <FormGroup>
                    <Label>Reporter (Manager)</Label>
                    <Input type="text" readOnly value={formData.reporterName} className="bg-light" />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Overall Rating (0-5)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      required
                      value={formData.overallRating}
                      onChange={(e) => setFormData({ ...formData, overallRating: e.target.value })}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Review Date</Label>
                    <Input
                      type="date"
                      required
                      value={formData.reviewDate}
                      onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <FormGroup>
                <Label>Comments (optional)</Label>
                <Input
                  type="textarea"
                  rows="2"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                />
              </FormGroup>

              <Label>
                <strong>Skills &amp; Ratings</strong>
              </Label>
              <Table size="sm" bordered responsive className="align-middle bg-white">
                <thead className="table-light">
                  <tr>
                    <th className="ps-2">Skill Name</th>
                    <th style={{ width: "130px" }}>Rating (1-5)</th>
                    <th style={{ width: "80px" }} className="text-center">
                      Remove
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {skillEntries.map((s, idx) => (
                    <tr key={s.tempId || idx}>
                      <td className="p-1">
                        <SkillSelect
                          value={s.skillId}
                          orgSkills={orgSkills}
                          onSkillChange={({ skillId, skillName }) => {
                            const copy = [...skillEntries];
                            copy[idx] = { ...copy[idx], skillId, skillName };
                            setSkillEntries(copy);
                          }}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={s.rating}
                          onChange={(e) => {
                            const copy = [...skillEntries];
                            copy[idx].rating = e.target.value;
                            setSkillEntries(copy);
                          }}
                        />
                      </td>
                      <td className="text-center p-1">
                        <Button
                          type="button"
                          style={{ border: "none" }}
                          onClick={() => setSkillEntries(skillEntries.filter((_, i) => i !== idx))}
                          title="Remove Skill"
                          color="danger"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {skillEntries.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-3 small">
                        No skills added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <Button
                color="link"
                size="sm"
                className="mb-3"
                type="button"
                onClick={() => setSkillEntries([...skillEntries, { skillId: "", rating: 3, tempId: Math.random() }])}
              >
                + Add Skill
              </Button>

              <div className="text-right">
                <Button color="primary" type="submit" disabled={isSaving || skillEntries.length === 0}>
                  {isSaving ? <Spinner size="sm" /> : "Save Review"}
                </Button>
              </div>
            </Form>
          )}
        </Collapse>

        {!showForm && (loading ? (
          <div className="text-center py-4">
            <Spinner />
          </div>
        ) : (
          <Table hover responsive size="sm">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Rating</th>
                <th>Reporter</th>
                <th>Skills</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <React.Fragment key={r.id}>
                  <tr>
                    <td>{fmtDate(r.reviewDateTime)}</td>
                    <td>
                      <RatingBadge rating={r.overallRating} />
                    </td>
                    <td>{r.reporterName || "—"}</td>
                    <td>
                      <Button
                        color="link"
                        size="sm"
                        className="p-0"
                        onClick={() => setExpandedReviewId(expandedReviewId === r.id ? null : r.id)}
                      >
                        {(r.skillEntryDtos || []).length} skill{(r.skillEntryDtos || []).length === 1 ? "" : "s"}
                        <i className={`fas fa-chevron-${expandedReviewId === r.id ? "up" : "down"} ml-1`} style={{ fontSize: "0.7rem" }} />
                      </Button>
                    </td>
                    <td className="text-right">
                      {pendingDeleteId === r.id ? (
                        <>
                          <span className="text-muted mr-2" style={{ fontSize: "0.8rem" }}>
                            Delete?
                          </span>
                          <Button color="danger" size="sm" className="mr-1" onClick={() => handleDelete(r.id)} disabled={isDeleting}>
                            {isDeleting ? <Spinner size="sm" /> : "Yes"}
                          </Button>
                          <Button color="secondary" size="sm" outline onClick={() => setPendingDeleteId(null)}>
                            No
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button color="info" size="sm" className="mr-2" onClick={() => handleEdit(r)}>
                            Edit
                          </Button>
                          <Button color="danger" size="sm" outline onClick={() => setPendingDeleteId(r.id)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                  {expandedReviewId === r.id && (
                    <tr>
                      <td colSpan="5" className="bg-light">
                        {r.comments && (
                          <p className="mb-2">
                            <strong>Comments:</strong> {r.comments}
                          </p>
                        )}
                        {(r.skillEntryDtos || []).length > 0 ? (
                          (r.skillEntryDtos || []).map((s, i) => (
                            <Badge key={s.skillId || i} color="secondary" pill className="mr-1 mb-1" style={{ fontWeight: 400 }}>
                              {s.skillName || s.skillId}: {Number(s.rating).toFixed(1)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted">No skill ratings recorded for this review.</span>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
                    No performance reviews yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        ))}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default EmployeeReviewsModal;
