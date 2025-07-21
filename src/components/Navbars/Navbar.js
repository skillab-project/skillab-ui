import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Container,
  InputGroup,
  InputGroupText,
  InputGroupAddon,
  Input,
} from "reactstrap";
import { FiLogOut } from "react-icons/fi";

import routesCitizen from "routes/routesCitizen";
import routesIndustry from "routes/routesIndustry";
import routesEducation from "routes/routesEducation";
import routesPolicyIndustry from "routes/routesPolicyIndustry";
import routesPolicyEducation from "routes/routesPolicyEducation";

function Header(props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [color, setColor] = React.useState("transparent");
  const sidebarToggle = React.useRef();
  const location = useLocation();
  const toggle = () => {
    if (isOpen) {
      setColor("transparent");
    } else {
      setColor("dark");
    }
    setIsOpen(!isOpen);
  };
  const dropdownToggle = (e) => {
    setDropdownOpen(!dropdownOpen);
  };

  const getBrand = () => {
    const findBrandName = (routes) => {
      for (let prop of routes) {
        // Check if the current route object's path matches the URL
        if (window.location.href.indexOf(prop.layout + prop.path) !== -1) {
          return prop.name;
        }
        // If it has children, recursively search in the children array
        if (prop.children) {
          let childBrandName = findBrandName(prop.children);
          if (childBrandName) {
            return prop.name +" "+ childBrandName; // If found in children, return it
          }
        }
      }
      return null; // Return null if not found in this array
    };

    // Put all your route configurations into an array
    const allRouteGroups = [
      routesCitizen,
      routesIndustry,
      routesEducation,
      routesPolicyIndustry,
      routesPolicyEducation,
    ];

    // Loop through each group and search for the brand name
    for (let routeGroup of allRouteGroups) {
      const brandName = findBrandName(routeGroup);
      if (brandName) {
        return brandName; // If we found it, return immediately
      }
    }

    // If the loop finishes and we haven't found anything, return the default
    return "Default Brand";
  };

  const openSidebar = () => {
    document.documentElement.classList.toggle("nav-open");
    sidebarToggle.current.classList.toggle("toggled");
  };
  
  // function that adds color dark/transparent to the navbar on resize (this is for the collapse)
  const updateColor = () => {
    if (window.innerWidth < 993 && isOpen) {
      setColor("dark");
    } else {
      setColor("transparent");
    }
  };
  React.useEffect(() => {
    window.addEventListener("resize", updateColor.bind(this));
  });
  React.useEffect(() => {
    if (
      window.innerWidth < 993 &&
      document.documentElement.className.indexOf("nav-open") !== -1
    ) {
      document.documentElement.classList.toggle("nav-open");
      sidebarToggle.current.classList.toggle("toggled");
    }
  }, [location]);

  const logout = () => {
    localStorage.setItem("accessTokenSkillab", "");
    localStorage.setItem("refreshTokenSkillab", "");
    window.location.href='/';
  }

  return (
    // add or remove classes depending if we are on full-screen-maps page or not
    <Navbar
      color={
        location.pathname.indexOf("full-screen-maps") !== -1 ? "dark" : color
      }
      expand="lg"
      className={
        location.pathname.indexOf("full-screen-maps") !== -1
          ? "navbar-absolute fixed-top"
          : "navbar-absolute fixed-top " +
            (color === "transparent" ? "navbar-transparent " : "")
      }
    >
      <Container fluid>
        <div className="navbar-wrapper">
          <div className="navbar-toggle">
            <button
              type="button"
              ref={sidebarToggle}
              className="navbar-toggler"
              onClick={() => openSidebar()}
            >
              <span className="navbar-toggler-bar bar1" />
              <span className="navbar-toggler-bar bar2" />
              <span className="navbar-toggler-bar bar3" />
            </button>
          </div>
          <NavbarBrand href={window.location.href}>{getBrand()}</NavbarBrand>
        </div>
        <NavbarToggler onClick={toggle}>
          <span className="navbar-toggler-bar navbar-kebab" />
          <span className="navbar-toggler-bar navbar-kebab" />
          <span className="navbar-toggler-bar navbar-kebab" />
        </NavbarToggler>
        <Collapse isOpen={isOpen} navbar className="justify-content-end">
          <Nav navbar>
            <NavItem>
              <Link to="#pablo" className="nav-link btn-magnify">
                <i className="nc-icon nc-layout-11" />
                <p>
                  <span className="d-lg-none d-md-block">Stats</span>
                </p>
              </Link>
            </NavItem>
            <Dropdown
              nav
              isOpen={dropdownOpen}
              toggle={(e) => dropdownToggle(e)}
            >
              <DropdownToggle caret nav>
                <i className="nc-icon nc-bell-55" />
                <p>
                  <span className="d-lg-none d-md-block">Some Actions</span>
                </p>
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem tag="a">Action</DropdownItem>
                <DropdownItem tag="a">Another Action</DropdownItem>
                <DropdownItem tag="a">Something else here</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <NavItem style={{display:"flex"}}>
              <Link onClick={logout} to="#logout" className="nav-link btn-rotate" style={{display:"flex", alignItems:"center"}}>
                <FiLogOut style={{fontSize:"18px", color:"gray"}} />
                <p>
                  <span style={{marginLeft:"7px"}} className="d-lg-none d-md-block">Log Out</span>
                </p>
              </Link>
            </NavItem>
          </Nav>
        </Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
