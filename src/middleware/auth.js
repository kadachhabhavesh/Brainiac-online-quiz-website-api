const jwt = require('jsonwebtoken');
const UserModel = require("../model/UserModel");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    console.log(token);
    
    if (!token) {
      return res.status(401).send({ message: 'Unauthorized: Missing access token' });
    }
    const decoded = jwt.verify(token, "kZUhYBsxaAzPnbZUmRoWmlFGkfxXIuwR");
    const user = await UserModel.findOne({ _id: decoded._id });
    if (!user) {
      return res.status(401).send({ message: 'Unauthorized: Invalid token' });
    }
    req.userInfo = user
    next();
  } catch (err) {
    console.log("### auth error ###",err);
    res.status(401).send({ message: 'Unauthorized', error: err });
  }
};

module.exports = auth;
