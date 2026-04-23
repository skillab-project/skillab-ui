import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup, Badge, Table, Modal, ModalHeader, ModalBody
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';




const ProgramAndNeeds = () => {
 

    return (
        <div className="content">
            <Card>
                <CardHeader>
                    <div className="d-flex justify-content-between align-items-center">
                        <CardTitle tag="h4" className="mb-0">Program and Needs</CardTitle>
                    </div>
                </CardHeader>
                <CardBody>
                </CardBody>
            </Card>
        </div>
    );
}

export default ProgramAndNeeds;