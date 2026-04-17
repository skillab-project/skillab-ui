import React, { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col,
    Button,
    Input,
    Table,
    Form,
    FormGroup,
    Label,
    UncontrolledTooltip,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import axios from "axios";


const AdminConfiguration = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        installation: "citizen",
        organization: ""
    });
    const [modal, setModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [modalText, setModalText] = useState("");
    const [newOrganization, setNewOrganization] = useState("");
    const [organizations, setOrganizations] = useState([]);

    const toggleModal = () => setModal(!modal);

    const confirmAction = (text, action) => {
        setModalText(text);
        setPendingAction(() => action);
        toggleModal();
    };

    const fetchOrganizations = async () => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/organization",
                { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } }
            );
            setOrganizations(response.data);
        } catch (error) {
            console.error("Error fetching organizations:", error);
            return [];
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/users/all",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                    }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchOrganizations();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password || !newUser.installation || 
                                        (!newUser.organization) && newUser.organization!="") {
            alert("Please fill in all fields");
            return;
        }

        try {
            await axios.post(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/users/create?installation=" + newUser.installation + "&organization=" + newUser.organization,
                {
                    name: newUser.name,
                    email: newUser.email,
                    password: newUser.password
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                    }
            });
            
            alert("User created successfully");
            setNewUser({ name: "", email: "", password: "", installation: "citizen" });
            fetchUsers();
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Failed to create user");
        }
    };

    const handleAuthorize = async (user) => {
        confirmAction(
            `Are you sure you want to give privileged access to user ${user.name}?`,
            async () => {
                try {
                    await axios.put(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/users/authorize?email=" + user.email, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
                    });
                    alert("User authorized successfully");
                    fetchUsers();
                } catch (error) { alert("Failed to authorize user"); }
            }
        );
    };

    const handleDelete = async (user) => {
        confirmAction(
            `Are you sure you want to delete user ${user.name}?`,
            async () => {
                try {
                    await axios.delete(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/users/delete?email=" + user.email, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
                    });
                    fetchUsers();
                } catch (error) { alert("Failed to delete user"); }
            }
        );
    };

    const handleCreateOrganization = async () => {
        if (!newOrganization) {
            alert("Please enter an organization name");
            return;
        }
        try {
            await axios.post(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/organization?name=" + newOrganization, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
            });
            await axios.post(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/employee-management-backend/organizations", 
                { name: newOrganization, location: "Unknown" }, 
                { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` }
            });
            alert("Organization created successfully");
            setNewOrganization("");
            fetchOrganizations(); 
        }
        catch (error) {
            console.error("Error creating organization:", error);
            alert("Failed to create organization");
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Admin Configuration</CardTitle>
            </CardHeader>
            <CardBody>
                {/* --- Create Organization Section --- */}
                <div className="mb-5 p-3 border rounded">
                    <h5 className="mb-3">Create New Organization</h5>
                    <Form>
                        <Row>
                            <Col md="12">
                                <FormGroup>
                                    <Label>Organization Name</Label>
                                    <Input 
                                        type="text" 
                                        name="name" 
                                        value={newOrganization}
                                        onChange={(e) => setNewOrganization(e.target.value)}
                                        placeholder="Organization Name"
                                    />
                                </FormGroup>
                                <Button color="primary" onClick={handleCreateOrganization}>Create Organization</Button>
                            </Col>
                        </Row>
                    </Form>
                </div>

                {/* --- Create User Section --- */}
                <div className="mb-5 p-3 border rounded">
                    <h5 className="mb-3">Create New User</h5>
                    <Form>
                        <Row>
                            <Col md="3">
                                <FormGroup>
                                    <Label>Name</Label>
                                    <Input 
                                        type="text" 
                                        name="name" 
                                        value={newUser.name}
                                        onChange={handleInputChange}
                                        placeholder="Full Name"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md="3">
                                <FormGroup>
                                    <Label>Email</Label>
                                    <Input 
                                        type="email" 
                                        name="email" 
                                        value={newUser.email}
                                        onChange={handleInputChange}
                                        placeholder="user@example.com"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md="3">
                                <FormGroup>
                                    <Label>Password</Label>
                                    <Input 
                                        type="password" 
                                        name="password" 
                                        value={newUser.password}
                                        onChange={handleInputChange}
                                        placeholder="Password"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md="3">
                                <FormGroup>
                                    <Label>Installation Type</Label>
                                    <Input 
                                        type="select" 
                                        name="installation" 
                                        value={newUser.installation}
                                        onChange={handleInputChange}
                                    >
                                        <option value="citizen">Citizen</option>
                                        <option value="industry">Industry</option>
                                        <option value="education">Education</option>
                                        <option value="policy-education">Policy Education</option>
                                        <option value="policy-industry">Policy Industry</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>Organization</Label>
                                    <Input 
                                        type="select" 
                                        name="organization" 
                                        value={newUser.organization}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Organization</option>
                                        {organizations.map((org) => (
                                            <option key={org.name} value={org.name}>
                                                {org.name}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Button color="primary" onClick={handleCreateUser}>Create User</Button>
                            </Col>
                        </Row>
                    </Form>
                </div>

                {/* --- User List Table --- */}
                <h5 className="mb-3">All Users</h5>
                <div style={{ overflowX: "auto" }}>
                    <Table responsive striped hover>
                        <thead className="text-primary">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Roles</th>
                                <th>Installation</th>
                                <th>Organization</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users && users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.roles}</td>
                                        <td>{user.installation}</td>
                                        <td>{user.organization?.name}</td>
                                        <td className="text-right" style={{display:"flex"}}>
                                            {user.roles && !user.roles.includes("PRIVILEGED") && (
                                                <>
                                                    <Button 
                                                        className="btn-icon btn-round" 
                                                        color="success" 
                                                        size="sm"
                                                        id={`auth-tooltip-${user.id}`} 
                                                        onClick={() => handleAuthorize(user)}
                                                        style={{ marginRight: "5px" }}
                                                    >
                                                        <i className="fa fa-user-shield"></i>
                                                    </Button>
                                                    <UncontrolledTooltip placement="top" target={`auth-tooltip-${user.id}`}>
                                                        Authorize User
                                                    </UncontrolledTooltip>
                                                </>
                                            )}

                                            <Button 
                                                className="btn-icon btn-round" 
                                                color="danger" 
                                                size="sm"
                                                id={`del-tooltip-${user.id}`} 
                                                onClick={() => handleDelete(user)}
                                            >
                                                <i className="fa fa-trash"></i>
                                            </Button>
                                            <UncontrolledTooltip placement="top" target={`del-tooltip-${user.id}`}>
                                                Delete User
                                            </UncontrolledTooltip>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </CardBody>

            <Modal isOpen={modal} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Confirm Action</ModalHeader>
                <ModalBody>
                    {modalText}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleModal}>Cancel</Button>
                    <Button color="primary" onClick={() => { pendingAction(); toggleModal(); }}>Confirm</Button>
                </ModalFooter>
            </Modal>
        </Card>
    );
}

export default AdminConfiguration;