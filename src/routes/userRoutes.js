const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const {
  getUserData,
  getUserWorkerOptions,
  getWorkerProfileDetails,
  updateProfile,
} = require("../controllers/userController");

// User routes - matching your original endpoints exactly
router.get("/get-user-data", authenticateToken, getUserData);
router.get("/user-worker-options", authenticateToken, getUserWorkerOptions);
router.get("/worker-profile-details/:id", authenticateToken, getWorkerProfileDetails);
router.put("/update-profile", authenticateToken, updateProfile);

module.exports = router;
