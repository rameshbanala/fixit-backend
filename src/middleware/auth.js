const jwt = require("jsonwebtoken");

const authenticateToken = (request, response, next) => {
  let jwt_token;
  const authHeader = request.headers["authorization"];
  
  if (authHeader !== undefined) {
    jwt_token = authHeader.split(" ")[1];
  }
  
  if (jwt_token === undefined) {
    return response.status(401).json({ message: "Invalid jwt token" });
  }
  
  jwt.verify(jwt_token, process.env.JWT_SECRET, (error, payload) => {
    if (error) {
      return response.status(401).json({ message: "Invalid JWT Token" });
    }
    
    request.user_id = payload.user_id;
    request.user_type = payload.user_type;
    next();
  });
};

module.exports = authenticateToken;
