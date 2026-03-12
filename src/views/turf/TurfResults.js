import React from "react";
import { Table, Badge, Card, CardBody } from "reactstrap";

const TurfResults = ({ data }) => {
    // 1. Safety check for data existence
    if (!data || !Array.isArray(data) || data.length === 0) {
        return <div className="text-center p-4">No analysis data available.</div>;
    }

    // Helper to clean up ESCO URIs
    const formatSkill = (uri) => {
        if (!uri) return "Unknown Skill";
        return uri.replace("http://data.europa.eu/esco/skill/", "");
    };

    return (
        <div className="mt-4">
            <Card className="shadow-sm">
                <CardBody>
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 className="text-primary m-0">Analysis Results</h6>
                        <Badge color="secondary">
                            {/* Use optional chaining and fallback for key names */}
                            Combination Size: {data[0]?.["Combination Number"] || data[0]?.["combination_number"] || "N/A"}
                        </Badge>
                    </div>
                    
                    <Table responsive hover size="sm">
                        <thead className="text-info">
                            <tr>
                                <th style={{ width: "50px" }}>Rank</th>
                                <th>Skill Combination</th>
                                <th className="text-center">Reach</th>
                                <th className="text-center">Reach %</th>
                                <th className="text-center">Frequency</th>
                                <th className="text-center">Ratio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => {
                                // 2. Robust key handling (handles "Combination" or "combination")
                                const combinationStr = item?.Combination || item?.combination || "";
                                const skills = combinationStr ? combinationStr.split('+') : [];

                                return (
                                    <tr key={idx}>
                                        <td className="align-middle">
                                            <Badge color="info" pill>{idx + 1}</Badge>
                                        </td>
                                        <td className="align-middle">
                                            {skills.length > 0 ? (
                                                skills.map((skill, sIdx) => (
                                                    <div key={sIdx} className="mb-1 d-flex align-items-center">
                                                        <Badge color="light" className="text-dark border mr-2" style={{fontSize: '9px', minWidth: '45px'}}>
                                                            Skill {sIdx + 1}
                                                        </Badge>
                                                        <small className="text-muted text-truncate" style={{maxWidth: '300px'}}>
                                                            {formatSkill(skill)}
                                                        </small>
                                                    </div>
                                                ))
                                            ) : (
                                                <small className="text-danger">Invalid Data</small>
                                            )}
                                        </td>
                                        <td className="text-center align-middle font-weight-bold">
                                            {item?.Reach?.toLocaleString() || 0}
                                        </td>
                                        <td className="text-center align-middle">
                                            <Badge color="success" outline>
                                                {item?.["Reach %"] || item?.["reach_percent"] || 0}%
                                            </Badge>
                                        </td>
                                        <td className="text-center align-middle text-secondary">
                                            {item?.Frequency?.toLocaleString() || 0}
                                        </td>
                                        <td className="text-center align-middle">
                                            <small>{item?.["Frequency Ratio"] || item?.["frequency_ratio"] || 0}</small>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
};

export default TurfResults;