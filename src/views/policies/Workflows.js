import React, { useState, useRef } from 'react';


function Workflows(props)  {

    return (
        <iframe src={`${process.env.REACT_APP_API_URL_JBPM}`} style={{width:"100%", height:"100vh"}}/>
    );
};
  
export default Workflows;