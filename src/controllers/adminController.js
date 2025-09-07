const db = require("../config/database");
const { sendMail } = require("../services/emailService");

const getAdminPageDetails = (request, response) => {
  const first_query = "SELECT * FROM users;";
  const second_query = "SELECT * FROM worker_applications;";
  const third_query = "SELECT * FROM feedback;";

  db.query(first_query, (err, usersData) => {
    if (err) {
      console.error("Database error:", err);
      return response.status(500).json({ message: "Internal Server Error" });
    }

    db.query(second_query, (err, workerData) => {
      if (err) {
        console.error("Database error:", err);
        return response.status(500).json({ message: "Internal Server Error" });
      }
      
      db.query(third_query, (err, feedback) => {
        if (err) {
          console.error("Database error:", err);
          return response.status(500).json({ message: "Internal Server Error" });
        }
        
        response.status(200).json({ usersData, workerData, feedback });
      });
    });
  });
};

const verifyWorker = (request, response) => {
  const { id } = request.body;
  const query2 = `SELECT email FROM worker_applications WHERE id = ?`;
  
  db.query(query2, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return response.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
      });
    }
    
    if (result.length === 0) {
      return response.status(404).json({ message: "Worker not found" });
    }
    
    const email = result[0].email;
    const query = `UPDATE worker_applications SET is_verified = ? WHERE id = ?`;

    db.query(query, ["true", id], async (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return response.status(500).json({ 
          message: "Internal Server Error", 
          error: err.message 
        });
      }

      if (result.affectedRows === 0) {
        return response.status(404).json({ message: "Worker not found" });
      }
      
      const subject = "FixIt Account Verification";
      const text = `
Dear Worker,

Congratulations! 
Your application has been verified successfully. You can now start accepting work orders.

Thank you for choosing FixIt!

Best Regards,
FixIt Team`;

      const emailSent = await sendMail(email, subject, text);
      if (emailSent) {
        return response.status(200).json({ message: "Worker verified" });
      }
      return response.status(500).json({ message: "Error sending email" });
    });
  });
};

const rejectWorker = (request, response) => {
  const { id } = request.body;
  const query = `SELECT email, password, file_path FROM worker_applications WHERE id = ?`;

  db.query(query, [id], (error, result) => {
    if (error) {
      console.error("Database error:", error);
      return response.status(500).json({ 
        message: "Internal Server Error", 
        error: error.message 
      });
    }

    if (result.length === 0) {
      return response.status(404).json({ message: "Worker not found" });
    }

    const { email } = result[0];
    const query_2 = `INSERT INTO worker_application_rejected (email) VALUES (?)`;
    
    db.query(query_2, [email], (error, result) => {
      if (error) {
        console.error("Database error:", error);
        return response.status(500).json({ 
          message: "Internal Server Error", 
          error: error.message 
        });
      }

      if (result.affectedRows === 0) {
        return response.status(404).json({ message: "Worker rejection failed" });
      }

      const query_3 = `DELETE FROM worker_applications WHERE id = ?`;
      db.query(query_3, [id], async (error, result) => {
        if (error) {
          console.error("Database error:", error);
          return response.status(500).json({ 
            message: "Internal Server Error", 
            error: error.message 
          });
        }
        
        const subject = "FixIt Account Verification";
        const text = `
Dear Worker,

We regret to inform you that your application has been rejected.

Thank you for choosing FixIt!

Best Regards,
FixIt Team`;

        const emailSent = await sendMail(email, subject, text);
        if (emailSent) {
          return response.status(200).json({ message: "Worker rejected" });
        }
        return response.status(500).json({ message: "Error sending email" });
      });
    });
  });
};

module.exports = {
  getAdminPageDetails,
  verifyWorker,
  rejectWorker,
};
