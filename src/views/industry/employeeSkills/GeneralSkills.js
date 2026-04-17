import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import axios from "axios";
import classnames from "classnames";
import { getOrganization } from "../../../utils/Tokens";
import {
  API_BASE_URL,
  getAuthHeaders,
  getDefaultDates,
  TAB_TABLE,
  TAB_CHARTS,
  VIEW_ORG,
  VIEW_EMP,
} from "./generalSkills/generalSkillsUtils";
import OrganizationSkills from "./generalSkills/OrganizationSkills";
import EmployeeSkills     from "./generalSkills/EmployeeSkills";


function GeneralSkills() {
    //  Org resolution 
    const [organizationId,   setOrganizationId]   = useState(null);
    const [organizationName, setOrganizationName] = useState("");

    //  Shared meta 
    const [departments,  setDepartments]  = useState([]);
    const [employees,    setEmployees]    = useState([]);
    const [loadingMeta,  setLoadingMeta]  = useState(false);

    //  Shared filter state 
    const [activeTab,      setActiveTab]      = useState(TAB_TABLE);
    const [viewMode,       setViewMode]       = useState(VIEW_ORG);
    const [selectedDeptId, setSelectedDeptId] = useState("");
    const [startDate,      setStartDate]      = useState(getDefaultDates().startDate);
    const [endDate,        setEndDate]        = useState(getDefaultDates().endDate);

    //  Resolve org on mount 
    useEffect(() => {
        const init = async () => {
        try {
            const orgName = await getOrganization();
            setOrganizationName(orgName);
            const res = await axios.get(`${API_BASE_URL}/organizations`, { headers: await getAuthHeaders() });
            const org = res.data.find((o) => o.name === orgName);
            if (org) setOrganizationId(org.id);
        } catch (err) {
            console.error("Failed to load organization:", err);
        }
        };
        init();
    }, []);

    //  Load departments + employees 
    useEffect(() => {
        if (!organizationId) return;
        const load = async () => {
        setLoadingMeta(true);
        try {
            const headers = await getAuthHeaders();
            const [deptsRes, empsRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/organizations/${organizationId}/departments`, { headers }),
            axios.get(`${API_BASE_URL}/organizations/${organizationId}/employees`,   { headers }),
            ]);
            const depts = deptsRes.data.content || deptsRes.data || [];
            setDepartments(Array.isArray(depts) ? depts : []);
            const emps = empsRes.data.content || empsRes.data || [];
            setEmployees(Array.isArray(emps) ? emps : []);
        } catch (err) {
            console.error("Failed to load meta:", err);
        } finally {
            setLoadingMeta(false);
        }
        };
        load();
    }, [organizationId]);

    //  Handlers 
    const handleDeptChange = (e) => {
        setSelectedDeptId(e.target.value);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    return (
        <Row>
        {/*  Filters  */}
        <Col md="12">
            <Card className="mb-4">
            <CardBody>
                <Row className="align-items-end">

                {/* View toggle */}
                <Col xs="auto" className="mb-3">
                    <FormGroup className="mb-0">
                    <Label>View</Label>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Button size="sm" color="info" outline={viewMode !== VIEW_ORG} onClick={() => handleViewModeChange(VIEW_ORG)}>
                        Organization
                        </Button>
                        <Button size="sm" color="info" outline={viewMode !== VIEW_EMP} onClick={() => handleViewModeChange(VIEW_EMP)}>
                        Employee
                        </Button>
                    </div>
                    </FormGroup>
                </Col>

                {/* Department */}
                <Col md={2} className="mb-3">
                    <FormGroup className="mb-0">
                    <Label for="deptFilter">Department</Label>
                    <Input
                        type="select"
                        id="deptFilter"
                        value={selectedDeptId}
                        onChange={handleDeptChange}
                        disabled={loadingMeta || !organizationId}
                    >
                        <option value="">All Departments</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Input>
                    </FormGroup>
                </Col>

                {/* Date range — charts tab only */}
                {activeTab === TAB_CHARTS && (
                    <>
                    <Col md={2} className="mb-3">
                        <FormGroup className="mb-0">
                        <Label for="startDate">Start Date</Label>
                        <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </FormGroup>
                    </Col>
                    <Col md={2} className="mb-3">
                        <FormGroup className="mb-0">
                        <Label for="endDate">End Date</Label>
                        <Input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </FormGroup>
                    </Col>
                    </>
                )}
                </Row>
            </CardBody>
            </Card>
        </Col>

        {/*  Tabs  */}
        <Col md="12">
            <Nav tabs style={{ marginBottom: "16px" }}>
            <NavItem style={{ cursor: "pointer" }}>
                <NavLink className={classnames({ active: activeTab === TAB_TABLE })} onClick={() => setActiveTab(TAB_TABLE)}>
                Skills Table
                </NavLink>
            </NavItem>
            <NavItem style={{ cursor: "pointer" }}>
                <NavLink className={classnames({ active: activeTab === TAB_CHARTS })} onClick={() => setActiveTab(TAB_CHARTS)}>
                Charts
                </NavLink>
            </NavItem>
            </Nav>
        </Col>

        {/*  Child components  */}
        {viewMode === VIEW_ORG && (
            <OrganizationSkills
            organizationId={organizationId}
            organizationName={organizationName}
            departments={departments}
            selectedDeptId={selectedDeptId}
            activeTab={activeTab}
            startDate={startDate}
            endDate={endDate}
            />
        )}

        {viewMode === VIEW_EMP && (
            <EmployeeSkills
            employees={employees}
            selectedDeptId={selectedDeptId}
            activeTab={activeTab}
            startDate={startDate}
            endDate={endDate}
            />
        )}
        </Row>
    );
}

export default GeneralSkills;