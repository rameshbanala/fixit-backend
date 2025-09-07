const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const { getWorkerData, updateProfile } = require("../controllers/workerController");

// Worker routes - matching your original endpoints exactly
router.get("/get-worker-data", authenticateToken, getWorkerData);
// Note: update-profile for worker will be handled in userRoutes since it's the same endpoint

module.exports = router;
