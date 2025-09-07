const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const workerRoutes = require("./routes/workerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use("/worker_proofs", express.static(path.join(__dirname, "../worker_proofs")));

// Routes - Direct mapping without /api prefix to match your original code
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", workerRoutes);
app.use("/", adminRoutes);
app.use("/", bookingRoutes);
app.use("/", feedbackRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("<h1>Hello this is FixIt backend</h1>");
});

module.exports = app;
