import React, { useState } from 'react';
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";


function Workflows() {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div
        style={{
            position: isFullScreen ? 'fixed' : 'relative',
            top: isFullScreen ? 0 : 'auto',
            left: isFullScreen ? 0 : 'auto',
            width: '100%',
            height: isFullScreen ? '100vh' : '90vh',
            zIndex: isFullScreen ? 9999 : 'auto',
            backgroundColor: isFullScreen ? '#fff' : 'transparent',
            boxShadow: isFullScreen ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
        }}
    >
        <button
            onClick={toggleFullScreen}
            style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10000,
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
            }}
            title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        >
            {isFullScreen ? <AiOutlineFullscreenExit size={20}/> : <AiOutlineFullscreen size={20}/>}
        </button>
        <iframe
            src={`${process.env.REACT_APP_API_URL_JBPM}`}
            style={{ width: '100%', height: '100vh', border: 'none' }}
            title="Workflows"
        />
    </div>
  );
}

export default Workflows;