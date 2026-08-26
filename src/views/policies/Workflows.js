import React from 'react';
import { Card, CardHeader, CardBody, CardTitle, Button } from 'reactstrap';
import { AiOutlineExport } from "react-icons/ai";

function Workflows() {
  const jbpmUrl = `${process.env.REACT_APP_API_URL_JBPM}`;

  const openInNewTab = () => {
    window.open(jbpmUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4" className="mb-0">Workflows</CardTitle>
      </CardHeader>
      <CardBody className="text-center">
        <Button color="primary" onClick={openInNewTab}>
          <AiOutlineExport size={20} className="mr-2" />
          Open Workflows
        </Button>
      </CardBody>
    </Card>
  );
}

export default Workflows;
