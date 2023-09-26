const jwt = require("jsonwebtoken");
var config = require("./config/ormconfig.json");

function jwtGenerator(userId) {
  const payload = {
    user: {
      userId: user[0].id,
      email: user[0].email,
    },
  };
  console.log(payload);

  return jwt.sign(payload, config.JWTSecret, { expiresIn: "1d" });
}

module.exports = jwtGenerator;
