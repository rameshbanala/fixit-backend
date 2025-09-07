const db = require("../config/database");

const submitFeedback = (request, response) => {
  const { rating, comments } = request.body;
  const { user_id, user_type } = request;
  
  const query = `INSERT INTO feedback(id, user_type, rating, comments) VALUES (?, ?, ?, ?)`;
  
  db.query(query, [user_id, user_type, parseInt(rating), comments], (error, result) => {
    if (error) {
      return response.status(500).json({ 
        message: "Internal Server Error", 
        error: error.message 
      });
    }
    
    response.status(200).json({ message: "Successfully submitted the feedback" });
  });
};

module.exports = {
  submitFeedback,
};
