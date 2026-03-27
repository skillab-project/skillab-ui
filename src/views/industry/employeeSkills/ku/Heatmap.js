import React from "react";
import ReactApexChart from "react-apexcharts";

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

const Heatmap = ({ analysisResults }) => {
  const authors = Array.from(new Set(analysisResults.map((result) => result.author)));

  // Create a unique list of kus and sort them numerically
  const kus = Array.from(new Set(analysisResults.flatMap((result) => Object.keys(result.detected_kus))))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      return numA - numB;
    });

  // Build multiple series (one per developer) but with a single color scale
  const series = authors.map((author) => {
    const data = kus.map((ku) => {
      const kuCount = analysisResults
        .filter((result) => result.author === author)
        .reduce((acc, result) => acc + (result.detected_kus[ku] || 0), 0);
      return { x: ku, y: kuCount };
    });
    return { name: author, data };
  });

  // Get min and max KU counts across all developers for consistent coloring
  const allKuCounts = series.flatMap((s) => s.data.map((d) => d.y));
  const maxKuCount = Math.max(...allKuCounts);
  const step = Math.max(Math.floor(maxKuCount / 4), 1);

  const options = {
    chart: {
      type: "heatmap",
      toolbar: { show: false },
    },
    legend: { show: false },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.8,
        radius: 0,
        enableShades: true,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: "#FFFFFF" },
            { from: 1, to: step, color: "#b1e0a4" },
            { from: step + 1, to: step * 2, color: "#7bd470" },
            { from: step * 2 + 1, to: step * 3, color: "#398f2e" },
            { from: step * 3 + 1, to: maxKuCount, color: "#003d00" },
          ],
        },
      },
    },
    stroke: { width: 0.1 },
    dataLabels: { enabled: false },
    xaxis: { type: "category", categories: kus },
    tooltip: {
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const ku = kus[dataPointIndex];
        const key = normalizeKuId(ku);
        const name = KU_NAMES[key] || ku;
        const description = KU_DESCRIPTIONS[key] || "";
        const count = series[seriesIndex][dataPointIndex];
        const author = w.globals.seriesNames[seriesIndex];

        return `
          <div style="
            padding: 12px 16px;
            max-width: 360px;
            width: 360px;
            font-size: 13px;
            line-height: 1.6;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            white-space: normal;
            word-wrap: break-word;
            overflow-wrap: break-word;
          ">
            <div style="font-weight: 700; margin-bottom: 6px; color: #333;">
              ${ku} – ${name}
            </div>
            <div style="color: #555; margin-bottom: 8px; font-size: 12px; white-space: normal; word-wrap: break-word;">
              ${description}
            </div>
            <div style="color: #888; font-size: 12px;">
              <strong>Author:</strong> ${author}
            </div>
            <div style="color: #398f2e; font-weight: 600; margin-top: 4px;">
              Count: ${count}
            </div>
          </div>
        `;
      }
    }
  };

  return (
    <div id="chart">
      <ReactApexChart options={options} series={series} type="heatmap" />
    </div>
  );
};

export default Heatmap;