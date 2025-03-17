import { useState } from "react";
import { Input, Button, Card, CardBody, CardHeader, CardTitle, Row, Col } from "reactstrap";
import { FaUser, FaEnvelope, FaLock, FaHome, FaGlobe } from "react-icons/fa";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [address, setAddress] = useState("");
    const [portfolio, setPortfolio] = useState("");

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            alert("Please fill in all required fields.");
            return;
        }
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        console.log("Registering with", { name, email, password, confirmPassword, address, portfolio });
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password, address, portfolio })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }
            
            console.log("Registration successful", data);
            window.location.href='/login';
        } catch (error) {
            console.log(error.message);
        }
    };

    return (
        <div className="d-flex justify-content-center">
        <Row className="justify-content-center">
            <Col>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center h5">Register</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className="mb-3 position-relative">
                            <FaUser style={{alignSelf:"anchor-center", paddingLeft:"3px"}}
                                className="position-absolute text-muted" />
                            <Input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{paddingLeft: "20px"}} />
                        </div>
                        <div className="mb-3 position-relative">
                            <FaEnvelope style={{alignSelf:"anchor-center", paddingLeft:"3px"}}
                                className="position-absolute text-muted" />
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{paddingLeft: "20px"}} />
                        </div>
                        <div className="mb-3 position-relative">
                            <FaLock style={{alignSelf:"anchor-center", paddingLeft:"3px"}}
                                className="position-absolute text-muted" />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{paddingLeft: "20px"}} />
                        </div>
                        <div className="mb-3 position-relative">
                            <FaLock style={{alignSelf:"anchor-center", paddingLeft:"3px"}}
                                className="position-absolute text-muted" />
                            <Input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{paddingLeft: "20px"}} />
                        </div>
                        <div className="mb-3 position-relative">
                            <FaHome style={{alignSelf:"anchor-center", paddingLeft:"3px"}}
                                className="position-absolute text-muted" />
                            <Input
                                type="text"
                                placeholder="Address (Optional)"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={{paddingLeft: "20px"}} />
                        </div>
                        <div className="mb-3 position-relative">
                            <FaGlobe style={{alignSelf:"anchor-center", paddingLeft:"3px"}}
                                className="position-absolute text-muted" />
                            <Input
                                type="url"
                                placeholder="Portfolio URL (Optional)"
                                value={portfolio}
                                onChange={(e) => setPortfolio(e.target.value)}
                                style={{paddingLeft: "20px"}} />
                        </div>
                        <Button color="primary" className="w-100" onClick={handleRegister}>Register</Button>
                    </CardBody>
                </Card>
            </Col>
        </Row>
        </div>
    );
}


export default Register;