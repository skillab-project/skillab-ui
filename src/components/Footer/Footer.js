import React from "react";
import { Container, Row } from "reactstrap";
// used for making the prop types of this component
import PropTypes from "prop-types";

function Footer(props) {
  return (
    <footer className={"footer" + (props.default ? " footer-default" : "")}>
      <Container fluid={props.fluid ? true : false}>
        <Row>
          <nav className="footer-nav">
            <ul>
              <li>
                <img width="270" height="40" src="/EN_FundedbytheEU_RGB_Monochrome-1024x228.png" alt="Funded by the EC"/>
              </li>
              <li style={{marginLeft: "10px"}}>
                Connect with us:
              </li>
              <li>
                <a href="https://x.com/SKillabProject" target="_blank">
                  X
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/company/skillab-project/posts/?feedView=all" target="_blank">
                  Linkedin 
                </a>
              </li>
            </ul>
          </nav>
          <div className="credits ml-auto">
            <div className="copyright">
              &copy; {1900 + new Date().getYear()}
            </div>
          </div>
        </Row>
      </Container>
    </footer>
  );
}

Footer.propTypes = {
  default: PropTypes.bool,
  fluid: PropTypes.bool,
};

export default Footer;
