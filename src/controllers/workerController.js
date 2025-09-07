const db = require("../config/database");
const { getHashedPassword } = require("../utils/helpers");

const getWorkerData = (request, response) => {
  const { user_id } = request;
  const query = `SELECT * FROM worker_applications WHERE id = ?`;
  
  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return response.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
      });
    }
    
    if (result.length !== 0) {
      return response.status(200).json({ worker_data: result[0] });
    } else {
      return response.status(400).json({ message: "Worker Data Not Found" });
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
    
    if (updates.professions) {
      updates = {
        ...updates,
        types_of_professions: updates.professions.join(","),
      };
      delete updates.professions;
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

    const sql = `UPDATE worker_applications SET ${updateFields.join(", ")} WHERE id = ?`;

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error updating profile:", err);
        return res.status(500).json({ message: "Error updating profile" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Worker not found" });
      }

      res.json({ message: "Profile updated successfully" });
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Error updating profile" });
  }
};

module.exports = {
  getWorkerData,
  updateProfile,
};
