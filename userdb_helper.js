"use strict";
/* http://www.sqlitetutorial.net/sqlite-nodejs/ */
var _ = require("lodash");
var sqlite3 = require("sqlite3").verbose();

const db_file = ".data/users.db";

function User_DB_Helper() {}

User_DB_Helper.prototype.initDB = function() {
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
  });
};

User_DB_Helper.prototype.getState = function(userID) {
  return new Promise(function(resolve, reject) {
    let db = new sqlite3.Database(db_file, err => {
      if (err) {
        reject(err);
        return console.error(err.message);
      }
      let query = `SELECT state FROM users WHERE id = ?`;
      db.get(query, userID, (err, row) => {
        if (err) {
          reject(err);
          console.log(err.message);
        } else if (_.isUndefined(row)) {
          //This means there's no user with userId
          resolve();
        } else {
          resolve(row.state);
        }
      });
    });

    db.close(err => {
      if (err) {
        return console.error(err.message);
      }
    });
  });
};

User_DB_Helper.prototype.setState = function(userID, state) {
  return new Promise(function(resolve, reject) {
    let db = new sqlite3.Database(db_file, err => {
      if (err) {
        reject(err);
        return console.error(err.message);
      }
      let query = `INSERT OR REPLACE INTO users (id, state)
                  VALUES ('${userID}', '${state}')`;
      db.run(query, err => {
        if (err) {
          reject(err);
          console.log(err.message);
        } else {
          resolve(true);
        }
      });
    });

    db.close(err => {
      if (err) {
        return console.error(err.message);
      }
    });
  });
};

User_DB_Helper.prototype.deleteUser = function(userID) {
  return new Promise(function(resolve, reject) {
    let db = new sqlite3.Database(db_file, err => {
      if (err) {
        reject(err);
        return console.error(err.message);
      }
      let query = `DELETE FROM users WHERE id = ?`;
      db.run(query, userID, err => {
        if (err) {
          reject(err);
          console.log(err.message);
        } else {
          resolve(true);
        }
      });
    });

    db.close(err => {
      if (err) {
        return console.error(err.message);
      }
    });
  });
};

module.exports = User_DB_Helper;
