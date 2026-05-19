import React from "react";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";

import Navbar from "components/Navbars/Navbar";
import Footer from "components/Footer/Footer.js";
import Sidebar from "components/Sidebar/Sidebar.js";

import routes from "routes/routesPolicyIndustry";
import { getInstallation } from "utils/Tokens";

var ps;

// Helper function to flatten the routes for the router
const getRoutes = (routes) => {
  let allRoutes = [];
  routes.forEach((prop) => {
    if (prop.children) {
      // If it has children, recursively get their routes
      allRoutes = allRoutes.concat(getRoutes(prop.children));
    } else if (prop.component) {
      // If it's a single route with a component, add it
      allRoutes.push(prop);
    }
  });
  return allRoutes;
};


function Dashboard(props) {
  const [backgroundColor, setBackgroundColor] = React.useState("white");
  const [activeColor, setActiveColor] = React.useState("info");
  const [isAuthorized, setIsAuthorized] = React.useState(null);
  const mainPanel = React.useRef();
  const location = useLocation();
  const allRoutes = getRoutes(routes);

  React.useEffect(() => {
    async function checkAuth() {
      const installationString = await getInstallation();
      if (installationString && installationString.split(",").includes("policy-industry")) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    }
    checkAuth();
  }, []);
    
  React.useEffect(() => {
    if (isAuthorized && navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(mainPanel.current);
      document.body.classList.toggle("perfect-scrollbar-on");
    }
    return function cleanup() {
      if (ps) {
        ps.destroy();
        document.body.classList.toggle("perfect-scrollbar-on");
      }
    };
  }, [isAuthorized]);

  React.useEffect(() => {
    if (mainPanel.current) {
      mainPanel.current.scrollTop = 0;
      document.scrollingElement.scrollTop = 0;
    }
  }, [location]);


  // 1. While checking, show nothing or a spinner
  if (isAuthorized === null) {
    return <div>Loading...</div>; 
  }

  // 2. If not authorized, redirect to Citizen layout
  if (isAuthorized === false) {
    return <Navigate to="/citizen/account" replace />;
  }

  return (
    <div className="wrapper">
      <Sidebar
        {...props}
        routes={routes}
        bgColor={backgroundColor}
        activeColor={activeColor}
      />
      <div className="main-panel" ref={mainPanel}>
        <Navbar {...props} />
        <Routes>
          {/* Map over the FLATTENED array for the router */}
          {allRoutes.map((prop, key) => {
            return (
              <Route
                path={prop.path}
                element={prop.component}
                key={key}
                exact
              />
            );
          })}
        </Routes>
        {/* <Footer fluid /> */}
      </div>
    </div>
  );
}

export default Dashboard;
