const bcrypt = require("bcrypt");

const getHashedPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  getHashedPassword,
  comparePassword,
};
