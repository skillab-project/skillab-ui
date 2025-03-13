import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, Dropdown, DropdownMenu, DropdownToggle, DropdownItem } from 'reactstrap';
import axios from 'axios';

const ProgramSelection = ({onApplySelection}) => {
    const [departments, setDepartments] = useState([]);
    const [dropdownOpenDepartment, setDropdownOpenDepartment] = useState(false);
    const [selectedItemDepartment, setSelectedItemDepartment] = useState('Select Department');
    const [programs, setPrograms] = useState([]);
    const [dropdownOpenProgram, setDropdownOpenProgram] = useState(false);
    const [selectedItemProgram, setSelectedItemProgram] = useState('Select Program');

    const toggleDepartment = () => setDropdownOpenDepartment((prevState) => !prevState);
    const toggleProgram = () => setDropdownOpenProgram((prevState) => !prevState);

    const handleSelectDepartment = (item) => {
        setSelectedItemDepartment(item);
    };
    const handleSelectProgram = (item) => {
        setSelectedItemProgram(item);
    };

    // Fetch Programms
    useEffect(() => {
        const fetchPrograms = async () => {
        };
    
        fetchPrograms();
    }, []);

    


    // Handle Apply Filter Button
    const handleApplyFilter = () => {
        if(selectedItemDepartment!="Select Department" && selectedItemProgram!="Select Program"){
            if (onApplySelection) {
                onApplySelection(selectedItemDepartment, selectedItemProgram);
            }
        }
    };

    return (
        <Card>
            <CardBody>
                <Row>
                    <Col md="6">
                        Select Department: 
                        <Dropdown isOpen={dropdownOpenDepartment} toggle={toggleDepartment}>
                            <DropdownToggle caret>
                                {selectedItemDepartment}
                            </DropdownToggle>
                            <DropdownMenu right>
                                <DropdownItem onClick={() => handleSelectDepartment('1')}>1</DropdownItem>
                                <DropdownItem onClick={() => handleSelectDepartment('2')}>2</DropdownItem>
                                <DropdownItem onClick={() => handleSelectDepartment('3')}>3</DropdownItem>
                                <DropdownItem onClick={() => handleSelectDepartment('4')}>4</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </Col>
                    <Col md="6">
                        Select Program: 
                        <Dropdown isOpen={dropdownOpenProgram} toggle={toggleProgram}>
                            <DropdownToggle caret>
                                {selectedItemProgram}
                            </DropdownToggle>
                            <DropdownMenu right>
                                <DropdownItem onClick={() => handleSelectProgram('11')}>11</DropdownItem>
                                <DropdownItem onClick={() => handleSelectProgram('22')}>22</DropdownItem>
                                <DropdownItem onClick={() => handleSelectProgram('33')}>33</DropdownItem>
                                <DropdownItem onClick={() => handleSelectProgram('44')}>44</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </Col>
                    <Col md="12">
                        <Button
                            className="btn-round"
                            color="info"
                            onClick={handleApplyFilter}
                            style={{
                                margin: "auto",
                                marginTop: '15px',
                                display: "block"
                            }}
                        >
                            Apply
                        </Button>
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
};

export default ProgramSelection;