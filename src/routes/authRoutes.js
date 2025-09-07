const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  userSignup,
  workerApplication,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const upload = require("../config/multer");

// Auth routes - matching your original endpoints exactly
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/user-signup", userSignup);
router.post("/worker-application", upload.single("file"), workerApplication);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
