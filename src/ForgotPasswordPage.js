import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody, Card, CardBody, CardHeader, CardTitle, Row, Col
} from "reactstrap";
import axios from "axios";

function ForgotPasswordPage() {
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (email === "") {
            setError(true);
            setErrorMessage("Please enter your email address.");
            return;
        }
        setLoading(true);

        const url = process.env.REACT_APP_API_URL_USER_MANAGEMENT + "/user/reset-password/request?userEmail=" + email;
        axios
            .post(url)
            .then((response) => {
                setShowModal(true);
                setLoading(false);
            })
            .catch((error) => {
                setError(true);
                setErrorMessage(error.response?.data?.message || "Something went wrong.");
                setLoading(false);
            });
    };

    return (
        <div className="d-flex justify-content-center">
            <Row className="justify-content-center">
                <Col>
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center h5">Forgot Password</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <p className="text-center">
                                Enter your email address and we will send you a link to reset your password.
                            </p>

                            {error && (
                                <Alert color="danger">
                                    {errorMessage}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <FormGroup>
                                    <Label for="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </FormGroup>

                                <Button color="primary" block disabled={loading}>
                                    {loading ? "Sending..." : "Send Password Reset Link"}
                                </Button>
                            </Form>

                            <Modal isOpen={showModal} toggle={() => setShowModal(false)}>
                                <ModalHeader toggle={() => setShowModal(false)}>
                                    Password Reset
                                </ModalHeader>
                                <ModalBody>
                                    <Alert color="info">Password reset link sent!</Alert>
                                    We sent you an email to reset your password. Please check your inbox and follow the
                                    instructions.
                                    <br />
                                    <br />
                                    <strong>The link will expire in 5 minutes.</strong>
                                </ModalBody>
                            </Modal>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default ForgotPasswordPage;
