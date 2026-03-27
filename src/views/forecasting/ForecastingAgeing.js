import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Table,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Badge,
  Input,
  Label,
  FormGroup,
  Button,
  Alert
} from "reactstrap";
import axios from 'axios';
import classnames from 'classnames';
import OccupationSelection from '../coOccurrence/OccupationSelection';
import "../../assets/css/loader.css";

export const KU_NAMES = {
    "K1":  "Data Types",
    "K2":  "Operators and Decisions",
    "K3":  "Arrays",
    "K4":  "Loops",
    "K5":  "Methods and Encapsulation",
    "K6":  "Inheritance",
    "K7":  "Advanced Class Design",
    "K8":  "Generics and Collections",
    "K9":  "Functional Interfaces",
    "K10": "Stream API",
    "K11": "Exceptions",
    "K12": "Date Time API",
    "K13": "IO",
    "K14": "NIO",
    "K15": "String Processing",
    "K16": "Concurrency",
    "K17": "Databases",
    "K18": "Localization",
    "K19": "Java Persistence API",
    "K20": "Enterprise Java Beans",
    "K21": "Java Message Service API",
    "K22": "SOAP Web Services",
    "K23": "Servlets",
    "K24": "Java REST API",
    "K25": "Websockets",
    "K26": "Java Server Faces",
    "K27": "Contexts and Dependency Injection",
    "K28": "Batch Processing",
};
// Helper: given a raw KU id like "ku_1" or "K1", return the canonical key "K1"
export const normalizeKuId = (rawId) => {
    // Handle formats: "ku_1", "KU_1", "K1", "k1", "1"
    const match = String(rawId).match(/(\d+)$/);
    if (match) return `K${match[1]}`;
    return rawId;
};

const FormatKuSkill = ({ skill, parentDatasource }) => {
  const raw = formatSkillName(skill);

  if (parentDatasource !== 'ku') return <span>{raw}</span>;

  const key = normalizeKuId(raw);
  const name = KU_NAMES[key];

  if (!name) return <span>{raw}</span>;

  return (
    <span
      title={name}
      style={{ float: "left" }}
    >
      {`${key} – ${name}`}
    </span>
  );
};


const formatSkillName = (skill) => {
  if (typeof skill === 'string' && skill.startsWith('http')) {
    return skill.split('/').pop();
  }
  return skill;
};

const SummaryCard = ({ title, value }) => (
  <Col lg="3" md="6" sm="6">
    <Card className="card-stats">
      <CardBody>
        <Row>
          <Col xs="12">
            <div className="text-center">
              <p className="card-category">{title}</p>
              <CardTitle tag="h3">{value}</CardTitle>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  </Col>
);

