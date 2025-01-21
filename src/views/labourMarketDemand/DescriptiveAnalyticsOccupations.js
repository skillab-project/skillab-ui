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
import TopCountries from "./TopCountries";


function DescriptiveAnalyticsOccupations(props) {
    const [dataOccupations, setDataOccupations] = useState(props.data);
    const [dataOccupationsShown, setDataOccupationsShown] = useState([]);
    const [dataOccupationsShownNumber, setDataOccupationsShownNumber] = useState(0);


    useEffect(() => {
        if(dataOccupations){
            setDataOccupationsShown(dataOccupations.slice(0, 10));
            setDataOccupationsShownNumber(10);
        }
    }, []);


    const handleMoreOccupations = () => {
        setDataOccupationsShown(dataOccupations.slice(0, dataOccupationsShownNumber+10));
        setDataOccupationsShownNumber(dataOccupationsShownNumber+10);
    }

    
    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Descriptive Analytics</CardTitle>
            </CardHeader>
            <CardBody>
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h6">Top Occupations</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <ResponsiveContainer width="100%" height={dataOccupationsShown.length * 60}>
                                    <BarChart
                                        data={dataOccupationsShown}
                                        layout="vertical"
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        barSize={30}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="label" type="category" width={200} />
                                        <Tooltip />
                                        <Bar dataKey="Freq" fill="#f39423"/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardBody>
                            {dataOccupationsShown.length>0 &&
                                <CardFooter>
                                    <Button
                                            color="success"
                                            outline
                                            size="m"
                                            onClick={() => handleMoreOccupations()}
                                        >
                                            More
                                    </Button>
                                </CardFooter>
                            }
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col md="12">
                        {(props.dataCountries && props.dataCountries.length>0) ?
                            <TopCountries data={props.dataCountries}/>
                            :
                            <div class="lds-dual-ring"></div>
                        }
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
}

export default DescriptiveAnalyticsOccupations;