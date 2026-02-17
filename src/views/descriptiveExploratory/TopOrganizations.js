import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardBody, CardTitle, Row, Col } from "reactstrap";

// --- Helper Component for Avatars with Image Fallback (Unchanged) ---
function OrganizationAvatar({ src, alt, name, style }) {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [src]);

    const handleError = () => {
        setError(true);
    };

    if (error) {
        return (
            <div
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    color: '#666',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    padding: '5px',
                    boxSizing: 'border-box'
                }}
            >
                {name}
            </div>
        );
    }

    return <img src={src} alt={alt} style={style} onError={handleError} />;
}


// --- Main Component with Improved Layout Logic ---
function TopOrganizations({ data }) {
    const [orgData, setOrgData] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    useEffect(() => {
        if (data && data.length > 0) {
            const maxFreq = Math.max(...data.map(item => item.count || item.frequency || 0));
            
            // --- NEW: Adjusted Constants for Avatar Sizing to make them smaller ---
            const MIN_AVATAR_SIZE = 35;  // Reduced from 50
            const MAX_AVATAR_SIZE = 90; // Reduced from 150

            // --- NEW: Constants for Positioning to create a "safe zone" ---
            // This prevents avatars from spawning too close to the container edges.
            const POSITION_PADDING_MIN = 10; // e.g., don't start before 10%
            const POSITION_PADDING_MAX = 90; // e.g., don't start after 90%
            const POSITION_RANGE = POSITION_PADDING_MAX - POSITION_PADDING_MIN;

            const formatted = data.map(item => {
                const frequency = item.count || item.frequency || 0;
                
                const size = MIN_AVATAR_SIZE + (frequency / maxFreq) * (MAX_AVATAR_SIZE - MIN_AVATAR_SIZE);

                // --- NEW: Calculate position within the safe zone ---
                const randomTop = Math.random() * POSITION_RANGE + POSITION_PADDING_MIN;
                const randomLeft = Math.random() * POSITION_RANGE + POSITION_PADDING_MIN;

                return {
                    organization: item.organization,
                    frequency: frequency,
                    avatarUrl: `https://github.com/${item.organization}.png`,
                    size: size,
                    top: `${randomTop}%`,
                    left: `${randomLeft}%`,
                };
            });
            setOrgData(formatted);
        }
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Top Organizations</CardTitle>
            </CardHeader>
            <CardBody>
                {orgData.length > 0 && (
                    <Row>
                        {/* Left side: Avatar Bubble Chart */}
                        <Col sm="12" md="6">
                            <div style={{
                                height: "500px",
                                position: "relative",
                                border: '1px solid #eee',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                {orgData.map((org, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            position: "absolute",
                                            top: org.top,
                                            left: org.left,
                                            transform: "translate(-50%, -50%)",
                                            textAlign: "center",
                                            cursor: 'pointer',
                                            transition: 'transform 0.3s ease-in-out',
                                        }}
                                        onMouseEnter={() => setHoveredIndex(idx)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        <OrganizationAvatar
                                            src={org.avatarUrl}
                                            alt={org.organization}
                                            name={org.organization}
                                            style={{
                                                width: `${org.size}px`,
                                                height: `${org.size}px`,
                                                borderRadius: "50%",
                                                border: "3px solid #ddd",
                                                backgroundColor: "white",
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        
                                        {hoveredIndex === idx && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'white',
                                                borderRadius: '50%',
                                                pointerEvents: 'none',
                                                opacity: 1,
                                                transition: 'opacity 0.3s'
                                            }}>
                                                <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{org.frequency}</div>
                                                <div style={{fontSize: '0.8rem'}}>{org.organization}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Col>

                        {/* Right side: Bar Chart (unchanged) */}
                        <Col sm="12" md="6">
                            <ResponsiveContainer width="100%" height={500}>
                                <BarChart
                                    data={orgData}
                                    layout="vertical"
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    barSize={30}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="organization" type="category" width={100} tick={{fontSize: 12}} />
                                    <Tooltip />
                                    <Bar dataKey="frequency" fill="#f39423"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    );
}

export default TopOrganizations;