function ForecastingAgeing({parentDatasource}) {
    const [search, setSearch] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [error, setError] = useState(null);
    
    const [isTakingLong, setIsTakingLong] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");
    const timerRef = useRef(null);

    const [orgName, setOrgName] = useState('');
    const [courseKeyword, setCourseKeyword] = useState('');
    const [keyword, setKeywords] = useState('');
    const [selectedOccupation, setSelectedOccupation] = useState(null);

    const [sortConfigs, setSortConfigs] = useState({
        skillBiology: { key: 'Total Jobs', direction: 'descending' },
        epidemiology: { key: 'Total Jobs', direction: 'descending' },
        competing: { key: 'Correlation', direction: 'descending' },
        rapidObsolescence: { key: 'Drop %', direction: 'descending' }
    });

    const toggleTab = tab => { if (activeTab !== tab) setActiveTab(tab); }

    // Helper to reset states before a request (HCV Style)
    const prepareRequest = () => {
        setSearch(true);
        setLoading(true);
        setAnalysisData(null);
        setError(null);
        setInfoMessage("");
        setIsTakingLong(false);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsTakingLong(true);
        }, 30000);
    };

    // Standardized Response Handler
    const handleResponse = (res) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setLoading(false);

        if (res.data && res.data.status === "processing") {
            setInfoMessage(res.data.message);
            return;
        }

        setAnalysisData(res.data);
        setActiveTab('1');
    };

    const handleError = (err) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setLoading(false);
        if (err.response && err.response.status === 504) {
            setInfoMessage("The analysis is still running in the background. Please try clicking 'Apply' again shortly.");
        } else {
            setError("An error occurred while fetching data.");
        }
        console.error(err);
    };

    const handleApplyOccupationSelection = () => {
        if (!selectedOccupation) { setError("Please select an occupation first."); return; }
        prepareRequest();
        axios.get(`${process.env.REACT_APP_API_URL_SKILL_AGEING}/skill-ageing-jobs`, { 
            params: { occupation_ids: selectedOccupation.id } 
        }).then(handleResponse).catch(handleError);
    }

    const handleApplyKU = () => {
        prepareRequest();
        const q = orgName ? `?organization=${encodeURIComponent(orgName)}` : '';
        axios.get(`${process.env.REACT_APP_API_URL_SKILL_AGEING}/ku-skill-ageing${q}`)
            .then(handleResponse).catch(handleError);
    };

    const handleApplyCourses = () => {
        prepareRequest();
        const q = courseKeyword ? `?keyword=${encodeURIComponent(courseKeyword)}` : '';
        axios.get(`${process.env.REACT_APP_API_URL_SKILL_AGEING}/skill-ageing-courses${q}`)
            .then(handleResponse).catch(handleError);
    };

    const handleApplyPolicy = () => {
        if (!keyword.trim()) { setError("Keywords are required"); return; }
        prepareRequest();
        const q = `?keywords=${encodeURIComponent(keyword)}`;
        axios.get(`${process.env.REACT_APP_API_URL_SKILL_AGEING}/skill-ageing-law-policy${q}`)
            .then(handleResponse).catch(handleError);
    }

    // Sorting logic (remains the same)
    const sortData = (data, config) => {
        if (!data) return [];
        const sortableItems = [...data];
        if (config.key !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[config.key];
                const valB = b[config.key];
                if (valA === null || valA < valB) return config.direction === 'ascending' ? -1 : 1;
                if (valB === null || valA > valB) return config.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    };

    const sortedSkillBiology = useMemo(() => sortData(analysisData?.data?.skill_biology_summary, sortConfigs.skillBiology), [analysisData, sortConfigs.skillBiology]);
    const sortedEpidemiology = useMemo(() => sortData(analysisData?.data?.epidemiological_metrics, sortConfigs.epidemiology), [analysisData, sortConfigs.epidemiology]);
    const sortedCompetingSkills = useMemo(() => sortData(analysisData?.data?.competing_skills, sortConfigs.competing), [analysisData, sortConfigs.competing]);
    const sortedRapidObsolescence = useMemo(() => sortData(analysisData?.data?.rapid_obsolescence, sortConfigs.rapidObsolescence), [analysisData, sortConfigs.rapidObsolescence]);

    const requestSort = (tableId, key) => {
        const currentConfig = sortConfigs[tableId];
        let direction = currentConfig.key === key && currentConfig.direction === 'ascending' ? 'descending' : 'ascending';
        setSortConfigs(prev => ({ ...prev, [tableId]: { key, direction } }));
    };
    
    const getSortDirection = (tableId, name) => {
        const config = sortConfigs[tableId];
        return config.key === name ? (config.direction === 'ascending' ? ' 🔼' : ' 🔽') : null;
    };

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">
                            {parentDatasource === 'ku' ? 'Select organization (optional)' :
                            parentDatasource === 'courses' ? 'Enter keyword (optional)' :
                            parentDatasource === 'policies' ? 'Enter keywords (required)' :
                            'Select occupation (required)'}
                        </CardTitle>

                        <div className="filter-inputs mt-3">
                            {parentDatasource === 'ku' ? (
                                <Row style={{justifyContent: "center"}}>
                                    <Col md="4"><Input type="text" placeholder="Organization name..." value={orgName} onChange={e => setOrgName(e.target.value)} /></Col>
                                    <Button color="info" onClick={handleApplyKU}>Apply</Button>
                                </Row>
                            ) : parentDatasource === 'courses' ? (
                                <Row style={{justifyContent: "center"}}>
                                    <Col md="4"><Input type="text" placeholder="Keyword..." value={courseKeyword} onChange={e => setCourseKeyword(e.target.value)} /></Col>
                                    <Button color="info" onClick={handleApplyCourses}>Apply</Button>
                                </Row>
                            ) : parentDatasource === 'policies' ? (
                                <Row style={{justifyContent: "center", alignItems: "flex-end"}}>
                                    <Col md="4">
                                        <FormGroup className="mb-0">
                                            <Label>Keywords</Label>
                                            <Input type="text" value={keyword} onChange={e => setKeywords(e.target.value)} />
                                        </FormGroup>
                                    </Col>
                                    <Button color="info" onClick={handleApplyPolicy}>Apply</Button>
                                </Row>
                            ) : (
                                <Row style={{justifyContent: "center", alignItems: "flex-end"}}>
                                    <Col md="5">
                                        <FormGroup className="mb-0">
                                            <Label>Occupation</Label>
                                            <OccupationSelection selectedValue={selectedOccupation} onChange={(occ) => setSelectedOccupation(occ)} />
                                        </FormGroup>
                                    </Col>
                                    <Button color="info" onClick={handleApplyOccupationSelection}>Apply</Button>
                                </Row>
                            )}
                        </div>
                        {error && <Alert color="danger" className="mt-3">{error}</Alert>}
                    </CardHeader>
                    
                    <CardBody>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <div className="lds-dual-ring"></div>
                                {isTakingLong && (
                                    <p style={{ marginTop: "10px", color: "#666", fontWeight: "bold" }}>
                                        The analysis might take some time...
                                    </p>
                                )}
                            </div>
                        ) : !search ? (
                            <h6>Select an option above to see the analysis.</h6>
                        ) : infoMessage ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <h6 className="text-info">{infoMessage}</h6>
                            </div>
                        ) : analysisData && analysisData.data ? (
                            <>
                                <Nav tabs>
                                    <NavItem style={{cursor:"pointer"}}><NavLink className={classnames({ active: activeTab === '1' })} onClick={() => toggleTab('1')}>Summary</NavLink></NavItem>
                                    <NavItem style={{cursor:"pointer"}}><NavLink className={classnames({ active: activeTab === '2' })} onClick={() => toggleTab('2')}>Skill Ageing</NavLink></NavItem>
                                    <NavItem style={{cursor:"pointer"}}><NavLink className={classnames({ active: activeTab === '3' })} onClick={() => toggleTab('3')}>Epidemiological Metrics</NavLink></NavItem>
                                    <NavItem style={{cursor:"pointer"}}><NavLink className={classnames({ active: activeTab === '4' })} onClick={() => toggleTab('4')}>Special Categories</NavLink></NavItem>
                                </Nav>
                                <TabContent activeTab={activeTab}>
                                    <TabPane tabId="1">
                                        <Row className="mt-3">
                                            {Object.entries(analysisData.summary || {}).map(([key, value]) => (
                                                <SummaryCard key={key} title={key} value={value} />
                                            ))}
                                        </Row>
                                    </TabPane>
                                    <TabPane tabId="2">
                                        <h5 className="mt-3">Skill Ageing Details</h5>
                                        <Table responsive hover>
                                            <thead className="text-primary">
                                                <tr>
                                                    <th onClick={() => requestSort('skillBiology', 'Skill')} style={{cursor: 'pointer'}}>Skill{getSortDirection('skillBiology', 'Skill')}</th>
                                                    <th onClick={() => requestSort('skillBiology', 'Date of Birth')} style={{cursor: 'pointer'}}>Date of Birth{getSortDirection('skillBiology', 'Date of Birth')}</th>
                                                    <th onClick={() => requestSort('skillBiology', 'Peak Activity Date')} style={{cursor: 'pointer'}}>Peak Activity Date{getSortDirection('skillBiology', 'Peak Activity Date')}</th>
                                                    <th onClick={() => requestSort('skillBiology', 'Total Jobs')} style={{cursor: 'pointer'}}>Total Instances{getSortDirection('skillBiology', 'Total Jobs')}</th>
                                                    <th onClick={() => requestSort('skillBiology', 'Immunity Score')} style={{cursor: 'pointer'}}>Immunity Score{getSortDirection('skillBiology', 'Immunity Score')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedSkillBiology.map((skill, index) => (
                                                    <tr key={index}>
                                                        <td style={{textAlign:"left"}}><FormatKuSkill skill={skill.Skill} parentDatasource={parentDatasource} /></td>
                                                        <td>{skill['Date of Birth']}</td>
                                                        <td>{skill['Peak Activity Date']}</td>
                                                        <td>{skill['Total Jobs']}</td>
                                                        <td>
                                                            <Badge color={skill['Immunity Score'] === 'High' ? 'success' : 'warning'} pill>
                                                                {skill['Immunity Score']}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </TabPane>
                                    <TabPane tabId="3">
                                         <h5 className="mt-3">Epidemiological Metrics</h5>
                                         {analysisData.data.epidemiological_metrics?.length > 0 ? (
                                            <Table responsive hover>
                                                <thead className="text-primary">
                                                    <tr>
                                                        <th onClick={() => requestSort('epidemiology', 'Skill')} style={{ cursor: 'pointer' }}>Skill{getSortDirection('epidemiology', 'Skill')}</th>
                                                        <th onClick={() => requestSort('epidemiology', 'Total Jobs')} style={{ cursor: 'pointer' }}>Total Instances{getSortDirection('epidemiology', 'Total Jobs')}</th>
                                                        <th onClick={() => requestSort('epidemiology', 'Incidence (2023)')} style={{ cursor: 'pointer' }}>Incidence (2023){getSortDirection('epidemiology', 'Incidence (2023)')}</th>
                                                        <th onClick={() => requestSort('epidemiology', 'Mortality Risk')} style={{ cursor: 'pointer' }}>Mortality Risk{getSortDirection('epidemiology', 'Mortality Risk')}</th>
                                                        <th onClick={() => requestSort('epidemiology', 'Attack Rate')} style={{ cursor: 'pointer' }}>Attack Rate{getSortDirection('epidemiology', 'Attack Rate')}</th>
                                                        <th onClick={() => requestSort('epidemiology', 'CFR')} style={{ cursor: 'pointer' }}>CFR{getSortDirection('epidemiology', 'CFR')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedEpidemiology.map((metric, index) => (
                                                        <tr key={index}>
                                                            <td style={{textAlign:"left"}}><FormatKuSkill skill={metric.Skill} parentDatasource={parentDatasource} /></td>
                                                            <td>{metric['Total Jobs']}</td>
                                                            <td>{metric['Incidence (2023)']}</td>
                                                            <td>{metric['Mortality Risk']}</td>
                                                            <td>{metric['Attack Rate']?.toFixed(4)}</td>
                                                            <td>{metric['CFR']}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                         ) : <h6>No epidemiological data available.</h6>}
                                    </TabPane>
                                    <TabPane tabId="4">
                                        <h5 className="mt-3">Competing Skills</h5>
                                        {analysisData.data.competing_skills?.length > 0 ? (
                                            <Table responsive hover>
                                                <thead className="text-primary">
                                                    <tr>
                                                        <th onClick={() => requestSort('competing', 'Skill A')} style={{ cursor: 'pointer' }}>Skill A{getSortDirection('competing', 'Skill A')}</th>
                                                        <th onClick={() => requestSort('competing', 'Skill B')} style={{ cursor: 'pointer' }}>Skill B{getSortDirection('competing', 'Skill B')}</th>
                                                        <th onClick={() => requestSort('competing', 'Correlation')} style={{ cursor: 'pointer' }}>Correlation{getSortDirection('competing', 'Correlation')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedCompetingSkills.map((pair, index) => (
                                                        <tr key={index}>
                                                            <td style={{textAlign:"left"}}><FormatKuSkill skill={pair['Skill A']} parentDatasource={parentDatasource} /></td>
                                                            <td style={{textAlign:"left"}}><FormatKuSkill skill={pair['Skill B']} parentDatasource={parentDatasource} /></td>
                                                            <td>{pair.Correlation.toFixed(3)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : <h6>No competing skills found.</h6>}
                                        <hr />
                                        <h5 className="mt-3">Rapid Obsolescence Skills</h5>
                                        {analysisData.data.rapid_obsolescence?.length > 0 ? (
                                            <Table responsive hover>
                                                <thead className="text-primary">
                                                    <tr>
                                                        <th onClick={() => requestSort('rapidObsolescence', 'Skill')} style={{ cursor: 'pointer' }}>Skill{getSortDirection('rapidObsolescence', 'Skill')}</th>
                                                        <th onClick={() => requestSort('rapidObsolescence', 'Peak Month')} style={{ cursor: 'pointer' }}>Peak Month{getSortDirection('rapidObsolescence', 'Peak Month')}</th>
                                                        <th onClick={() => requestSort('rapidObsolescence', 'Peak Value')} style={{ cursor: 'pointer' }}>Peak Value{getSortDirection('rapidObsolescence', 'Peak Value')}</th>
                                                        <th onClick={() => requestSort('rapidObsolescence', 'Min Value After Peak')} style={{ cursor: 'pointer' }}>Min Value After Peak{getSortDirection('rapidObsolescence', 'Min Value After Peak')}</th>
                                                        <th onClick={() => requestSort('rapidObsolescence', 'Drop %')} style={{ cursor: 'pointer' }}>Drop %{getSortDirection('rapidObsolescence', 'Drop %')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedRapidObsolescence.map((skill, index) => (
                                                        <tr key={index}>
                                                            <td style={{textAlign:"left"}}><FormatKuSkill skill={skill.Skill} parentDatasource={parentDatasource} /></td>
                                                            <td>{skill['Peak Month']}</td>
                                                            <td>{skill['Peak Value']}</td>
                                                            <td>{skill['Min Value After Peak']}</td>
                                                            <td>{skill['Drop %'].toFixed(2)}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : <h6>No skills with rapid obsolescence found.</h6>}
                                    </TabPane>
                                </TabContent>
                            </>
                        ) : (
                            <h6 className="text-center">No data found for the selected criteria.</h6>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default ForecastingAgeing;