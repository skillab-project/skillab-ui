import React, { useState, useMemo, useRef, useEffect } from "react";
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
import classnames from 'classnames';
import axios from 'axios';
import ExploratoryAnalytics from "./ExploratoryAnalytics";
import TrendAnalysis from "./TrendAnalysis";
import DescriptiveAnalytics from "./DescriptiveAnalytics";
import SkillClustering from "./SkillClustering";
import TopOrganizations from "./TopOrganizations";


// Mapping from KU ID to display name
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

// Detailed tooltip descriptions per KU
export const KU_DESCRIPTIONS = {
    "K1":  "Declare and initialize different types of variables (e.g., primitive, parameterized and array type), including the casting of primitive data types.",
    "K2":  "Use Java operators (e.g., assignment and postfix operators); use parentheses to override operator precedence. Test equality between strings and other objects using == and equals(). Create and use if, if-else, and ternary constructs. Use the switch statement.",
    "K3":  "Declare, instantiate, initialize and use a one-dimensional array. Declare, instantiate, initialize and use a multi-dimensional array.",
    "K4":  "Create and use while loops. Create and use for loops, including the enhanced for loop. Create and use do-while loops. Use the break and continue statements.",
    "K5":  "Create methods with arguments and return values. Apply the static keyword. Create overloaded methods and constructors. Use variable length arguments. Use different access modifiers. Apply encapsulation with get/set methods and immutable classes.",
    "K6":  "Use basic polymorphism. Use polymorphic parameters. Create overridden methods. Create abstract classes and methods. Use super() and the super keyword. Use casting in referring a subclass object to a superclass object.",
    "K7":  "Create inner classes, including static inner classes, local classes, nested classes, and anonymous inner classes. Develop code that uses the final keyword. Use enumerated types including methods and constructors. Create singleton classes and immutable classes.",
    "K8":  "Create and use a generic class. Create and use ArrayList, TreeSet, TreeMap, and ArrayDeque. Use java.util.Comparator and java.lang.Comparable interfaces. Iterate using the forEach method of List.",
    "K9":  "Use the built-in interfaces in java.util.function such as Predicate, Consumer, Function, and Supplier. Develop code that uses primitive, binary, and UnaryOperator versions of functional interfaces.",
    "K10": "Extract data from an object using peek() and map() methods. Search for data using findFirst, findAny, anyMatch, allMatch, noneMatch. Use the Optional class. Sort a collection using the Stream API. Use collect() and flatMap() methods.",
    "K11": "Create a try-catch block. Use the catch, multi-catch, and finally clauses. Auto-close resources with try-with-resources. Create custom exceptions and autocloseable resources. Use common exception classes like NullPointerException, ArithmeticException, ArrayIndexOutOfBoundsException, ClassCastException.",
    "K12": "Create and manage date-based and time-based events using LocalDate, LocalTime, LocalDateTime, Instant, Period, Duration. Format date and time values with different timezones. Manipulate calendar data using classes from java.time.*",
    "K13": "Read and write data using the console. Use BufferedReader, BufferedWriter, File, FileReader, FileWriter, FileInputStream, FileOutputStream, ObjectOutputStream, ObjectInputStream, and PrintWriter from the java.io package.",
    "K14": "Use the Path interface to operate on file and directory paths. Use the Files class to check, read, delete, copy, move, and manage metadata of a file or directory.",
    "K15": "Search, parse and build strings. Manipulate data using the StringBuilder class and its methods. Use regular expressions using the Pattern and Matcher classes. Use string formatting.",
    "K16": "Create worker threads using Runnable, Callable and use an ExecutorService to concurrently execute tasks. Use the synchronized keyword and java.util.concurrent.atomic package. Use java.util.concurrent collections and classes including CyclicBarrier and CopyOnWriteArrayList. Use the parallel Fork/Join Framework.",
    "K17": "Describe the interfaces that make up the core of the JDBC API, including the Driver, Connection, Statement, and ResultSet interfaces. Submit queries and read results from the database.",
    "K18": "Read and set the locale by using the Locale object. Build a resource bundle for each locale and load a resource bundle in an application.",
    "K19": "Create JPA Entities and Object-Relational Mappings (ORM). Use EntityManager to perform database operations, transactions, and locking with JPA entities. Create and execute JPQL statements.",
    "K20": "Create session EJB components containing synchronous and asynchronous business methods, manage the life cycle container callbacks, and use interceptors. Create EJB timers.",
    "K21": "Implement Java EE message producers and consumers, including message-driven beans. Use transactions with the JMS API.",
    "K22": "Create SOAP Web Services and Clients using the JAX-WS API. Create, marshall and unmarshall Java Objects by using the JAXB API.",
    "K23": "Create Java Servlets and use HTTP methods. Handle HTTP headers, parameters and cookies. Manage servlet life cycle with container callback methods and WebFilters.",
    "K24": "Apply REST service conventions. Create REST Services and clients using the JAX-RS API.",
    "K25": "Create WebSocket Server and Client Endpoint Handlers. Produce and consume, encode and decode WebSocket messages.",
    "K26": "Use JSF syntax and JSF Tag Libraries. Handle localization and produce messages. Use Expression Language (EL) and interact with CDI beans.",
    "K27": "Create CDI Bean Qualifiers, Producers, Disposers, Interceptors, Events, and Stereotypes.",
    "K28": "Implement batch jobs using the JSR 352 API.",
};

