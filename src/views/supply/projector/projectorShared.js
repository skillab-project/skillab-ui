import React from "react";
import { CardTitle, UncontrolledTooltip } from "reactstrap";

export const API_BASE_URL =
  process.env.REACT_APP_API_URL_PROJECTOR || "https://portal.skillab-project.eu/projector";

export const GRANULARITIES = ["monthly", "quarterly", "yearly"];

export const FORM_HEADERS = {
  accept: "*/*",
  "Content-Type": "application/x-www-form-urlencoded",
};

// Small "?" icon with a hover tooltip, used next to section titles
export const HelpIcon = ({ id, text }) => (
  <>
    <i
      id={id}
      className="nc-icon nc-alert-circle-i"
      style={{ fontSize: "0.8em", marginLeft: 6, cursor: "help", color: "#9a9a9a" }}
    />
    <UncontrolledTooltip placement="right" target={id}>
      {text}
    </UncontrolledTooltip>
  </>
);

export const SectionTitle = ({ id, title, help }) => (
  <CardTitle tag="h5" className="mb-0 d-flex align-items-center">
    {title}
    {help && <HelpIcon id={id} text={help} />}
  </CardTitle>
);
