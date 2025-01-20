import React from "react";
import { Container, Row } from "reactstrap";
// used for making the prop types of this component
import PropTypes from "prop-types";
import { FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

function Footer(props) {

  const styles = {
    text: {
      fontSize: "15px"
    },
    iconLink: {
      color: "#000000",
      fontSize: "24px",
      transition: "color 0.3s",
      textDecoration: "none",
    },
  };

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

                <p style={styles.text}>
                  Connect with us:
                  <a
                    href="https://x.com/SkillabProject"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-link"
                    style={styles.iconLink}
                  >
                    <FaXTwitter />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/skillab-project"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.iconLink}
                  >
                    <FaLinkedin />
                  </a>
                </p>

              </li>
              
            </ul>
          </nav>
          <div className="credits ml-auto">
            <div className="copyright" style={styles.text}>
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
