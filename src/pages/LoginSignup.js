import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase"; // Ensure you export 'db' from your Firebase config
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../css/LoginSignup.css";

const LoginSignup = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Personal info state
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

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
      console.error(err);
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
      const result = await confirmationResult.confirm(otp);
      alert("Phone number verified successfully!");
      // After verification, check if personal info exists in Firestore
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (
        userSnap.exists() &&
        userSnap.data().personal &&
        userSnap.data().personal.firstName &&
        userSnap.data().personal.lastName &&
        userSnap.data().personal.dob &&
        userSnap.data().personal.email
      ) {
        // All information exists, navigate to /home/<uid>
        navigate(`/home/${user.uid}`);
      } else {
        // Show personal information form
        setShowPersonalForm(true);
      }
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    // Ensure all fields are filled
    if (!firstName || !lastName || !dob || !email) {
      setError("Please fill out all personal information fields.");
      return;
    }
    try {
      setError("");
      const user = auth.currentUser;
      if (!user) throw new Error("User not found");
      
      // Save the personal info under the "personal" field of the user document
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          phoneNumber,
          personal: { firstName, lastName, dob, email }
        },
        { merge: true }
      );
      
      // Redirect to /home/<uid>
      navigate(`/home/${user.uid}`);
    } catch (err) {
      console.error(err);
      setError("Failed to update personal information. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">Phone Authentication</div>

        {error && <p className="error">{error}</p>}

        {!showPersonalForm && (
          <>
            <input
              type="tel"
              placeholder="Enter phone number (e.g., +15551234567)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="fadeIn"
            />
            <button
              onClick={sendOtp}
              disabled={loading || !phoneNumber}
              className="button-login fadeIn"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            {confirmationResult && (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="fadeIn"
                />
                <button
                  onClick={verifyOtp}
                  disabled={loading || !otp}
                  className="button-login fadeIn"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </>
            )}
          </>
        )}

        {/* Personal Information Modal/Form */}
        {showPersonalForm && (
          <div className="personal-form">
            <h3>Please Complete Your Profile</h3>
            <form onSubmit={handlePersonalInfoSubmit}>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                type="date"
                placeholder="Date of Birth"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="button-login">
                Submit Profile
              </button>
            </form>
          </div>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default LoginSignup;
