const { v4: uuidv4 } = require("uuid");
const db = require("../config/database");
const { sendMail } = require("../services/emailService");

const bookWorker = (request, response) => {
  const { user_id } = request;
  const { worker_id, work_type } = request.body;

  if (!worker_id || !work_type) {
    return response.status(400).json({ 
      message: "Worker ID and work type are required." 
    });
  }

  // Check if there is an active or in-progress booking
  const checkQuery = `
    SELECT * FROM booking 
    WHERE user_id = ? AND worker_id = ? AND work_type = ? 
    AND (b_status = 'IN PROGRESS' OR b_status = 'ACTIVE');
  `;
  
  db.query(checkQuery, [user_id, worker_id, work_type], (checkError, checkResult) => {
    if (checkError) {
      return response.status(500).json({ 
        message: "Internal server error", 
        error: checkError.message 
      });
    }

    if (checkResult.length > 0) {
      return response.status(409).json({
        message: "You already have booking with this worker for the selected work type.",
      });
    }

    const query = `SELECT * FROM worker_applications WHERE id = ? AND is_verified = 'true';`;
    db.query(query, [worker_id], (error, result) => {
      if (error) {
        return response.status(500).json({ 
          message: "Internal server error", 
          error: error.message 
        });
      }

      if (result.length === 0) {
        return response.status(404).json({ message: "Worker not found" });
      }

      const worker = result[0];
      const workerEmail = worker.email;

      const userQuery = `SELECT * FROM users WHERE id = ?`;
      db.query(userQuery, [user_id], (error, result) => {
        if (error) {
          return response.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
          });
        }

        const user = result[0];
        const userEmail = user.email;

        const booked_at = new Date();
        const status = "IN PROGRESS";
        const status_changed_by = "USER BOOKED";
        const id = uuidv4();

        const insertQuery = `
          INSERT INTO booking (id, user_id, worker_id, b_status, work_type, booked_at, status_changed_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
        
        db.query(insertQuery, [id, user_id, worker_id, status, work_type, booked_at, status_changed_by], 
          async (insertError, insertResult) => {
            if (insertError) {
              return response.status(500).json({
                message: "Internal server error",
                error: insertError.message,
              });
            }

            if (insertResult.affectedRows === 0) {
              return response.status(400).json({ 
                message: "Failed to insert booking." 
              });
            }

            const userSubject = "FixIt Booking Confirmation";
            const userText = `
Dear User,
            
Your booking has been confirmed successfully.
            
You can now track the status of your booking in the My Booking Section.
            
Thank you for choosing FixIt!
            
Best Regards,
FixIt Team`;

            const workerSubject = "FixIt New Booking Notification";
            const workerText = `
Dear Worker,
            
You have received a new booking.
            
Please check your FixIt account for more details.
            
Best Regards,
FixIt Team`;

            try {
              const userMailResult = await sendMail(userEmail, userSubject, userText);
              if (!userMailResult) {
                return response.status(500).json({ 
                  message: "Error sending email to user" 
                });
              }

              const workerMailResult = await sendMail(workerEmail, workerSubject, workerText);
              if (!workerMailResult) {
                return response.status(500).json({ 
                  message: "Error sending email to worker" 
                });
              }

              return response.status(201).json({ 
                message: "Successfully Booked", 
                booking_id: id 
              });
            } catch (error) {
              return response.status(500).json({
                message: "Error sending emails",
                error: error.message,
              });
            }
          });
      });
    });
  });
};

const getBookingDetails = (request, response) => {
  const { user_id, user_type } = request;
  const { booking_id } = request.query;
  
  let data_condition;
  if (user_type === "USER") {
    data_condition = "user_id";
  } else if (user_type === "WORKER") {
    data_condition = "worker_id";
  } else {
    return response.status(400).json({ message: "User type not recognized" });
  }
  
  const bookingCondition = booking_id ? "AND booking.id = ?" : "";
  const queryParams = booking_id ? [user_id, booking_id] : [user_id];

  const query = `
    SELECT 
      booking.id AS booking_id,
      booking.user_id AS booking_user_id,
      booking.worker_id AS booking_worker_id,
      booking.b_status,
      booking.work_type,
      booking.booked_at,
      booking.status_changed_by,
      users.name AS user_name,
      users.email AS user_email,
      users.phone_no AS user_phone_no,
      users.address AS user_address,
      users.city AS user_city,
      users.pincode AS user_pincode,
      worker_applications.name AS worker_name,
      worker_applications.email AS worker_email,
      worker_applications.phone_no AS worker_phone_no,
      worker_applications.types_of_professions AS worker_professions,
      worker_applications.city AS worker_city,
      worker_applications.address AS worker_address,
      worker_applications.pincode AS worker_pincode,
      bills.total_bill as total_bill,
      bills.bill_status as bill_status
    FROM booking 
    INNER JOIN users ON booking.user_id = users.id 
    INNER JOIN worker_applications ON booking.worker_id = worker_applications.id 
    LEFT JOIN bills ON booking.id = bills.id
    WHERE ${data_condition} = ? 
    ${bookingCondition}
    AND worker_applications.is_verified = 'true' 
    ORDER BY booked_at DESC;
  `;

  db.query(query, queryParams, (error, result) => {
    if (error) {
      return response.status(500).json({ 
        message: "Internal server error", 
        error: error.message 
      });
    }
    response.status(200).json(result);
  });
};

const cancelBooking = (request, response) => {
  const { user_id, user_type } = request;
  const { booking_id } = request.body;
  const type_of_id = user_type === "USER" ? "user_id" : "worker_id";

  const query = `SELECT * FROM booking WHERE id = ?;`;
  db.query(query, [booking_id], (error, result) => {
    if (error) {
      return response.status(500).json({ 
        message: "Internal server error", 
        error: error.message 
      });
    }

    if (result.length === 0) {
      return response.status(404).json({ message: "Booking not found" });
    }

    const { user_id: bookingUserId, worker_id } = result[0];

    const workerQuery = `SELECT * FROM worker_applications WHERE id = ?;`;
    db.query(workerQuery, [worker_id], (error, result) => {
      if (error) {
        return response.status(500).json({ 
          message: "Internal server error", 
          error: error.message 
        });
      }

      if (result.length === 0) {
        return response.status(404).json({ message: "Worker not found" });
      }

      const worker = result[0];
      const workerEmail = worker.email;

      const userQuery = `SELECT * FROM users WHERE id = ?;`;
      db.query(userQuery, [bookingUserId], (error, result) => {
        if (error) {
          return response.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
          });
        }

        const user = result[0];
        const userEmail = user.email;

        const updateQuery = `
          UPDATE booking 
          SET b_status = "CANCELLED",
              status_changed_by = CONCAT(?, ' CANCELLED')
          WHERE id = ? AND ${type_of_id} = ? AND (b_status != "CANCELLED" AND b_status != "COMPLETED");
        `;
        
        db.query(updateQuery, [user_type, booking_id, user_id], async (error, result) => {
          if (error) {
            return response.status(500).json({ message: error.message });
          }

          if (result.affectedRows === 0) {
            return response.status(404).json({
              message: "No matching active booking found for this user/worker or booking is already cancelled",
            });
          }

          const userSubject = "FixIt Booking Cancellation";
          const userText = `
Dear User,

Your booking has been cancelled successfully.

Thank you for choosing FixIt!

Best Regards,
FixIt Team`;

          const workerSubject = "FixIt Booking Cancellation";
          const workerText = `
Dear Worker,

A Booking is Cancelled.
Check your FixIt account for more details.

Thank you for using FixIt!

Best Regards,
FixIt Team`;

          try {
            const userMailResult = await sendMail(userEmail, userSubject, userText);
            if (!userMailResult) {
              return response.status(500).json({ 
                message: "Error sending email to user" 
              });
            }

            const workerMailResult = await sendMail(workerEmail, workerSubject, workerText);
            if (!workerMailResult) {
              return response.status(500).json({ 
                message: "Error sending email to worker" 
              });
            }

            return response.status(200).json({ 
              message: "Booking cancelled successfully" 
            });
          } catch (error) {
            return response.status(500).json({
              message: "Error sending emails",
              error: error.message,
            });
          }
        });
      });
    });
  });
};

const generateBill = (request, response) => {
  const { booking_id, total_bill } = request.body;
  const { user_type } = request;

  if (user_type === "USER") {
    return response.status(401).json({ message: "You are not authorized" });
  }

  const query = `SELECT * FROM booking WHERE id = ?;`;
  db.query(query, [booking_id], (error, result) => {
    if (error) {
      return response.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return response.status(404).json({ message: "Booking not found" });
    }

    const { user_id } = result[0];
    const userQuery = `SELECT * FROM users WHERE id = ?;`;
    
    db.query(userQuery, [user_id], (error, result) => {
      if (error) {
        return response.status(500).json({ message: "Internal server error" });
      }

      const user = result[0];
      const userEmail = user.email;
      
      const insertBillQuery = `INSERT INTO bills(id, total_bill, bill_status) VALUES (?, ?, 'NOT PAID');`;
      
      db.query(insertBillQuery, [booking_id, total_bill], (error, result) => {
        if (error) {
          return response.status(500).json({ message: error });
        }
        
        const updateBookingQuery = `UPDATE booking SET b_status='ACTIVE', status_changed_by='WORKER ACCEPTED' WHERE id=?;`;
        
        db.query(updateBookingQuery, [booking_id], async (error, result) => {
          if (error) {
            return response.status(500).json({ message: "Internal server error" });
          }
          
          const subject = "FixIt Bill Generation";
          const text = `
Dear User,

A bill has been generated for your booking.

Total Bill: Rs.${total_bill}

Please login to your FixIt account to view and pay the bill.

Thank you for choosing FixIt!

Best Regards,
FixIt Team`;

          const emailSent = await sendMail(userEmail, subject, text);
          if (emailSent) {
            return response.status(200).json({ 
              message: "Bill generated successfully" 
            });
          }
          return response.status(500).json({ message: "Error sending email" });
        });
      });
    });
  });
};

const completeBooking = (request, response) => {
  const { booking_id } = request.body;
  const { user_type } = request;

  if (user_type === "WORKER") {
    return response.status(401).json({ 
      message: "You are not authorized to complete the booking" 
    });
  }

  const query = `SELECT * FROM booking WHERE id = ?;`;
  db.query(query, [booking_id], (error, result) => {
    if (error) {
      return response.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return response.status(404).json({ message: "Booking not found" });
    }
    
    const { worker_id, user_id } = result[0];

    const workerQuery = `SELECT * FROM worker_applications WHERE id = ?;`;
    db.query(workerQuery, [worker_id], (error, result) => {
      if (error) {
        return response.status(500).json({ message: "Internal server error" });
      }

      if (result.length === 0) {
        return response.status(404).json({ message: "Worker not found" });
      }

      const worker = result[0];
      const workerEmail = worker.email;

      const userQuery = `SELECT * FROM users WHERE id = ?;`;
      db.query(userQuery, [user_id], (error, result) => {
        if (error) {
          return response.status(500).json({ message: "Internal server error" });
        }

        const user = result[0];
        const userEmail = user.email;

        db.beginTransaction((error) => {
          if (error) {
            return response.status(500).json({ message: "Internal server error" });
          }

          const updateBookingQuery = `UPDATE booking SET b_status='COMPLETED', status_changed_by='USER PAID AMOUNT' WHERE id = ?;`;
          
          db.query(updateBookingQuery, [booking_id], (error, result) => {
            if (error) {
              return db.rollback(() => {
                response.status(500).json({ 
                  message: "Error updating booking status" 
                });
              });
            }

            const updateBillQuery = `UPDATE bills SET bill_status='PAID' WHERE id = ?;`;
            
            db.query(updateBillQuery, [booking_id], (error, result) => {
              if (error) {
                return db.rollback(() => {
                  response.status(500).json({ 
                    message: "Error updating bill status" 
                  });
                });
              }

              db.commit(async (error) => {
                if (error) {
                  return db.rollback(() => {
                    response.status(500).json({ 
                      message: "Error completing transaction" 
                    });
                  });
                }
                
                const userSubject = "FixIt Booking Completion";
                const userText = `
Dear User,

Your booking has been completed successfully.

Thank you for choosing FixIt!

Best Regards,
FixIt Team`;

                const workerSubject = "FixIt Booking Completion";
                const workerText = `
Dear Worker,

A Booking is Completed.
Check your FixIt account for more details.

Thank you for using FixIt!

Best Regards,
FixIt Team`;

                try {
                  const userMailResult = await sendMail(userEmail, userSubject, userText);
                  if (!userMailResult) {
                    return response.status(500).json({ 
                      message: "Error sending email to user" 
                    });
                  }

                  const workerMailResult = await sendMail(workerEmail, workerSubject, workerText);
                  if (!workerMailResult) {
                    return response.status(500).json({
                      message: "Error sending email to worker",
                    });
                  }

                  return response.status(200).json({
                    message: "Booking completed successfully",
                  });
                } catch (error) {
                  return response.status(500).json({
                    message: "Error sending emails",
                    error: error.message,
                  });
                }
              });
            });
          });
        });
      });
    });
  });
};

module.exports = {
  bookWorker,
  getBookingDetails,
  cancelBooking,
  generateBill,
  completeBooking,
};
