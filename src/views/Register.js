import { useState, useRef } from "react";
import { Input, Button, Card, CardBody, CardHeader, CardTitle, Row, Col } from "reactstrap";
import { FaUser, FaEnvelope, FaLock, FaHome, FaGlobe } from "react-icons/fa";
import NotificationAlert from "react-notification-alert";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [address, setAddress] = useState("");
    const [portfolio, setPortfolio] = useState("");

    const notificationAlert = useRef();
    const notify = (message) => {
        var options = {
        place: "tr",
        message: (
            <div>
            <div>
                {message}
            </div>
            </div>
        ),
        type: "danger",
        icon: "nc-icon nc-bell-55",
        autoDismiss: 7,
        };
        notificationAlert.current.notificationAlert(options);
    }

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            notify("Please fill in all required fields.");
            return;
        }
        if (password !== confirmPassword) {
            notify("Passwords do not match.");
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
                notify("Registration failed");
                throw new Error(data.message || "Registration failed");
            }
            
            console.log("Registration successful", data);
            window.location.href='/login';
        } catch (error) {
            console.log(error.message);
        }
    };

    return (
    <div className="content">
        <NotificationAlert ref={notificationAlert} />
        <Row style={{justifyContent:"center"}}>
            <Col sm="12" md="6" lg="4">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center h5">Register</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={(e) => { e.preventDefault(); }}>
                            <div style={{ marginBottom: "1rem", position: "relative" }}>
                                <FaUser style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)", color: "#999" }} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{ paddingLeft: "30px", width: "100%", height: "2.5rem" }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem", position: "relative" }}>
                                <FaEnvelope style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)", color: "#999" }} />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ paddingLeft: "30px", width: "100%", height: "2.5rem" }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem", position: "relative" }}>
                                <FaLock style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)", color: "#999" }} />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingLeft: "30px", width: "100%", height: "2.5rem" }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem", position: "relative" }}>
                                <FaLock style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)", color: "#999" }} />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ paddingLeft: "30px", width: "100%", height: "2.5rem" }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem", position: "relative" }}>
                                <FaHome style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)", color: "#999" }} />
                                <input
                                    type="text"
                                    placeholder="Address (Optional)"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    style={{ paddingLeft: "30px", width: "100%", height: "2.5rem" }}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem", position: "relative" }}>
                                <FaGlobe style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)", color: "#999" }} />
                                <input
                                    type="url"
                                    placeholder="Portfolio URL (Optional)"
                                    value={portfolio}
                                    onChange={(e) => setPortfolio(e.target.value)}
                                    style={{ paddingLeft: "30px", width: "100%", height: "2.5rem" }}
                                />
                            </div>

                            <Button type="submit" color="primary" className="w-100" onClick={handleRegister}>Register</Button>
                        </form>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    </div>
    );
}


export default Register;