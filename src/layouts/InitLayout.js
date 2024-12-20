import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <span className="logo-skill">SKIL</span>
          <span className="logo-lab">LAB</span>
        </div>
        <ul className="navbar-links">
          <li>
            <Link className="nav-link-home" to="/">Home</Link>
          </li>
          <li>
            <Link className="nav-link-home" to="/login">Login</Link>
          </li>
        </ul>
      </nav>

      <Outlet />
    </>
  )
};

export default Layout;