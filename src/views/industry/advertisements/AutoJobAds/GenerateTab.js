import React, { useEffect, useState } from "react";
import {
    Row, Col, Card, CardHeader, CardBody, CardTitle,
    Form, FormGroup, Label, Input, Button, Spinner
} from "reactstrap";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
const WORK_MODELS = ["On-site", "Hybrid", "Remote"];
const SENIORITIES = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director"];
const OUTPUT_FORMATS = ["markdown", "plain_text", "html"];

const DEFAULT_SECTION_ORDER = [
    "Job title",
    "Role summary",
    "Key responsibilities",
    "Required qualifications",
    "Preferred qualifications",
    "Benefits",
    "Call to action",
];

const styles = {
    card: { borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    errorBanner: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 10,
        fontWeight: 600,
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#6b7280",
        margin: "18px 0 8px",
    },
    advToggle: {
        cursor: "pointer",
        userSelect: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 600,
        color: "#2563eb",
        margin: "6px 0 4px",
    },
    advBox: { borderLeft: "3px solid #eef2ff", paddingLeft: 12 },
    chipWrap: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
        border: "1px solid #ced4da",
        borderRadius: 8,
        padding: "6px 8px",
        minHeight: 40,
        background: "#fff",
    },
    chipInput: { border: "none", outline: "none", flex: 1, minWidth: 120, fontSize: 14 },
    chip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#eef2ff",
        color: "#3730a3",
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 12.5,
        fontWeight: 600,
    },
    chipBtn: {
        border: "none",
        background: "transparent",
        color: "#6366f1",
        cursor: "pointer",
        lineHeight: 1,
        padding: 0,
        fontSize: 14,
    },
    pastAdBox: {
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        background: "#fbfbfd",
    },
    removeBtn: {
        border: "none",
        background: "transparent",
        color: "#ef4444",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
    },
    addBtn: {
        border: "1px dashed #a5b4fc",
        background: "#f5f7ff",
        color: "#4338ca",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 13,
        borderRadius: 8,
        padding: "8px 12px",
        width: "100%",
        marginTop: 2,
    },
};

/* ----------------------------- Chips input ----------------------------- */
function ChipInput({ values, onChange, placeholder, disabled }) {
    const [draft, setDraft] = useState("");

    const add = (raw) => {
        const v = raw.trim();
        if (!v) return;
        if (values.includes(v)) { setDraft(""); return; }
        onChange([...values, v]);
        setDraft("");
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
        } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
        }
    };

    return (
        <div style={styles.chipWrap}>
            {values.map((v) => (
                <span style={styles.chip} key={v}>
                    {v}
                    {!disabled && (
                        <button type="button" style={styles.chipBtn}
                            onClick={() => onChange(values.filter((x) => x !== v))}>×</button>
                    )}
                </span>
            ))}
            <input
                style={styles.chipInput}
                value={draft}
                placeholder={values.length ? "" : placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => add(draft)}
                disabled={disabled}
            />
        </div>
    );
}

