import React from 'react';
import skillabLogo from '../assets/img/skillab-logo.png';
import euLogo from '../assets/img/european-union-logo.png';
import euMap from '../assets/img/europe-map.png';
import '../assets/css/init-page.css'; // Import the CSS file for styling

const InitPage = () => {
  return (
    <div className="initpage-container">
      {/* Header Section */}
      <header className="header">
        <div className="logo-section">
          <img src={skillabLogo} alt="SkillLab Logo" className="logo" />
        </div>
      </header>

      {/* Main Content Section */}
      <main className="content">
        <p className="content-description">
          The SKILLAB project aims at monitoring and mining Internet resources and EU initiatives to acquire and process meaningful new data about existing and 
          future skills, and reskilling/upskilling needs. State-of-the-art IT technologies will be used to empower the platform and achieve its goals, including 
          advanced visualization and advanced data analysis, machine learning, and competency mining.
        </p>
      </main>

      {/* Map and EU Section */}
      <section className="map-section">
        <img src={euMap} alt="Europe Map" className="map-image" />
      </section>
    </div>
  );
};

export default InitPage;