import React, { useState } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardTitle,
    Row,
    Col,
    Button,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane
  } from "reactstrap";

const CourseSources = () => {
    //CV
    const [data, setData] = useState([
        { source: "Source 1", url: "https://www.example1.com" },
        { source: "Source 2", url: "https://www.example2.com" },
        { source: "Source 3", url: "https://www.example3.com" },
    ]);
    const handleCVSourceClick = (source) => {
        console.log("Source clicked:", source);
        alert(`You clicked on source: ${source}`);
    };

    return (
        <Card>
            <CardBody>
                <table border="1" >
                    <thead>
                    <tr>
                        <th>Source</th>
                        <th>URL</th>
                    </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index}>
                            <td>
                                <button
                                    onClick={() => handleCVSourceClick(item.source)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "blue",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                    }}
                                    >
                                    {item.source}
                                </button>
                            </td>
                            <td>
                                {item.url}
                            </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardBody>
        </Card>
    );
}
export default CourseSources;