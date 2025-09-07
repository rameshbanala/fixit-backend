const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const { submitFeedback } = require("../controllers/feedbackController");

// Feedback routes - matching your original endpoints exactly
router.post("/feedback", authenticateToken, submitFeedback);

module.exports = router;
