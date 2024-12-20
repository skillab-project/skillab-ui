import React, { useState } from "react";
import axios from "axios";
// import "./css/AddData.css";

const AddData = ({ name, onAddSuccess }) => {
  // const [date, setDate] = useState("");
  const [value, setValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function setMessage(success, message) {
    if (success) {
      setErrorMessage("");
      setSuccessMessage(message); // Clear any previous error message
      // Set a timeout to clear the error message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } else {
      setSuccessMessage("");
      setErrorMessage(message);
    }
  }

  const handleValueChange = (e) => {
    setValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    var date = new Date().toISOString();
    console.log("date: " + date);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json"
        },
      };
      const data = {
        date: date,
        name: name,
        value: value,
      };
      const response = await axios
        .post(process.env.REACT_APP_API_URL_KPI + "/report/indicator", data, config)
        .then((response) => {
          console.log(response.data); // Access the response data here
          if (response.status === 200) {
            onAddSuccess({ date, value }); // Notify the parent component
            setValue("");
            setMessage(true, `Sucess! Added ${value} on ${date}`);
          } else {
            setMessage(false, "Error adding data");
          }
        })
        .catch((error) => {
          // console.error("Error:", error);
          setMessage(false, "Error adding data");
        });
    } catch (error) {
      setMessage(false, "Error adding data");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          {/* Date :
          <input type="date" value={date} onChange={handleDateChange} /> */}
          Report for : {new Date().toDateString()}
        </label>
        <label>
          Value :
          <input
            type="number"
            pattern="\d*"
            value={value}
            onChange={handleValueChange}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
      {errorMessage && <div className="error-panel">{errorMessage}</div>}
      {successMessage && <div className="success-panel">{successMessage}</div>}
    </div>
  );
};

export default AddData;
