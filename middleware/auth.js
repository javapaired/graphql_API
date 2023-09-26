const jwt = require("jsonwebtoken");
require("dotenv").config();
var config = require("../");

//this middleware will continue on if the token is inside the local storage

module.exports = function (req, res, next) {
  const token = req.header("token");

  try {
    if (!token) {
      return res.status(403).json({
        success: false,
        data: {
          message: "Authorization denied",
        },
      });
    }
    // Verify token

    //it is going to give the user id (user:{id: user.id})
    const verify = jwt.verify(token, config.JWTSecret);
    req.user = verify.user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      data: {
        message: "Token is not valid",
      },
    });
  }
};
