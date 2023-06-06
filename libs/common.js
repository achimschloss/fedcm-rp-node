const low = require("lowdb");
const fs = require("fs");

if (!fs.existsSync("./.data")) {
  fs.mkdirSync("./.data");
}

const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(".data/db.json");
const db = low(adapter);
//db.defaults({ users: [] }).write();

function csrfCheck(req, res, next) {
  if (
    req.header("X-Requested-With") === "XMLHttpRequest" ||
    req.header("Sec-FedCM-CSRF") === "?1"
  ) {
    next();
  } else {
    return res.status(400).json({ error: "Invalid access." });
  }
}

/**
 * Checks CSRF protection using custom header `X-Requested-With`
 * If the session doesn't contain `signed-in`, consider the user is not authenticated.
 **/
function sessionCheck(req, res, next) {
  if (!req.session.user_id) {
    res.status(401).json({ error: "not signed in." });
    return;
  }
  const user = db.get("users").find({ user_id: req.session.user_id }).value();
  if (!user) {
    return res.status(401).json({ error: "User not found." });
  }
  res.locals.user = user;

  next();
}

function getUser(user_id, username = "", name = "", picture = "") {
  // See if account already exists
  let user = db.get("users").find({ user_id }).value();
  // If user entry is not created yet, create one
  if (!user) {
    user = {
      user_id,
      username,
      name,
      picture,
    };
    try {
      db.get("users").push(user).write();
    } catch (error) {
      console.error("Error writing to the database:", error);
    }
  } else {
    // If user entry already exists, update it
    // this is to support different scope (updating the user object if more scopes are presen)
    user = {
      ...user,
      username,
      name,
      picture,
    };
    try {
      db.get("users").find({ user_id }).assign(user).write();
    } catch (error) {
      console.error("Error updating the database:", error);
    }
  }
  return user;
}


module.exports = { csrfCheck, sessionCheck, getUser };
