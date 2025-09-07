const db = require("../config/database");
const { getHashedPassword } = require("../utils/helpers");

const getUserData = (request, response) => {
  const { user_id } = request;
  const query = `SELECT * FROM users WHERE id = ?`;
  
  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return response.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
      });
    }
    
    if (result.length !== 0) {
      return response.status(200).json({ user_data: result[0] });
    } else {
      return response.status(400).json({ message: "User Data Not Found" });
    }
  });
};

const getUserWorkerOptions = (request, response) => {
  const { req_type } = request.query;
  const { user_type } = request;
  
  if (user_type === "WORKER") {
    return response.status(401).json({ message: "Unauthorized access" });
  }
  
  const query = `SELECT id, name, email, phone_no, city 
                 FROM worker_applications 
                 WHERE LOWER(types_of_professions) LIKE '%${req_type.toLowerCase()}%' 
                 AND is_verified = 'true';`;

  db.query(query, (err, result) => {
    if (err) {
      return response.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
      });
    }

    if (result.length !== 0) {
      return response.status(200).json(result);
    } else {
      return response.status(404).json({ message: "No matching workers found" });
    }
  });
};

const getWorkerProfileDetails = (request, response) => {
  const { id } = request.params;
  const query = `SELECT * FROM worker_applications WHERE id = ? AND is_verified = 'true';`;
  
  db.query(query, [id], (error, result) => {
    if (error) {
      return response.status(500).json({ 
        message: "Internal Server Error", 
        error: error.message 
      });
    }
    
    if (result.length !== 0) {
      return response.status(200).json(result);
    } else {
      return response.status(404).json({ message: "No matching workers found" });
    }
  });
};

const updateProfile = async (req, res) => {
  const { user_id } = req;
  let updates = req.body;
  
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No fields provided for update" });
  }

  try {
    if (updates.password !== undefined) {
      updates.password = await getHashedPassword(updates.password);
    }
    
    if (updates.address) {
      const { address, city, pincode } = updates.address;
      updates = {
        ...updates,
        ...(address && { address }),
        ...(city && { city }),
        ...(pincode && { pincode }),
      };
      delete updates.address;
    }

    delete updates.confirmNewPassword;

    const updateFields = [];
    const values = [];

    for (let field in updates) {
      updateFields.push(`${field} = ?`);
      values.push(updates[field]);
    }

    values.push(user_id);

    const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error updating profile:", err);
        return res.status(500).json({ message: "Error updating profile" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Profile updated successfully" });
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Error updating profile" });
  }
};

module.exports = {
  getUserData,
  getUserWorkerOptions,
  getWorkerProfileDetails,
  updateProfile,
};
