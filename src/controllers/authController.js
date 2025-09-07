const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/database");
const { sendMail } = require("../services/emailService");
const { generateOtp, storeOtp, verifyOtp, deleteOtp } = require("../services/otpService");
const { getHashedPassword } = require("../utils/helpers");

const sendOtp = async (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();
  const subject = "OTP for Fixit Account Verification";
  const text = `
Dear User,

Thank you for choosing FixIt!

Your OTP for account verification is:
---- ${otp} ----

Please use this OTP to verify your account.
This OTP is valid for 10 minutes.

If you did not request this, please ignore this email.

Thank you,
FixIt Team`;

  try {
    const emailSent = await sendMail(email, subject, text);
    if (emailSent) {
      await storeOtp(email, otp);
      res.status(200).json({ message: "OTP sent successfully", otp });
    } else {
      res.status(500).json({ message: "Error sending OTP" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

const verifyOtpHandler = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const result = await verifyOtp(email);
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const otpData = result[0];
    const originalOtp = parseInt(otpData.otp, 10);
    
    if (originalOtp === parseInt(otp, 10)) {
      await deleteOtp(email);
      return res.status(200).json({ message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const workerApplication = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const {
    name, dob, email, password, phone_no, address, city, pincode, types_of_professions, is_verified
  } = req.body;

  if (!name || !dob || !email || !password || !phone_no || !address || !city || !pincode || !types_of_professions) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const hashedPassword = await getHashedPassword(password);
    const query = `INSERT INTO worker_applications (id, name, dob, email, password, phone_no, address, city, pincode, types_of_professions, file_name, file_path, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
      uuidv4(), name, dob, email, hashedPassword, phone_no, address, city, pincode, types_of_professions, file.filename, `worker_proofs/${file.filename}`, is_verified
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Error saving application info to the database." });
      }

      res.status(200).json({
        message: "Application submitted successfully",
        applicationId: result.insertId,
      });
    });
  } catch (error) {
    console.error("Error during worker application:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const userSignup = async (req, res) => {
  const { name, dob, email, phone_no, password, address, city, pincode } = req.body;

  if (!name || !dob || !email || !phone_no || !password || !address || !city || !pincode) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const id = uuidv4();
    const hashedPassword = await getHashedPassword(password);
    const query = `INSERT INTO users (id, name, dob, email, phone_no, password, address, city, pincode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [id, name, dob, email, phone_no, hashedPassword, address, city, pincode], (err, result) => {
      if (err) {
        console.error("Error inserting user data:", err);
        return res.status(500).json({ message: "Error inserting user data" });
      }
      res.status(201).json({ message: "User registered successfully", userId: id });
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = (req, res) => {
  const { email, password, user_type } = req.body;
  let selectUserQuery;
  let is_admin = false;
  let tableName;

  if (email.includes("@admin.fixit")) {
    selectUserQuery = "SELECT * FROM administrator WHERE email = ?";
    is_admin = true;
  } else {
    tableName = user_type === "USER" ? "users" : "worker_applications";
    selectUserQuery = `SELECT * FROM ${tableName} WHERE email = ?`;
  }

  db.query(selectUserQuery, [email], async (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (result.length === 0) {
      if (user_type === "WORKER") {
        const queryRejectedWorker = `SELECT * FROM worker_application_rejected WHERE email = ?`;
        return db.query(queryRejectedWorker, [email], (error, rejectedResult) => {
          if (error) {
            return res.status(500).json({ message: "Internal Server Error" });
          }

          if (rejectedResult.length === 0) {
            return res.status(400).json({
              message: "Worker not found. Please sign up for a new account.",
            });
          }

          return res.status(403).json({
            message: "Your application was rejected. Please provide valid credentials.",
          });
        });
      } else {
        return res.status(400).json({ message: "User not found Please signup for a new account" });
      }
    }

    const user = result[0];
    let isPasswordMatched;
    
    if (email.includes("@admin.fixit") && password === user.password) {
      isPasswordMatched = true;
    } else {
      isPasswordMatched = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordMatched) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    if (tableName === "worker_applications" && user.is_verified === "false") {
      return res.status(202).json({
        message: "Still your application is under verification...thank you for your patience",
      });
    }

    const payload = {
      user_id: user.id,
      user_type: is_admin ? "ADMIN" : user_type,
    };
    
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET);
    return res.status(200).json({
      jwt_token: jwtToken,
      user_type: is_admin ? "ADMIN" : user_type,
    });
  });
};

const forgotPassword = async (req, res) => {
  const { email, user_type } = req.body;
  const tableName = user_type === "USER" ? "users" : "worker_applications";

  const checkUserQuery = `SELECT * FROM ${tableName} WHERE email = ?`;
  db.query(checkUserQuery, [email], async (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Email not registered" });
    }

    const otp = generateOtp();
    const subject = "FixIt Password Reset OTP";
    const text = `
Dear User,

We received a request to reset your password.

Your OTP for password reset is:
---- ${otp} ----

This OTP is valid for 10 minutes.

If you did not request this, please ignore this email.

Thank you,
FixIt Team`;

    try {
      const emailSent = await sendMail(email, subject, text);
      if (emailSent) {
        await storeOtp(email, otp);
        res.status(200).json({ message: "OTP sent successfully" });
      } else {
        res.status(500).json({ message: "Error sending OTP" });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Error sending OTP" });
    }
  });
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword, user_type } = req.body;
  const tableName = user_type === "USER" ? "users" : "worker_applications";

  try {
    const result = await verifyOtp(email);
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const otpData = result[0];
    const originalOtp = parseInt(otpData.otp, 10);
    
    if (originalOtp === parseInt(otp, 10)) {
      await deleteOtp(email);
      const hashedPassword = await getHashedPassword(newPassword);
      const updatePasswordQuery = `UPDATE ${tableName} SET password = ? WHERE email = ?`;
      
      db.query(updatePasswordQuery, [hashedPassword, email], async (updateErr) => {
        if (updateErr) {
          console.error("Error updating password:", updateErr);
          return res.status(500).json({ message: "Internal Server Error" });
        }
        
        const subject = "FixIt Password Reset Successful";
        const text = `
Dear User,

We are pleased to inform you that your password has been successfully reset.

If you did not request this change, please contact our support team immediately.

Thank you for using FixIt!

Best Regards,
FixIt Team`;

        const emailSent = await sendMail(email, subject, text);
        if (emailSent) {
          return res.status(200).json({ message: "Password reset successfully" });
        }
        return res.status(500).json({ message: "Error sending email" });
      });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  sendOtp,
  verifyOtp: verifyOtpHandler,
  userSignup,
  workerApplication,
  login,
  forgotPassword,
  resetPassword,
};
