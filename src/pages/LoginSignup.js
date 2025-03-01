// LoginSignup.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/LoginSignup.css";

const LoginSignup = () => {
  const [phone, setPhone] = useState("");
  const [userExists, setUserExists] = useState(null);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [userId, setUserId] = useState("");
  
  const navigate = useNavigate();

  // Check if phone exists and send verification code if it does
  const checkPhone = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5001/api/check-phone", { phone });
      if (response.data.exists) {
        setUserId(response.data.userId);
        await sendVerificationCode(phone);
        setCodeSent(true);
      } else {
        // If phone not found, show signup form
        setUserExists(false);
      }
    } catch (error) {
      console.error("Error checking phone:", error);
    }
    setLoading(false);
  };

  // Function to send verification code via backend
  const sendVerificationCode = async (phoneNumber) => {
    try {
      await axios.post("http://localhost:5001/api/send-code", { phone: phoneNumber });
      console.log("Verification code sent");
    } catch (error) {
      console.error("Error sending verification code:", error);
    }
  };

  // Sign up the user and send verification code
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const signupResponse = await axios.post("http://localhost:5001/api/signup", {
        phone,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        dob: personalInfo.dob,
        email: personalInfo.email,
      });
      console.log("User created:", signupResponse.data);
      setUserId(signupResponse.data.userId);
      await sendVerificationCode(phone);
      setCodeSent(true);
    } catch (error) {
      console.error("Error signing up:", error);
    }
    setLoading(false);
  };

  // Verify the code using a new backend endpoint (/api/verify-code)
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const verifyResponse = await axios.post("http://localhost:5001/api/verify-code", {
        phone,
        code: verificationCodeInput,
      });
      if (verifyResponse.data.verified) {
        navigate(`/home/${userId}`);
      } else {
        alert("Invalid verification code.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1 className="header">Login / Signup</h1>
      
      {/* Step 1: Enter Phone Number (hidden if code already sent) */}
      {!codeSent && (
        <form onSubmit={checkPhone}>
          <div className="form-group">
            <label htmlFor="phone">Phone Number:</label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Next"}
          </button>
        </form>
      )}

      {/* Step 2: If user doesn't exist, show signup fields (only when code not sent) */}
      {userExists === false && !codeSent && (
        <div className="signup-form">
          <h2>Sign Up</h2>
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor="firstName">First Name:</label>
              <input
                id="firstName"
                type="text"
                value={personalInfo.firstName}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name:</label>
              <input
                id="lastName"
                type="text"
                value={personalInfo.lastName}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, lastName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dob">Date of Birth:</label>
              <input
                id="dob"
                type="date"
                value={personalInfo.dob}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, dob: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={personalInfo.email}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, email: e.target.value })
                }
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Sign Up & Send Code"}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Enter Verification Code */}
      {codeSent && (
        <div className="verify-code">
          <h2>Enter Verification Code</h2>
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code:</label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value)}
                placeholder="Enter the code you received"
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginSignup;
