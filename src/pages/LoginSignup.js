import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import "../css/LoginSignup.css";

const LoginSignup = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => console.log("Recaptcha verified"),
      });
    }
  }, []);

  const isValidPhoneNumber = (number) => {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(number);
  };

  const sendOtp = async () => {
    try {
      setError("");
      if (!isValidPhoneNumber(phoneNumber)) {
        setError("Enter a valid phone number (e.g., +15551234567)");
        return;
      }

      setLoading(true);
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      alert("OTP sent! Check your messages.");
    } catch (err) {
      setError("Failed to send OTP. Check your number & Firebase settings.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setError("");
      setLoading(true);
      if (!confirmationResult) {
        throw new Error("No confirmation result found.");
      }

      await confirmationResult.confirm(otp);
      alert("Phone number verified successfully!");
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">Phone Authentication</div>

        {error && <p className="error">{error}</p>}

        <input
          type="tel"
          placeholder="Enter phone number (e.g., +15551234567)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <button onClick={sendOtp} disabled={loading || !phoneNumber}>
          {loading ? "Sending..." : "Send OTP"}
        </button>

        {confirmationResult && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button onClick={verifyOtp} disabled={loading || !otp}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default LoginSignup;
