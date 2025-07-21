import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Nav, Collapse } from "reactstrap";
import PerfectScrollbar from "perfect-scrollbar";

import skillabLogo from '../../assets/img/skillab-logo.png';

var ps;

function Sidebar(props) {
  const location = useLocation();
  const sidebar = React.useRef();
  // State to manage which category is open
  const [openStates, setOpenStates] = React.useState({});
  // Function to toggle the collapse state of a category
  const toggleCollapse = (categoryName) => {
    setOpenStates(states => ({ ...states, [categoryName]: !states[categoryName] }));
  };

  const activeRoute = (routeName) => {
    return location.pathname.indexOf(routeName) > -1 ? "active" : "";
  };

  // Function to check if a category should be active
  const isCategoryActive = (category) => {
    if (category.children) {
      return category.children.some(child => location.pathname.includes(child.layout + child.path));
    }
    return false;
  };
  
  React.useEffect(() => {
    if (navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(sidebar.current, {
        suppressScrollX: true,
        suppressScrollY: false,
      });
    }
    return function cleanup() {
      if (navigator.platform.indexOf("Win") > -1) {
        ps.destroy();
      }
    };
  });

  return (
    <div
      className="sidebar"
      data-color={props.bgColor}
      data-active-color={props.activeColor}
    >
      <div className="logo">
        <a
          href="https://skillab-project.eu"
          className="simple-text logo-normal"
        >
          <img src={skillabLogo} alt="react-logo" />
          SKILLAB
        </a>
      </div>
      <div className="sidebar-wrapper" ref={sidebar}>
        <Nav>
          {props.routes.map((prop, key) => {
            // ** If it's a category, render a collapsible menu **
            if (prop.isCategory && prop.children) {
              return (
                <li className={isCategoryActive(prop) ? "active" : ""} key={key}>
                  {/* The clickable header for the category */}
                  <a
                    href="#pablo"
                    data-toggle="collapse"
                    className="nav-link"
                    aria-expanded={openStates[prop.name]}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleCollapse(prop.name);
                    }}
                  >
                    <i className={prop.icon} />
                    <p>
                      {prop.name}
                      {/* Adds a little arrow (caret) */}
                      <b className={openStates[prop.name] ? "caret-up" : "caret"} />
                    </p>
                  </a>

                  {/* The collapsible section with the child links */}
                  <Collapse isOpen={openStates[prop.name]}>
                    <ul className="nav">
                      {prop.children.map((child, childKey) => (
                        <li className={activeRoute(child.path)} key={childKey}>
                          <NavLink to={child.layout + child.path} className="nav-NavLink">
                            <i className={child.icon} />
                            <p>{child.name}</p>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </Collapse>
                </li>
              );
            }

            // ** If it's a regular link, render it as before **
            if (prop.path && (prop.path.match(/\//g) || []).length < 2) {
              return (
                <li
                  className={
                    activeRoute(prop.path) + (prop.pro ? " active-pro" : "")
                  }
                  key={key}
                >
                  <NavLink to={prop.layout + prop.path} className="nav-NavLink">
                    <i className={prop.icon} />
                    <p>{prop.name}</p>
                  </NavLink>
                </li>
              );
            }

            return null;
          })}
        </Nav>
      </div>
    </div>
  );
}

export default Sidebar;