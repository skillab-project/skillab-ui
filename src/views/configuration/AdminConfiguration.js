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
    UncontrolledTooltip
} from "reactstrap";
import axios from "axios";


const AdminConfiguration = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        installation: "citizen"
    });

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
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert("Please fill in all fields");
            return;
        }

        try {
            await axios.post(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/users/create?installation=" + newUser.installation,
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

    const handleAuthorize = async (email) => {
        try {
            await axios.put(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/users/authorize?email=" + email,
                {}, { 
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                }
            });
            
            alert("User authorized successfully");
            fetchUsers();
        } catch (error) {
            console.error("Error authorizing user:", error);
            alert("Failed to authorize user");
        }
    };

    const handleDelete = async (email) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await axios.delete(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/admin/users/delete?email=" + email, 
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                    }
                });
            
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user");
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Admin Configuration</CardTitle>
            </CardHeader>
            <CardBody>
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
                        </Row>
                        <Row>
                            <Col>
                                <Button color="primary" onClick={handleCreateUser}>Create User</Button>
                            </Col>
                        </Row>
                    </Form>
                </div>

                {/* --- User List Table --- */}
                <h5 className="mb-3">User Management</h5>
                <div style={{ overflowX: "auto" }}>
                    <Table responsive striped hover>
                        <thead className="text-primary">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Roles</th>
                                <th>Installation</th>
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
                                        <td className="text-right">
                                            {user.roles && !user.roles.includes("PRIVILEGED") && (
                                                <>
                                                    <Button 
                                                        className="btn-icon btn-round" 
                                                        color="success" 
                                                        size="sm"
                                                        id={`auth-tooltip-${user.id}`} 
                                                        onClick={() => handleAuthorize(user.email)}
                                                        style={{ marginRight: "10px" }}
                                                    >
                                                        <i className="fa fa-check"></i>
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
                                                onClick={() => handleDelete(user.email)}
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
        </Card>
    );
}

export default AdminConfiguration;