import React, { useState, useMemo } from "react";
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
  Button
} from "reactstrap";
import axios from 'axios';
import classnames from 'classnames';
import OccupationSelection from './OccupationSelection';
import "../../assets/css/loader.css";

// Helper function to format skill names that are URIs
const formatSkillName = (skill) => {
  if (typeof skill === 'string' && skill.startsWith('http')) {
    return skill.split('/').pop();
  }
  return skill;
};

// Helper component for displaying summary cards
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
    const [orgName, setOrgName] = useState('');
    const [courseKeyword, setCourseKeyword] = useState('');
    const [keyword, setKeywords] = useState('');
    const [maxPages, setMaxPages] = useState(10);

    // To hold sorting configurations for each table
    const [sortConfigs, setSortConfigs] = useState({
        skillBiology: { key: 'Total Jobs', direction: 'descending' },
        epidemiology: { key: 'Total Jobs', direction: 'descending' },
        competing: { key: 'Correlation', direction: 'descending' },
        rapidObsolescence: { key: 'Drop %', direction: 'descending' }
    });

    const toggleTab = tab => {
        if (activeTab !== tab) setActiveTab(tab);
    }

    // Generic sorting function for any data array
    const sortData = (data, config) => {
        if (!data) return [];
        const sortableItems = [...data];
        if (config.key !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[config.key];
                const valB = b[config.key];

                if (valA === null || valA < valB) {
                    return config.direction === 'ascending' ? -1 : 1;
                }
                if (valB === null || valA > valB) {
                    return config.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    };

    // Sorted data for each table
    const sortedSkillBiology = useMemo(() => 
        sortData(analysisData?.data?.skill_biology_summary, sortConfigs.skillBiology), 
        [analysisData, sortConfigs.skillBiology]
    );

    const sortedEpidemiology = useMemo(() => 
        sortData(analysisData?.data?.epidemiological_metrics, sortConfigs.epidemiology), 
        [analysisData, sortConfigs.epidemiology]
    );

    const sortedCompetingSkills = useMemo(() =>
        sortData(analysisData?.data?.competing_skills, sortConfigs.competing),
        [analysisData, sortConfigs.competing]
    );
    
    const sortedRapidObsolescence = useMemo(() =>
        sortData(analysisData?.data?.rapid_obsolescence, sortConfigs.rapidObsolescence),
        [analysisData, sortConfigs.rapidObsolescence]
    );

    // Update the sort configuration for a specific table
    const requestSort = (tableId, key) => {
        const currentConfig = sortConfigs[tableId];
        let direction = 'ascending';
        if (currentConfig.key === key && currentConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfigs(prevConfigs => ({
            ...prevConfigs,
            [tableId]: { key, direction }
        }));
    };
    
    // Get the sort indicator for a specific table's column
    const getSortDirection = (tableId, name) => {
        const config = sortConfigs[tableId];
        if (config.key === name) {
            return config.direction === 'ascending' ? ' 🔼' : ' 🔽';
        }
        return null;
    };

    
    const handleApplyOccupationSelection = () => {
        setSearch(true);
        setLoading(true);
        setAnalysisData(null);
        axios
            .get(process.env.REACT_APP_API_URL_SKILL_AGEING + "/jobs-with-keywords?keywords="+
                                keyword + "&max_pages="+ maxPages)
            .then(async (res) => {
                setAnalysisData(res.data);
                setLoading(false);
                setActiveTab('1');
            })
            .catch((err) => {
                console.error("Error fetching data:", err);
                setLoading(false);
                setAnalysisData(null);
            });
    }

    const handleApplyKU = () => {
        setSearch(true); setLoading(true); setAnalysisData(null);
        const q = orgName ? `?organization=${encodeURIComponent(orgName)}` : '';
        axios.get(process.env.REACT_APP_API_URL_SKILL_AGEING + `/ku${q}`)
            .then(res => {
                setAnalysisData(res.data); setLoading(false); setActiveTab('1');
            })
            .catch(err => {
                console.error("Error fetching KU data:", err); setLoading(false);
                setAnalysisData(null);
            });
    };

    const handleApplyCourses = () => {
        setSearch(true); setLoading(true); setAnalysisData(null);
        const q = courseKeyword ? `?keyword=${encodeURIComponent(courseKeyword)}` : '';
        axios.get(process.env.REACT_APP_API_URL_SKILL_AGEING + `/courses${q}`)
            .then(res => {
                setAnalysisData(res.data); setLoading(false); setActiveTab('1');
            })
            .catch(err => {
                console.error("Error fetching courses data:", err); setLoading(false);
                setAnalysisData(null);
            });
    };

    const handleApplyPolicy = () => {
        setSearch(true); setLoading(true); setAnalysisData(null);
        const q = keyword ? `?keywords=${encodeURIComponent(keyword)}` : '';
        axios.get(process.env.REACT_APP_API_URL_SKILL_AGEING + `/law-policy${q}`)
            .then(res => {
                setAnalysisData(res.data); setLoading(false); setActiveTab('1');
            })
            .catch(err => {
                console.error("Error fetching courses data:", err); setLoading(false);
                setAnalysisData(null);
            });
    }

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">
                            {parentDatasource === 'ku' ? 'Select organization (optional)' :
                            parentDatasource === 'courses' ? 'Enter keyword (optional)' :
                            parentDatasource === 'policies' ? 'Enter keywords (required)' :
                            'Select occupation'}
                        </CardTitle>

                        {parentDatasource === 'ku' ? (
                            <CardTitle>
                                <Input
                                    type="text"
                                    placeholder="Organization name (optional)"
                                    value={orgName}
                                    onChange={e => setOrgName(e.target.value)}
                                    style={{justifySelf:"center", maxWidth: 320}}
                                />
                                <Button color="info" onClick={handleApplyKU}>Apply</Button>
                            </CardTitle>
                        ) : parentDatasource === 'courses' ? (
                            <CardTitle>
                                <Input
                                    type="text"
                                    placeholder="Keyword (optional)"
                                    value={courseKeyword}
                                    onChange={e => setCourseKeyword(e.target.value)}
                                    style={{justifySelf:"center", maxWidth: 320}}
                                />
                                <Button color="info" onClick={handleApplyCourses}>Apply</Button>
                            </CardTitle>
                        ) : parentDatasource === 'policies' ? (
                             <CardTitle>
                                <Col md="6" style={{justifySelf:"center"}}>
                                    <FormGroup>
                                        <Label for="keywordInput">Keywords (required)</Label>
                                        <Input id="keywordInput" type="text" placeholder="e.g., python, software developer" value={keyword} onChange={e => setKeywords(e.target.value)} />
                                    </FormGroup>
                                </Col>
                                <Button color="info" onClick={handleApplyPolicy}>Apply</Button>
                            </CardTitle>
                        )
                        : (
                            <CardTitle>
                                <Col md="6" style={{justifySelf:"center"}}>
                                    <FormGroup>
                                        <Label for="keywordInput">Keywords (required)</Label>
                                        <Input id="keywordInput" type="text" placeholder="e.g., python, software developer" value={keyword} onChange={e => setKeywords(e.target.value)} />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="maxPagesInput">Max Pages</Label>
                                        <Input id="maxPagesInput" type="number" value={maxPages} onChange={e => setMaxPages(parseInt(e.target.value, 10))} />
                                    </FormGroup>
                                </Col>
                                <Button color="info" onClick={handleApplyOccupationSelection}>Apply</Button>
                            </CardTitle>
                        )}
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="lds-dual-ring"></div>
                        ) : !search ? (
                            <h6>Select an option above to see the analysis.</h6>
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
                                            {Object.entries(analysisData.summary).map(([key, value]) => (
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
                                                    {/* UPDATED HEADER LABEL BELOW */}
                                                    <th onClick={() => requestSort('skillBiology', 'Total Jobs')} style={{cursor: 'pointer'}}>Total Instances{getSortDirection('skillBiology', 'Total Jobs')}</th>
                                                    <th onClick={() => requestSort('skillBiology', 'Immunity Score')} style={{cursor: 'pointer'}}>Immunity Score{getSortDirection('skillBiology', 'Immunity Score')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedSkillBiology.map((skill, index) => (
                                                    <tr key={index}>
                                                        <td>{formatSkillName(skill.Skill)}</td>
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
                                                        {/* UPDATED HEADER LABEL BELOW */}
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
                                                            <td>{formatSkillName(metric.Skill)}</td><td>{metric['Total Jobs']}</td><td>{metric['Incidence (2023)']}</td><td>{metric['Mortality Risk']}</td><td>{metric['Attack Rate']?.toFixed(4)}</td><td>{metric['CFR']}</td>
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
                                                        <tr key={index}><td>{formatSkillName(pair['Skill A'])}</td><td>{formatSkillName(pair['Skill B'])}</td><td>{pair.Correlation.toFixed(3)}</td></tr>
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
                                                            <td>{formatSkillName(skill.Skill)}</td>
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
                            <h6>No data found for the selected criteria.</h6>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default ForecastingAgeing;