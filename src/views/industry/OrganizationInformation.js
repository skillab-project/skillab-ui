import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
  Row,
  Col
} from "reactstrap";
import axios from 'axios';
import { getOrganization } from "../../utils/Tokens";

function OrganizationInformation() {
    const [organizationId, setOrganizationId] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [deptEmployees, setDeptEmployees] = useState([]); // For the dropdown
    
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);

    const [editName, setEditName] = useState("");
    const [editManagerId, setEditManagerId] = useState("");

    const [createModal, setCreateModal] = useState(false);
    const [newName, setNewName] = useState("");

    const [employees, setEmployees] = useState([]);
    const [occupations, setOccupations] = useState([]);

    const [filterDept, setFilterDept] = useState("All");
    const [filterOcc, setFilterOcc] = useState("All");

    const [employeeModal, setEmployeeModal] = useState(false);
    const [employeeDeleteModal, setEmployeeDeleteModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [empForm, setEmpForm] = useState({
        id: null,
        firstName: "",
        lastName: "",
        email: "",
        hireDate: "",
        departmentId: "",
        occupationId: ""
    });

    const filteredEmployees = employees.filter((emp) => {
        const matchesDept = filterDept === "All" || emp.departmentId?.toString() === filterDept;
        const matchesOcc = filterOcc === "All" || emp.occupationId?.toString() === filterOcc;
        return matchesDept && matchesOcc;
    });

    const toggleCreate = () => {
        setNewName("");
        setCreateModal(!createModal);
    };

    const getHeaders = async () => {
        const orgName = await getOrganization();
        return {
            "Authorization": `Bearer ${localStorage.getItem('accessTokenSkillab')}`,
            "X-User-Organization": orgName
        };
    };

    const fetchOrganizationData = async () => {
        try {
            const orgName = await getOrganization();
            const headers = await getHeaders();

            const orgRes = await axios.get(
                `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend/organizations`, 
                { headers }
            );
            
            const organization = orgRes.data.find(org => org.name === orgName);

            if (organization) {
                setOrganizationId(organization.id);
                // Fetch everything related to this org
                fetchDepartments(organization.id, headers);
                fetchEmployees(organization.id, headers);
                fetchOccupations(organization.id, headers);
            }
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    };

    const fetchEmployees = async (orgId, headers) => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend/organizations/${orgId}/employees`, { headers });
        setEmployees(res.data);
    };

    const fetchOccupations = async (orgId, headers) => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend/occupations/organization/${orgId}`, { headers });
        setOccupations(res.data);
    };


    const handleCreate = async () => {
        try {
            const headers = await getHeaders();
            await axios.post(
                `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend/departments`,
                { 
                    name: newName, 
                    organizationId: organizationId 
                },
                { headers }
            );
            toggleCreate();
            fetchOrganizationData(); // Refresh the list
        } catch (error) {
            console.error("Creation failed", error);
        }
    };

    const formatDateArray = (dateArray) => {
        if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 3) return "";
        const [year, month, day] = dateArray;
        // Pad month and day with leading zeros (e.g., 9 becomes "09")
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    };

    const toggleEmployeeModal = (emp = null) => {
        if (emp) {
            setIsEditMode(true);
            setEmpForm({
                id: emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                hireDate: formatDateArray(emp.hireDate),
                departmentId: emp.departmentId || "",
                occupationId: emp.occupationId || ""
            });
        } else {
            setIsEditMode(false);
            setEmpForm({ firstName: "", lastName: "", email: "", hireDate: "", departmentId: "", occupationId: "" });
        }
        setEmployeeModal(!employeeModal);
    };

    const handleEmployeeSubmit = async () => {
        try {
            const headers = await getHeaders();
            const baseUrl = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend`;
            const payload = { ...empForm, organizationId: organizationId };

            if (isEditMode) {
                await axios.put(`${baseUrl}/employees/${empForm.id}`, payload, { headers });
            } else {
                await axios.post(`${baseUrl}/employees`, payload, { headers });
            }
            
            setEmployeeModal(false);
            fetchOrganizationData(); // Refresh table
        } catch (error) {
            console.error("Employee save failed", error);
        }
    };

    const handleEmployeeDelete = async () => {
        try {
            const headers = await getHeaders();
            await axios.delete(`${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend/employees/${empForm.id}`, { headers });
            setEmployeeDeleteModal(false);
            fetchOrganizationData();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };



    const fetchDepartments = async (orgId, headers) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend/organizations/${orgId}/departments`, 
                { headers }
            );
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    // Fetch employees specifically for the selected department
    const fetchDeptEmployees = async (deptId) => {
        try {
            const headers = await getHeaders();
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend/departments/${deptId}/employees`,
                { headers }
            );
            setDeptEmployees(response.data);
        } catch (error) {
            console.error("Error fetching dept employees:", error);
            setDeptEmployees([]);
        }
    };

    useEffect(() => {
        fetchOrganizationData();
    }, []);

    const toggleEdit = async (dept = null) => {
        if (dept) {
            setSelectedDept(dept);
            setEditName(dept.name);
            setEditManagerId(dept.managerId || "");
            // Load employees for the dropdown when opening the modal
            await fetchDeptEmployees(dept.id);
        }
        setEditModal(!editModal);
    };

    const toggleDelete = (dept = null) => {
        if (dept) setSelectedDept(dept);
        setDeleteModal(!deleteModal);
    };

    const handleUpdate = async () => {
        try {
            const headers = await getHeaders();
            const baseUrl = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend`;

            // 1. Check if Name changed
            if (editName !== selectedDept.name) {
                await axios.put(
                    `${baseUrl}/departments/${selectedDept.id}`,
                    { name: editName },
                    { headers }
                );
            }

            // 2. Check if Manager changed
            // We compare strings/numbers carefully. Use != for null vs ""
            if (editManagerId != selectedDept.managerId) {
                // If manager is selected (not empty)
                if (editManagerId) {
                    await axios.post(
                        `${baseUrl}/departments/${selectedDept.id}/assign-manager/${editManagerId}`,
                        {}, // Usually empty body for this path variable style
                        { headers }
                    );
                }
            }

            toggleEdit();
            fetchOrganizationData(); // Refresh table
        } catch (error) {
            console.error("Update failed", error);
            alert("Error updating department information.");
        }
    };

    const handleDelete = async () => {
        try {
            const headers = await getHeaders();
            await axios.delete(
                `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/employee-management-backend/departments/${selectedDept.id}`,
                { headers }
            );
            toggleDelete();
            fetchOrganizationData();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <div className="content">
            {/* Overview card */}
            <Card>
                <CardHeader>
                <h4 className="card-title">Organization Information</h4>
                </CardHeader>
                <CardBody>
                <p>
                    This section provides an overview of the organization's structure,
                    departments, and key personnel. It includes details about the
                    company's mission, vision, and values.
                </p>
                </CardBody>
            </Card>

            {/* Departments Table */}
            <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                    <h4 className="card-title">Departments</h4>
                    <Button color="primary" onClick={toggleCreate}>
                        <i className="nc-icon nc-simple-add" /> Create Department
                    </Button>
                </CardHeader>
                <CardBody>
                    <Table responsive>
                        <thead className="text-primary">
                            <tr>
                                <th>Name</th>
                                <th>Manager</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((dept) => (
                                <tr key={dept.id}>
                                    <td>{dept.name}</td>
                                    <td>
                                        {dept.managerFirstName 
                                            ? `${dept.managerFirstName} ${dept.managerLastName}` 
                                            : "No Manager Assigned"}
                                    </td>
                                    <td className="text-right">
                                        <Button color="info" size="sm" className="mr-2" onClick={() => toggleEdit(dept)}>
                                            Edit
                                        </Button>
                                        <Button color="danger" size="sm" onClick={() => toggleDelete(dept)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* Employees Table */}
            <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                    <h4 className="card-title">Employees</h4>
                    <Button color="primary" onClick={() => toggleEmployeeModal()}>
                        <i className="nc-icon nc-simple-add" /> Create Employee
                    </Button>
                </CardHeader>
                <CardBody>
                    {/* Filter Section */}
                    <Row className="mb-3">
                        <Col md="4">
                            <FormGroup>
                                <Label for="filterDept">Filter by Department</Label>
                                <Input 
                                    type="select" 
                                    id="filterDept" 
                                    value={filterDept} 
                                    onChange={(e) => setFilterDept(e.target.value)}
                                >
                                    <option value="All">All Departments</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md="4">
                            <FormGroup>
                                <Label for="filterOcc">Filter by Occupation</Label>
                                <Input 
                                    type="select" 
                                    id="filterOcc" 
                                    value={filterOcc} 
                                    onChange={(e) => setFilterOcc(e.target.value)}
                                >
                                    <option value="All">All Occupations</option>
                                    {occupations.map(o => (
                                        <option key={o.id} value={o.id}>{o.title}</option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md="4" className="d-flex align-items-end">
                            <Button 
                                color="secondary" 
                                outline 
                                size="sm" 
                                className="mb-3"
                                onClick={() => { setFilterDept("All"); setFilterOcc("All"); }}
                            >
                                Reset Filters
                            </Button>
                        </Col>
                    </Row>
                    <Table responsive>
                        <thead className="text-primary">
                            <tr>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Hire Date</th>
                                <th>Department</th>
                                <th>Occupation</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                         <tbody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id}>
                                    <td>{emp.firstName}</td>
                                    <td>{emp.lastName}</td>
                                    <td>{emp.email}</td>
                                    <td>{formatDateArray(emp.hireDate)}</td>
                                    <td>{emp.departmentName || "N/A"}</td>
                                    <td>{emp.occupationTitle || "N/A"}</td>
                                    <td className="text-right">
                                        <Button color="info" size="sm" className="mr-2" onClick={() => toggleEmployeeModal(emp)}>Edit</Button>
                                        <Button color="danger" size="sm" onClick={() => { setEmpForm(emp); setEmployeeDeleteModal(true); }}>Delete</Button>
                                    </td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">No employees found matching the filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>



            {/* Department Create Modal */}
            <Modal isOpen={createModal} toggle={toggleCreate}>
                <ModalHeader toggle={toggleCreate}>Create New Department</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="newName">Department Name</Label>
                        <Input 
                            type="text" 
                            id="newName" 
                            placeholder="Enter department name"
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)} 
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleCreate}>Cancel</Button>
                    <Button 
                        color="primary" 
                        onClick={handleCreate}
                        disabled={!newName.trim()} // Disable if name is empty
                    >
                        Create
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Department Edit Modal */}
            <Modal isOpen={editModal} toggle={() => toggleEdit()}>
                <ModalHeader toggle={() => toggleEdit()}>Edit Department</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="deptName">Department Name</Label>
                        <Input 
                            type="text" 
                            id="deptName" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)} 
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label for="managerSelect">Assign Manager</Label>
                        <Input 
                            type="select" 
                            id="managerSelect" 
                            value={editManagerId} 
                            onChange={(e) => setEditManagerId(e.target.value)}
                        >
                            <option value="">No Manager Assigned</option>
                            {deptEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.email})
                                </option>
                            ))}
                        </Input>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleEdit()}>Cancel</Button>
                    <Button color="primary" onClick={handleUpdate}>Save Changes</Button>
                </ModalFooter>
            </Modal>

            {/* Department Delete Modal */}
            <Modal isOpen={deleteModal} toggle={() => toggleDelete()}>
                <ModalHeader toggle={() => toggleDelete()}>Confirm Delete</ModalHeader>
                <ModalBody>
                    Are you sure you want to delete <strong>{selectedDept?.name}</strong>?
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleDelete()}>Cancel</Button>
                    <Button color="danger" onClick={handleDelete}>Delete</Button>
                </ModalFooter>
            </Modal>


            {/* Employee Create/Edit Modal */}
            <Modal isOpen={employeeModal} toggle={() => setEmployeeModal(!employeeModal)} size="lg">
                <ModalHeader>{isEditMode ? "Edit Employee" : "Create Employee"}</ModalHeader>
                <ModalBody>
                    <Row>
                        <Col md="6">
                            <FormGroup>
                                <Label>First Name</Label>
                                <Input type="text" value={empForm.firstName} onChange={(e) => setEmpForm({...empForm, firstName: e.target.value})} />
                            </FormGroup>
                        </Col>
                        <Col md="6">
                            <FormGroup>
                                <Label>Last Name</Label>
                                <Input type="text" value={empForm.lastName} onChange={(e) => setEmpForm({...empForm, lastName: e.target.value})} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Label>Email</Label>
                        <Input type="email" value={empForm.email} onChange={(e) => setEmpForm({...empForm, email: e.target.value})} />
                    </FormGroup>
                    <FormGroup>
                        <Label>Hire Date</Label>
                        <Input type="date" value={empForm.hireDate} onChange={(e) => setEmpForm({...empForm, hireDate: e.target.value})} />
                    </FormGroup>
                    <Row>
                        <Col md="6">
                            <FormGroup>
                                <Label>Department</Label>
                                <Input type="select" value={empForm.departmentId} onChange={(e) => setEmpForm({...empForm, departmentId: e.target.value})}>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md="6">
                            <FormGroup>
                                <Label>Occupation</Label>
                                <Input type="select" value={empForm.occupationId} onChange={(e) => setEmpForm({...empForm, occupationId: e.target.value})}>
                                    <option value="">Select Occupation</option>
                                    {occupations.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setEmployeeModal(false)}>Cancel</Button>
                    <Button color="primary" onClick={handleEmployeeSubmit}>Save</Button>
                </ModalFooter>
            </Modal>

            {/* Employee Delete Confirmation */}
            <Modal isOpen={employeeDeleteModal} toggle={() => setEmployeeDeleteModal(!employeeDeleteModal)}>
                <ModalHeader>Confirm Delete</ModalHeader>
                <ModalBody>
                    Are you sure you want to delete employee <strong>{empForm.firstName} {empForm.lastName}</strong>?
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setEmployeeDeleteModal(false)}>Cancel</Button>
                    <Button color="danger" onClick={handleEmployeeDelete}>Delete</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}

export default OrganizationInformation;