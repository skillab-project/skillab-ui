import React, { useState, useEffect  } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Legend,LineChart,Line} from "recharts";
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
    TabPane,
    CardSubtitle
  } from "reactstrap";


function DescriptiveAnalytics(props) {
    const [dataSkills, setDataSkills] = useState(props.data);
    const [dataSkillsShown, setDataSkillsShown] = useState([]);
    const [dataSkillsShownNumber, setDataSkillsShownNumber] = useState(0);


    useEffect(() => {
        if(dataSkills){
            setDataSkillsShown(dataSkills.slice(0, 10));
            setDataSkillsShownNumber(10);
        }
    }, []);


    const handleMoreSkills = () => {
        setDataSkillsShown(dataSkills.slice(0, dataSkillsShownNumber+10));
        setDataSkillsShownNumber(dataSkillsShownNumber+10);
    }

    
    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Top Instances</CardTitle>
            </CardHeader>
            <CardBody>
                
                <ResponsiveContainer width="100%" height={dataSkillsShown.length * 60}>
                    <BarChart
                        data={dataSkillsShown}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={30}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="label" type="category" width={200} />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div style={{
                                            background: "#fff",
                                            border: "1px solid #ccc",
                                            borderRadius: 6,
                                            padding: "10px 14px",
                                            maxWidth: 320,
                                            fontSize: 13,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
                                        }}>
                                            <strong>{d.label}</strong>
                                            <div style={{ marginTop: 6, color: "#555", lineHeight: 1.5 }}>
                                                {d?.tooltip}
                                            </div>
                                            <div style={{ marginTop: 8, color: "#f39423", fontWeight: 600 }}>
                                                Frequency: {d.Freq}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="Freq" fill="#f39423"/>
                    </BarChart>
                </ResponsiveContainer>
            </CardBody>
            {dataSkillsShown.length>0 &&
                <CardFooter>
                    <Button
                            color="success"
                            outline
                            size="m"
                            onClick={() => handleMoreSkills()}
                        >
                            More
                    </Button>
                </CardFooter>
            }
        </Card>
    );
}

export default DescriptiveAnalytics;