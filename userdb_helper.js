"use strict";
/* http://www.sqlitetutorial.net/sqlite-nodejs/ */
const sqlite3 = require("sqlite3").verbose();

const db_file = ".data/users.db";

function User_DB_Helper() {}

function initDB() {
  // open database in memory
  let db = new sqlite3.Database(db_file, err => {
    if (err) {
      return console.error(err.message);
    }
    let query = `CREATE TABLE IF NOT EXISTS
              users(id text PRIMARY KEY,
                    state text NOT NULL)`;
    db.run(query, function(err) {
      if (err) {
        return console.log(err.message);
      }
    });
  });

  db.close(err => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Close the database connection.");
  });
}

User_DB_Helper.prototype.userExists = function(userID) {};

User_DB_Helper.prototype.getState = function(userID) {};

User_DB_Helper.prototype.setState = function(userID, state) {};

User_DB_Helper.prototype.deleteUser = function(userID) {};

module.exports = User_DB_Helper;
