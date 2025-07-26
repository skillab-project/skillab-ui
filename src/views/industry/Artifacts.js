import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Row,
  Col } from "reactstrap";
import axios from 'axios';
import '../../assets/css/industry.css';


function Artifacts() {
    const [repos, setRepos] = useState([]);
    const [repoCreation, setRepoCreation] = useState(false);
    const [selectedRepoForEdit, setSelectedRepoForEdit] = useState(null);
    const [formData, setFormData] = useState({
        repo_name: '',
        url: '',
        organization: '',
        description: '',
        comments: '',
      });

    const handleSelectAddRepo = () => {
        setRepoCreation(true);
        setSelectedRepoForEdit(null);
        setFormData({repo_name: '',
            url: '',
            organization: '',
            description: '',
            comments: ''});
    };
    
    const handleEditRepo = (repo) => {
        setRepoCreation(false);
        setSelectedRepoForEdit(repo);
        setFormData({
            repo_name: repo.name,
            url: repo.url,
            organization: repo.organization,
            description: repo.description,
            comments: repo.comments
        });
    };

    const handleDeleteRepo = async (repoName) => {
        try {
          const response = await fetch(process.env.REACT_APP_API_URL_KU+`/delete_repo/${encodeURIComponent(repoName)}`, {
            method: 'DELETE',
          });
    
          if (!response.ok) {
            throw new Error('Failed to delete repository');
          }
          setRepos(repos.filter((repo) => repo.name !== repoName));
        } catch (error) {
          console.error('Error deleting repo:', error);
        }
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSave = () => {
        if (selectedRepoForEdit!=null) {
          handleUpdate();
        } else {
          handleCreate();
        }
        setFormData({repo_name: '',
            url: '',
            organization: '',
            description: '',
            comments: ''})
    };

    const handleUpdate = async () => {
        try {
          const response = await axios.put(process.env.REACT_APP_API_URL_KU+`/repos/${formData.repo_name}`, {
            url: formData.url,
            organization: formData.organization,
            description: formData.description,
            comments: formData.comments
          });
          console.log('Success:', response.data);
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred while updating the repository.');
        }
    };

    const handleCreate = async () => {
        try {
            const response = await axios.post(process.env.REACT_APP_API_URL_KU+`/repos`, formData);
            console.log('Success:', response.data);
            getRepos();
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred while creating the repository.');
        }
    };



    const getRepos = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_KU + "/repos")
            .then((res) => {
                console.log("repos: "+res.data);
                setRepos(res.data);
            });
    };

    useEffect(() => {
        getRepos();
    }, []);
    

    return (
        <div className="content">
            <Row>
                <Col md="6" xl="4">
                    <Card>
                        <CardBody>
                            <div className="flex justify-start p-6">
                                <div className="w-full max-w-md">
                                    <Button
                                        onClick={handleSelectAddRepo}
                                        className="btn-round"
                                        color="info"
                                        type="submit">
                                            Add Repository
                                    </Button>
                                    <ul className="space-y-4" style={{listStyle: "none", padding: "0px"}}>
                                        {repos.map((repo) => (
                                        <li
                                            key={repo.name}
                                            className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm ${
                                            repo.name === (selectedRepoForEdit?.repo_name || '') ? 'bg-blue-100' : 'bg-white'
                                            }`}
                                        >
                                            <div style={{display:"flex", alignItems:"center",justifyContent:"space-between" }}>
                                                <span className="text-lg font-semibold text-gray-900">{repo.name}</span>
                                                <div>
                                                    <button
                                                        onClick={() => handleEditRepo(repo)}
                                                        className="p-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition duration-300"
                                                        aria-label={`Edit ${repo.name}`}
                                                        style={{margin:"2px"}}
                                                    >
                                                        <i className="fas fa-edit text-lg"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRepo(repo.name)}
                                                        className="p-1 bg-gray-100 text-red-600 rounded-full hover:bg-red-200 transition duration-300"
                                                        aria-label={`Delete ${repo.name}`}
                                                        style={{margin:"2px"}}
                                                    >
                                                        <i className="fas fa-trash text-lg"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col md="6" xl="8">
                    <Card>
                        <CardHeader>
                            {selectedRepoForEdit!=null ? 'Edit Repository' : 'Create Repository'}
                        </CardHeader>
                        <CardBody className="industry-my-artifact" >
                            <input
                                type="text"
                                name="repo_name"
                                value={formData.repo_name}
                                onChange={handleInputChange}
                                placeholder="Repository Name"
                                required
                            />
                            <input
                                type="text"
                                name="url"
                                value={formData.url}
                                onChange={handleInputChange}
                                placeholder="URL"
                            />
                            <input
                                type="text"
                                name="organization"
                                value={formData.organization}
                                onChange={handleInputChange}
                                placeholder="Organization"
                            />
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Description"
                            />
                            <textarea
                                name="comments"
                                value={formData.comments}
                                onChange={handleInputChange}
                                placeholder="Comments"
                            />
                            <Button
                                onClick={handleSave}
                                className="btn-round"
                                color="success"
                                type="submit">
                                    {selectedRepoForEdit!=null ? 'Update Repo' : 'Create Repo'}
                            </Button>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Artifacts;