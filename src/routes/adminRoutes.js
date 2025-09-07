const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const {
  getAdminPageDetails,
  verifyWorker,
  rejectWorker,
} = require("../controllers/adminController");

// Admin routes - matching your original endpoints exactly
router.get("/admin-page-details", authenticateToken, getAdminPageDetails);
router.post("/verify-the-worker", authenticateToken, verifyWorker);
router.post("/reject-the-worker", authenticateToken, rejectWorker);

module.exports = router;
