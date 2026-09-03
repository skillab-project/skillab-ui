import React, { useState } from "react";
import { Card, CardBody, CardFooter, CardTitle } from "reactstrap";

/**
 * NavCard — a reusable clickable navigation tile.
 *
 * Shows a coloured circular icon, a title and a short description, with a
 * subtle hover lift so it clearly reads as interactive. Used across the
 * account landing pages (and available for any future view).
 *
 * Props:
 *   icon        React icon component (e.g. from react-icons)
 *   color       accent colour (hex) for the icon + footer link
 *   title       card title
 *   description one-line explanation of what the card opens
 *   onClick     click handler
 */
function NavCard({ icon: Icon, color = "#51cbce", title, description, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <Card
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: "pointer",
        height: "100%",
        marginBottom: 0,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover
          ? "0 8px 20px rgba(0,0,0,0.12)"
          : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <CardBody className="text-center">
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${color}1a`,
            color: color,
          }}
        >
          {Icon ? <Icon size="34" /> : null}
        </div>
        <CardTitle tag="h6" style={{ marginBottom: 6 }}>
          {title}
        </CardTitle>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: 0 }}>
          {description}
        </p>
      </CardBody>
      <CardFooter style={{ textAlign: "center", paddingTop: 0 }}>
        <span style={{ color, fontSize: 12, fontWeight: 600 }}>Open →</span>
      </CardFooter>
    </Card>
  );
}

export default NavCard;
