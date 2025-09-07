const db = require("../config/database");

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

const storeOtp = async (email, otp) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO otp_verifications (email, otp) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE otp = VALUES(otp), created_at = CURRENT_TIMESTAMP;
    `;
    db.query(query, [email, otp], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const verifyOtp = async (email, otp) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM otp_verifications WHERE email = ?`;
    db.query(query, [email], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const deleteOtp = async (email) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM otp_verifications WHERE email = ?`;
    db.query(query, [email], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

module.exports = {
  generateOtp,
  storeOtp,
  verifyOtp,
  deleteOtp,
};
