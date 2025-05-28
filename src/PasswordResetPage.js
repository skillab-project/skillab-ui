import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  CardSubtitle, Card, CardBody, CardHeader, CardTitle, Row, Col
} from 'reactstrap';
import { useLocation } from 'react-router-dom';
import axios from 'axios';


function PasswordResetPage() {
    const location = useLocation();
    const [showModal, setShowModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [render, setRender] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const uuid = params.get('uuid');
        const token = params.get('token');

        if (!uuid || !token) {
            window.location.href = '/';
        } else {
            setRender(true);
        }
    }, [location.search]);

    const handlePasswordReset = (e) => {
        e.preventDefault();

        if (!password || !repeatPassword) {
            setError(true);
            setErrorMessage('Please fill in all the fields');
            return;
        }
        if (password !== repeatPassword) {
            setError(true);
            setErrorMessage('Passwords do not match.');
            return;
        }
        if (password.length < 3) {
            setError(true);
            setErrorMessage('Password must be at least 3 characters long.');
            return;
        }

        setLoading(true);

        const params = new URLSearchParams(location.search);
        const token = encodeURIComponent(params.get('token'));
        const uuid = params.get('uuid');

        const url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/reset-password`;
        const data = { password, token, uuid };
        const headers = { 'Content-Type': 'application/json' };

        axios
            .put(url, data, { headers })
            .then(() => {
                setLoading(false);
                setShowModal(true);
                window.open('/login', '_self');
            })
            .catch((error) => {
                console.error(error.response);
                setError(true);
                setLoading(false);
                setErrorMessage(error.response?.data?.message || 'An error occurred.');
            });
    };

    return (
        <>
            {render && (
                <div className="d-flex justify-content-center">
                    <Row className="justify-content-center">
                        <Col>
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-center h5">Reset Password</CardTitle>
                                    <CardSubtitle>Enter your new password below</CardSubtitle>
                                </CardHeader>
                                <CardBody>
                                    {error && <Alert color="danger">{errorMessage}</Alert>}

                                    <Form onSubmit={handlePasswordReset}>
                                        <FormGroup>
                                            <Label for="password">New Password</Label>
                                            <div className="input-group">
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Enter new password"
                                                />
                                                <Button
                                                    type="button"
                                                    color="secondary"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                                </Button>
                                            </div>
                                        </FormGroup>

                                        <FormGroup>
                                            <Label for="repeatPassword">Repeat Password</Label>
                                            <div className="input-group">
                                                <Input
                                                    type={showRepeatPassword ? 'text' : 'password'}
                                                    id="repeatPassword"
                                                    value={repeatPassword}
                                                    onChange={(e) => setRepeatPassword(e.target.value)}
                                                    placeholder="Repeat password"
                                                />
                                                <Button
                                                    type="button"
                                                    color="secondary"
                                                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                                                >
                                                    <i className={`fa ${showRepeatPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                                </Button>
                                            </div>
                                        </FormGroup>

                                        <Button color="primary" type="submit" block disabled={loading}>
                                            {loading ? (
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                ) : (
                                                <>
                                                    <i className="bi bi-arrow-right-circle-fill" /> Reset Password
                                                </>
                                                )}
                                        </Button>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Modal isOpen={showModal} toggle={() => setShowModal(false)}>
                        <ModalHeader toggle={() => setShowModal(false)}>
                            <i className="bi bi-shield-lock-fill" /> Password Reset Success
                        </ModalHeader>
                        <ModalBody>
                            <Alert color="success">
                                <i className="bi bi-check-circle-fill" /> Password reset successful!
                            </Alert>
                            <p>
                                Your password has been reset successfully. You can now log in with your new password.
                            </p>
                            <a href="/" className="link">
                                Back to Home Page
                            </a>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={() => setShowModal(false)}>
                                Close
                            </Button>
                        </ModalFooter>
                    </Modal>
                </div>
            )}
        </>
    );
}

export default PasswordResetPage;