/* ------------------------------ Generate tab --------------------------- */
export default function GenerateTab({
    submitting, submitError, orgName, onGenerate,
}) {
    // core fields
    const [companySector, setCompanySector] = useState("");
    const [jobRole, setJobRole] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [location, setLocation] = useState("");
    const [employmentType, setEmploymentType] = useState("Full-time");
    const [seniority, setSeniority] = useState("Mid-level");
    const [workModel, setWorkModel] = useState("On-site");
    const [teamContext, setTeamContext] = useState("");
    const [additionalContext, setAdditionalContext] = useState("");

    // advanced
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [language, setLanguage] = useState("English");
    const [tone, setTone] = useState("Professional and inclusive");
    const [maxWords, setMaxWords] = useState(650);
    const [outputFormat, setOutputFormat] = useState("markdown");
    const [mustInclude, setMustInclude] = useState([]);
    const [avoid, setAvoid] = useState([]);
    const [minResponsibilities, setMinResponsibilities] = useState(6);
    const [minRequirements, setMinRequirements] = useState(5);
    const [minBenefits, setMinBenefits] = useState(3);
    const [pastAds, setPastAds] = useState([{ title: "", text: "", notes: "" }]);

    // prefill company name from organization once it's known
    useEffect(() => {
        if (orgName) setCompanyName((prev) => prev || orgName);
    }, [orgName]);

    const updatePastAd = (index, field, value) =>
        setPastAds((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

    const addPastAd = () =>
        setPastAds((prev) => [...prev, { title: "", text: "", notes: "" }]);

    const removePastAd = (index) =>
        setPastAds((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

    const buildPayload = () => {
        const payload = {
            company_sector: companySector.trim(),
            job_role: jobRole.trim(),
            company_name: companyName.trim(),
            location: location.trim(),
            employment_type: employmentType,
            seniority,
            work_model: workModel,
            team_context: teamContext.trim(),
            additional_context: additionalContext.trim(),
            formatting_constraints: {
                language,
                tone,
                max_words: Number(maxWords) || 650,
                section_order: DEFAULT_SECTION_ORDER,
                output_format: outputFormat,
            },
            quality_constraints: {
                must_include: mustInclude,
                avoid,
                min_responsibilities: Number(minResponsibilities) || 0,
                min_requirements: Number(minRequirements) || 0,
                min_benefits: Number(minBenefits) || 0,
            },
        };
        const cleanedPastAds = pastAds
            .map((p) => ({ title: p.title.trim(), text: p.text.trim(), notes: p.notes.trim() }))
            .filter((p) => p.title || p.text || p.notes);
        if (cleanedPastAds.length) {
            payload.past_advertisements = cleanedPastAds;
        }
        return payload;
    };

    const canSubmit =
        companySector.trim() && jobRole.trim() && companyName.trim() && location.trim() && !submitting;

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (!canSubmit) return;
        onGenerate(buildPayload());
    };

    return (
        <Row>
            {/* ---------------- Form ---------------- */}
            <Col lg={{ size: 8, offset: 2 }} md="12">
                <Card style={styles.card}>
                    <CardHeader>
                        <CardTitle tag="h5" className="mb-0">New Job Ad Recommendation</CardTitle>
                    </CardHeader>
                    <CardBody>
                        {submitError && (
                            <div style={styles.errorBanner}>
                                <span>⚠ {submitError}</span>
                            </div>
                        )}
                        <Form onSubmit={handleSubmit}>
                            <FormGroup>
                                <Label>Company sector *</Label>
                                <Input value={companySector} disabled={submitting}
                                    placeholder="e.g., Industrial Manufacturing"
                                    onChange={(e) => setCompanySector(e.target.value)} />
                            </FormGroup>
                            <FormGroup>
                                <Label>Job role *</Label>
                                <Input value={jobRole} disabled={submitting}
                                    placeholder="e.g., Maintenance Technician"
                                    onChange={(e) => setJobRole(e.target.value)} />
                            </FormGroup>
                            <Row>
                                <Col sm="6">
                                    <FormGroup>
                                        <Label>Company name *</Label>
                                        <Input value={companyName} readOnly disabled
                                            placeholder="e.g., Acme Industries"
                                            title="Filled automatically from your organization" />
                                    </FormGroup>
                                </Col>
                                <Col sm="6">
                                    <FormGroup>
                                        <Label>Location *</Label>
                                        <Input value={location} disabled={submitting}
                                            placeholder="e.g., Athens, Greece"
                                            onChange={(e) => setLocation(e.target.value)} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col sm="4">
                                    <FormGroup>
                                        <Label>Employment</Label>
                                        <Input type="select" value={employmentType} disabled={submitting}
                                            onChange={(e) => setEmploymentType(e.target.value)}>
                                            {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col sm="4">
                                    <FormGroup>
                                        <Label>Seniority</Label>
                                        <Input type="select" value={seniority} disabled={submitting}
                                            onChange={(e) => setSeniority(e.target.value)}>
                                            {SENIORITIES.map((t) => <option key={t}>{t}</option>)}
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col sm="4">
                                    <FormGroup>
                                        <Label>Work model</Label>
                                        <Input type="select" value={workModel} disabled={submitting}
                                            onChange={(e) => setWorkModel(e.target.value)}>
                                            {WORK_MODELS.map((t) => <option key={t}>{t}</option>)}
                                        </Input>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <FormGroup>
                                <Label>Team context</Label>
                                <Input type="textarea" rows="2" value={teamContext} disabled={submitting}
                                    placeholder="What team will they join and what do they support?"
                                    onChange={(e) => setTeamContext(e.target.value)} />
                            </FormGroup>
                            <FormGroup>
                                <Label>Additional context</Label>
                                <Input type="textarea" rows="2" value={additionalContext} disabled={submitting}
                                    placeholder="Anything else worth highlighting"
                                    onChange={(e) => setAdditionalContext(e.target.value)} />
                            </FormGroup>

                            {/* -------- Advanced -------- */}
                            <div style={styles.advToggle} onClick={() => setShowAdvanced((s) => !s)}>
                                {showAdvanced ? "▾" : "▸"} Advanced options
                            </div>

                            {showAdvanced && (
                                <div style={styles.advBox}>
                                    <div style={styles.sectionTitle}>Formatting</div>
                                    <Row>
                                        <Col sm="6">
                                            <FormGroup>
                                                <Label>Language</Label>
                                                <Input value={language} disabled={submitting}
                                                    onChange={(e) => setLanguage(e.target.value)} />
                                            </FormGroup>
                                        </Col>
                                        <Col sm="6">
                                            <FormGroup>
                                                <Label>Output format</Label>
                                                <Input type="select" value={outputFormat} disabled={submitting}
                                                    onChange={(e) => setOutputFormat(e.target.value)}>
                                                    {OUTPUT_FORMATS.map((t) => <option key={t}>{t}</option>)}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col sm="8">
                                            <FormGroup>
                                                <Label>Tone</Label>
                                                <Input value={tone} disabled={submitting}
                                                    onChange={(e) => setTone(e.target.value)} />
                                            </FormGroup>
                                        </Col>
                                        <Col sm="4">
                                            <FormGroup>
                                                <Label>Max words</Label>
                                                <Input type="number" min="100" value={maxWords} disabled={submitting}
                                                    onChange={(e) => setMaxWords(e.target.value)} />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <div style={styles.sectionTitle}>Quality</div>
                                    <FormGroup>
                                        <Label>Must include</Label>
                                        <ChipInput values={mustInclude} onChange={setMustInclude}
                                            disabled={submitting}
                                            placeholder="Type a phrase and press Enter" />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Avoid</Label>
                                        <ChipInput values={avoid} onChange={setAvoid}
                                            disabled={submitting}
                                            placeholder="Words to avoid, press Enter" />
                                    </FormGroup>
                                    <Row>
                                        <Col sm="4">
                                            <FormGroup>
                                                <Label>Min resp.</Label>
                                                <Input type="number" min="0" value={minResponsibilities}
                                                    disabled={submitting}
                                                    onChange={(e) => setMinResponsibilities(e.target.value)} />
                                            </FormGroup>
                                        </Col>
                                        <Col sm="4">
                                            <FormGroup>
                                                <Label>Min req.</Label>
                                                <Input type="number" min="0" value={minRequirements}
                                                    disabled={submitting}
                                                    onChange={(e) => setMinRequirements(e.target.value)} />
                                            </FormGroup>
                                        </Col>
                                        <Col sm="4">
                                            <FormGroup>
                                                <Label>Min benefits</Label>
                                                <Input type="number" min="0" value={minBenefits}
                                                    disabled={submitting}
                                                    onChange={(e) => setMinBenefits(e.target.value)} />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <div style={styles.sectionTitle}>Past advertisements (optional)</div>
                                    {pastAds.map((p, i) => (
                                        <div key={i} style={styles.pastAdBox}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <Label className="mb-0" style={{ fontWeight: 600 }}>
                                                    Past ad #{i + 1}
                                                </Label>
                                                {pastAds.length > 1 && (
                                                    <button type="button" style={styles.removeBtn}
                                                        disabled={submitting}
                                                        onClick={() => removePastAd(i)}>Remove</button>
                                                )}
                                            </div>
                                            <FormGroup className="mt-2">
                                                <Label>Title</Label>
                                                <Input value={p.title} disabled={submitting}
                                                    onChange={(e) => updatePastAd(i, "title", e.target.value)} />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Text</Label>
                                                <Input type="textarea" rows="2" value={p.text} disabled={submitting}
                                                    onChange={(e) => updatePastAd(i, "text", e.target.value)} />
                                            </FormGroup>
                                            <FormGroup className="mb-0">
                                                <Label>Notes</Label>
                                                <Input value={p.notes} disabled={submitting}
                                                    onChange={(e) => updatePastAd(i, "notes", e.target.value)} />
                                            </FormGroup>
                                        </div>
                                    ))}
                                    <button type="button" style={styles.addBtn}
                                        disabled={submitting} onClick={addPastAd}>
                                        + Add another past advertisement
                                    </button>
                                </div>
                            )}

                            <Button color="primary" block className="mt-2"
                                type="submit" disabled={!canSubmit}>
                                {submitting ? <><Spinner size="sm" /> Submitting…</> : "Generate recommendation"}
                            </Button>
                        </Form>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}
