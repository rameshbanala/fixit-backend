const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const {
  bookWorker,
  getBookingDetails,
  cancelBooking,
  generateBill,
  completeBooking,
} = require("../controllers/bookingController");

// Booking routes - matching your original endpoints exactly
router.post("/booking-worker", authenticateToken, bookWorker);
router.get("/booking-details", authenticateToken, getBookingDetails);
router.put("/cancel-booking", authenticateToken, cancelBooking);
router.post("/generate-bill", authenticateToken, generateBill);
router.put("/complete-booking", authenticateToken, completeBooking);

module.exports = router;
