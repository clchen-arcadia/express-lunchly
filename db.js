"use strict";

/** Database for lunchly */

const { Client } = require("pg");

// TODO: Switch this between mac and windows users
const DB_URI =
  process.env.NODE_ENV === "test"
    // ? "postgresql://chris:chris@localhost/lunchly_test"
    // : "postgresql://chris:chris@localhost/lunchly";
    ? "postgresql:///lunchly_test"
    : "postgresql:///lunchly";

let db = new Client({
  connectionString: DB_URI,
});

db.connect();

module.exports = db;
