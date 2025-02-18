import React, { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardTitle,
    Row,
    Col,
    Button,
    Input,
    Modal,
    Table
  } from "reactstrap";
import { FaEdit, FaTrash, FaCheckSquare, FaRegSquare } from "react-icons/fa";
import axios from "axios";
import { useLocation } from 'react-router-dom';

const JobSources = () => {
    const [sources, setSources] = useState([]);
    const [jobCounts, setJobCounts] = useState({});
    const [selectedSources, setSelectedSources] = useState(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [name, setName] = useState("");
    const [selectAll, setSelectAll] = useState(false);

    const location = useLocation();
    const isCitizenPath = location.pathname.startsWith('/citizen');

    useEffect(() => {
        axios.get(process.env.REACT_APP_API_URL_TRACKER+"/api/jobs/sources").then((response) => {
            setSources(response.data);
            response.data.forEach((source) => {
                fetchJobCount(source);
            });
        });
    }, []);

    const fetchJobCount = async (source) => {
        try {
          const response = await axios.post(process.env.REACT_APP_API_URL_TRACKER+"/api/jobs?page=1", new URLSearchParams({ sources: source }), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
          });
          setJobCounts((prev) => ({ ...prev, [source]: response.data.count }));
        } catch (error) {
          setJobCounts((prev) => ({ ...prev, [source]: "Error" }));
        }
    };

    const handleCheckboxChange = (source) => {
        setSelectedSources((prev) => {
            const newSelection = new Set(prev);
            newSelection.has(source) ? newSelection.delete(source) : newSelection.add(source);
            return newSelection;
        });
    };

    const handleImport = () => {
        setIsModalOpen(true);
    };

    const handleFileChange = (event) => {
        setCsvFile(event.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!csvFile || !name) {
            alert("Please provide a name and upload a CSV file.");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("file", csvFile);

        try {
            await axios.post("http://localhost/api/jobs/sources/new", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            });
            alert("File uploaded successfully!");
            setIsModalOpen(false);
            setName("");
            setCsvFile(null);
        } catch (error) {
            alert("Error uploading file.");
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
          setSelectedSources(new Set());
        } else {
          setSelectedSources(new Set(sources));
        }
        setSelectAll(!selectAll);
    };

    const handleClickUpdate = (source) => {
        if(!isCitizenPath){
            console.log(`Update clicked for ${source}`);
        }
    };
    
    const handleClickDelete = (source) => {
        if(!isCitizenPath){
            console.log(`Delete clicked for ${source}`);
        }
    };

    return (
        <Card>
            <CardBody>
                <Table striped>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th className="text-center" onClick={handleSelectAll} style={{ cursor: "pointer" }}>
                            {selectAll ? <FaCheckSquare /> : <FaRegSquare />} 
                        </th>
                        {/* <th>Select</th> */}
                        <th>Source</th>
                        <th>Job Count</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sources.map((source, index) => (
                        <tr key={source}>
                        <td>{index + 1}</td>
                        <td className="text-center">
                            <input
                            type="checkbox"
                            checked={selectedSources.has(source)}
                            onChange={() => handleCheckboxChange(source)}
                            />
                        </td>
                        <td>{source}</td>
                        <td>{jobCounts[source] ?? "Loading..."}</td>
                        <td className="text-center">
                            <Button style={{ marginRight: "5px", backgroundColor: isCitizenPath ? "#d3d3d3" : "", borderColor: isCitizenPath ? "#d3d3d3" : "" }} 
                                    color="warning" size="sm" className="me-2"
                                    onClick={() => handleClickUpdate(source)}
                                    disabled={isCitizenPath}>
                                <FaEdit />
                            </Button>
                            <Button style={{ backgroundColor: isCitizenPath ? "#d3d3d3" : "", borderColor: isCitizenPath ? "#d3d3d3" : "" }} 
                                    color="danger" size="sm"
                                    onClick={() => handleClickDelete(source)}
                                    disabled={isCitizenPath}>
                                <FaTrash />
                            </Button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
                <Button color="info" onClick={handleImport} className="mt-4">Import</Button>
                
                <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)}>
                    <div className="modal-header">
                    <h2 className="modal-title">Import Job Source</h2>
                    <button type="button" className="close" onClick={() => setIsModalOpen(false)}>&times;</button>
                    </div>
                    <div className="modal-body">
                    <Input
                        type="text"
                        placeholder="Enter name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="my-2"
                    />
                    <Input type="file" accept=".csv" onChange={handleFileChange} className="my-2" />
                    </div>
                    <div className="modal-footer">
                    <Button color="success" onClick={handleSubmit}>Submit</Button>
                    <Button color="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    </div>
                </Modal>
            </CardBody>
        </Card>
    );
}
export default JobSources;