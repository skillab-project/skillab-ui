import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardBody, CardTitle, CardFooter, Row, Col, Button } from "reactstrap";

// 1. Color Generator for Bubbles
const generateColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 65%, 45%)`;
};

// 2. Hash Function for Stable Random Positions
const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; 
    }
    return Math.abs(hash);
};

function TopTypeFrequency({ data }) {
    const [visibleNumber, setVisibleNumber] = useState(10);
    const [processedData, setProcessedData] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    useEffect(() => {
        if (data && data.length > 0) {
            const sliced = data.slice(0, visibleNumber);
            const maxFreq = Math.max(...data.map(item => item.frequency || 0));
            
            const MIN_BUBBLE_SIZE = 55; 
            const MAX_BUBBLE_SIZE = 135; 
            const PADDING_MIN = 15; 
            const PADDING_MAX = 85; 
            const RANGE = PADDING_MAX - PADDING_MIN;

            const formatted = sliced.map((item) => {
                const frequency = item.frequency || 0;
                const size = MIN_BUBBLE_SIZE + (frequency / maxFreq) * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE);

                const hashValue = getHash(item.type);
                const top = (hashValue % RANGE) + PADDING_MIN;
                const left = ((hashValue >> 7) % RANGE) + PADDING_MIN;

                return {
                    type: item.type,
                    frequency: frequency,
                    color: generateColor(item.type),
                    size: size,
                    top: `${top}%`,
                    left: `${left}%`,
                };
            });
            setProcessedData(formatted);
        }
    }, [data, visibleNumber]);

    const handleMore = () => {
        setVisibleNumber(prev => prev + 10);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Top Types</CardTitle>
            </CardHeader>
            <CardBody>
                {processedData.length > 0 && (
                    <Row>
                        {/* Left Side: Bubbles (Keep dynamic colors) */}
                        <Col sm="12" md="6">
                            <div style={{
                                height: "550px",
                                position: "relative",
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                {processedData.map((item, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            position: "absolute",
                                            top: item.top,
                                            left: item.left,
                                            width: `${item.size}px`,
                                            height: `${item.size}px`,
                                            transform: "translate(-50%, -50%)",
                                            borderRadius: "50%",
                                            backgroundColor: item.color,
                                            color: 'white',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            boxShadow: hoveredIndex === idx 
                                                ? '0 8px 16px rgba(0,0,0,0.3)' 
                                                : '0 4px 8px rgba(0,0,0,0.15)',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            zIndex: hoveredIndex === idx ? 100 : idx,
                                            padding: '10px',
                                            border: '2px solid white'
                                        }}
                                        onMouseEnter={() => setHoveredIndex(idx)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        <div style={{
                                            fontSize: item.size > 90 ? '0.85rem' : '0.65rem',
                                            fontWeight: 'bold',
                                            lineHeight: '1.2'
                                        }}>
                                            {item.type}
                                        </div>
                                        {(hoveredIndex === idx || item.size > 110) && (
                                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                                {item.frequency.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Col>

                        {/* Right Side: Bar Chart (Restored to original Orange color) */}
                        <Col sm="12" md="6">
                            <ResponsiveContainer width="100%" height={Math.max(processedData.length * 40, 550)}>
                                <BarChart
                                    data={processedData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                                    barSize={20}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis 
                                        dataKey="type" 
                                        type="category" 
                                        width={140} 
                                        tick={{fontSize: 11}} 
                                    />
                                    <Tooltip />
                                    {/* Restored the simple orange fill */}
                                    <Bar dataKey="frequency" fill="#f39423" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Col>
                    </Row>
                )}
            </CardBody>
            
            {data && data.length > visibleNumber && (
                <CardFooter className="text-center">
                    <Button color="success" outline onClick={handleMore}>
                        More
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

export default TopTypeFrequency;