// Helper: given a raw KU id like "ku_1" or "K1", return the canonical key "K1"
export const normalizeKuId = (rawId) => {
    // Handle formats: "ku_1", "KU_1", "K1", "k1", "1"
    const match = String(rawId).match(/(\d+)$/);
    if (match) return `K${match[1]}`;
    return rawId;
};

// Helper: get the display label for a KU id
export const getKuLabel = (rawId) => {
    const key = normalizeKuId(rawId);
    return KU_NAMES[key] ? `${key} – ${KU_NAMES[key]}` : key;
};


const DescriptiveExploratoryKU = ({filters}) => {
    const [dataAreReady, setDataAreReady] = useState(false);
    const [dataSkills, setDataSkills] = useState([]);
    const [dataExploratory, setDataExploratory] = useState([]);
    const [dataTrending, setDataTrending] = useState([]);
    const [dataClustering, setDataClustering] = useState([]);
    const [organizationFrequencyData, setOrganizationFrequencyData] = useState([]);
    
    
    // Get Data for Descriptive component
    const fetchDataSkills = async () => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_URL_KU_PUBLIC + "/ku_statistics");
            const transformedData = response.data.map(item => {
                const key = normalizeKuId(item.ku_id);
                return {
                    label: KU_NAMES[key] ? `${key} – ${KU_NAMES[key]}` : key,
                    tooltip: KU_DESCRIPTIONS[key] || "",
                    Freq: item.count
                };
            });
            setDataSkills(transformedData);

            setDataAreReady(true);
            fetchLocationData();
        } catch (error) {
            console.error('Error fetching data:', error);
            alert("There was a problem fetching the data descriptive/skills_frequency.");
        }
    };

    // Get Data for Location component
    const fetchLocationData = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_KU_PUBLIC + "/organization_stats");
            const transformedOrgData = response.data.map(item => ({
                organization: item.organization,
                frequency: item.count
            }));
            setOrganizationFrequencyData(transformedOrgData);
            fetchDataExploratory();
        }
        catch (error) {
            console.error('Error fetching location data:', error);
            alert("There was a problem fetching the data descriptive/location.");
        }
    }

    // Get Data for Exploratory component 
    const fetchDataExploratory = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_KU_PUBLIC + "/ku_by_organization");
            const transformedData = response.data.map(item => {
                const kuData = {};
                item.ku_counts.forEach(ku => {
                    const key = normalizeKuId(ku.ku_id);
                    const seriesKey = KU_NAMES[key] ? `${key} – ${KU_NAMES[key]}` : key;
                    kuData[seriesKey] = ku.count;
                });
                return {
                    country: item.organization,
                    ...kuData
                };
            });
            setDataExploratory(transformedData);
            fetchDataTrending();
        }
        catch (error) {
            console.error('Error fetching exploratory data:', error);
        }
    };

    // Get Data for Trending component 
    const fetchDataTrending = async () => {
        try{
            const response = await axios.get(process.env.REACT_APP_API_URL_KU_PUBLIC + "/monthly_analysis_stats");
            const transformedData = response.data.map(item => {
                const monthData = {};
                item.monthly_counts.forEach(entry => {
                    monthData[entry.month] = entry.count;
                });
                return {
                    country: item.organization,
                    ...monthData
                };
            });
            setDataTrending(transformedData);
            fetchDataClustering(2);
        }
        catch (error) {
            console.error('Error fetching trending data:', error);
        }
    };

    // Fetch clustering skills
    const fetchDataClustering = async (noClustNow) => {
        try {
            const response = await axios.post(
                process.env.REACT_APP_API_URL_KU_PUBLIC + "/cluster_repos",
                {
                    'num_clusters': noClustNow
                });
            const transformedData = response.data.map((repo) => {
                const key = normalizeKuId(repo.repo_name);
                return {
                    Cluster: repo.cluster,
                    Pref_Label: KU_NAMES[key] ? `${key} – ${KU_NAMES[key]}` : repo.repo_name,
                    kuKey: key,
                    x: repo.coordinates.x,
                    y: repo.coordinates.y
                };
            });
            setDataClustering(transformedData);
        } catch (error) {
            console.error("Error fetching clustering data:", error);
        }
    };


    useEffect(() => {
        fetchDataSkills();
    }, []);


    const handleApplyChangeValueK = async (noClustNow) => {
        try {
            const response = await axios.post(
                process.env.REACT_APP_API_URL_KU_PUBLIC + "/cluster_repos",
                {
                    'num_clusters': noClustNow
                });
            const transformedData = response.data.map(item => {
                const key = normalizeKuId(item.repo_name);
                return {
                    x: item.coordinates.x,
                    y: item.coordinates.y,
                    Cluster: item.cluster,
                    Pref_Label: KU_NAMES[key] ? `${key} – ${KU_NAMES[key]}` : item.repo_name,
                    kuKey: key,
                };
            });
            setDataClustering(transformedData);
        } catch (error) {
            console.error("Error fetching clustering data:", error);
        }
    };

    
    return (
        <>
            {dataAreReady ? <>
                <Row>
                    <Col md="12">
                        {(dataSkills && dataSkills.length > 0) &&
                            <DescriptiveAnalytics
                                data={dataSkills}
                            />
                        }
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        {organizationFrequencyData && organizationFrequencyData.length > 0 &&
                            <TopOrganizations data={organizationFrequencyData} />
                        }
                    </Col>
                </Row>
                
                <Row>
                    <Col md="12">
                        {dataExploratory && dataExploratory.length > 0 &&
                            <ExploratoryAnalytics
                                data={dataExploratory}
                            />
                        }
                    </Col>
                </Row>
                
                <Row>
                    <Col md="12">
                        {dataTrending && dataTrending.length > 0 &&
                            <TrendAnalysis
                                data={dataTrending}
                            />
                        }
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        {dataClustering && dataClustering.length > 0 &&
                            <SkillClustering
                                data={dataClustering}
                                onApplyChangeValueK={handleApplyChangeValueK}
                                noClustering={2}
                            />
                        }
                    </Col>
                </Row>

                {(dataSkills.length === 0 || dataExploratory.length === 0 || dataTrending === 0 || dataClustering === 0) &&
                    <div className="lds-dual-ring"></div>
                }
            </>
            :
            <>
                <div className="lds-dual-ring"></div>
            </>}
        </>
    );
}

export default DescriptiveExploratoryKU;