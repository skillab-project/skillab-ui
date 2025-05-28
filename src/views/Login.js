import { useState, useEffect, useRef } from "react";
import {Button, Card, CardTitle, CardHeader, CardBody, Row, Col, Input } from "reactstrap";
import { FaLock, FaEnvelope } from "react-icons/fa";
import NotificationAlert from "react-notification-alert";
import {isAuthenticated} from "../utils/Tokens";
import { authenticateTracker } from "utils/TrackerAuth";
import { isAuthenticatedTracker } from "utils/TrackerAuth";



const InitPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [invalidLoginRequest, setInvalidLoginRequest] = useState(false);

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

    const handleLogin = async () => {
        console.log("Logging in with", { email, password });
        setLoadingAuth(true);
        try {
            var urlencoded = new URLSearchParams();
            urlencoded.append("email", email);
            urlencoded.append("password", password);

            const response = await fetch(process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/login", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: urlencoded,
            });
            if(response.status === 200) {
                var body = await response.json();
                localStorage.setItem("accessTokenSkillab", body.accessToken);
                localStorage.setItem("refreshTokenSkillab", body.refreshToken);

                //authenticate Tracker
                await authenticateTracker();

                if(await isAuthenticated()){
                    // toDO
                    //depending on roles
                    window.location.href='/citizen';
                }
            }
            else if(response.status === 401 || response.status === 403) {
                notify("Invalid email or password");
                setInvalidLoginRequest(true);
            }
            else {
                console.log("API error");
            }
        } catch (error) {
            console.error("Error:", error);
        }
        setLoadingAuth(false);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const authStatus = await isAuthenticated();
            if (authStatus) {
                await isAuthenticatedTracker();

                // toDO
                //depending on installation
                if(process.env.REACT_APP_INSTALLATION=="citizen")
                    window.location.href='/citizen/account';
            }
        };
    
        checkAuth();
    }, []);

    return (
    <div className="content">
        <NotificationAlert ref={notificationAlert} />
        <Row style={{justifyContent:"center"}}>
            <Col sm="12" md="6" lg="4"> 
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center h5">Login</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={(e) => { e.preventDefault(); }}>
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

                            {loadingAuth ?
                                <div class="lds-dual-ring" style={{display:"flex", justifySelf:"center"}}></div> :
                                <>
                                    <Button type="submit" color="success" className="w-100" onClick={handleLogin}>Login</Button>
                                    <Button color="primary" className="w-100" onClick={() => window.location.href='/register'}>Register</Button>
                                    {invalidLoginRequest ?
                                        <a href="/forgot-password" className="text-decoration-none text-danger">
                                            <i className="fas fa-question-circle me-1"></i>
                                            Forgot your password?
                                        </a>
                                        :
                                        <></>
                                    }
                                </>
                            }
                        </form>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    </div>
    )};

export default InitPage;