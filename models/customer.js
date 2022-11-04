"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this._notes = notes;
  }

  /** find all customers. */

  // NOTE: for translating psql vs JS style
  // AS firstName --> firstname
  // AS "firstName" --> firstName ('literally')
  // AS first Name XXX illegal
  // --> AS "first Name" legal

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** filter search customers by first or last name, using query */

  static async search(query) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers AS c
           WHERE
            c.first_name ILIKE $1
            OR c.last_name ILIKE $1
            OR CONCAT(c.first_name, ' ', c.last_name) ILIKE $1
           ORDER BY last_name, first_name`,
      ["%" + query + "%"]
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** get first and last name of customer in a string */

  get fullName() {
    return this.firstName + " " + this.lastName;
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  /** Get top 10 customers ordered by most reservations.
   *  Returns a two-member array, at idx=0 Customer instance, at idx=1 Reservations Count!
   */

  //TODO: give an example in docstring -- easier and better than explaining, is SHOWING!

  static async getTopCustomersAndCounts() {
    const results = await db.query(`
      SELECT  c.id,
              c.first_name AS "firstName",
              c.last_name  AS "lastName",
              c.phone,
              c.notes,
              COUNT(r.id) AS "reservationsCount"
      FROM customers AS c
      JOIN reservations AS r
      ON c.id = r.customer_id
      GROUP BY c.id
      ORDER BY COUNT(r.id) DESC
      LIMIT 10
    `);

    return results.rows.map((c) => [new Customer(c), c.reservationsCount]);
  }

  /**
   * Set the notes.
   * Accepts a note: string.
   * If invalid, set to empty string.
   * Else, set the note.
   */
  set notes(val) {
    if (typeof val !== String) {
      throw new BadRequestError("Input must be a string!");
    } else if (Boolean(val) === false) {
      this._notes = "";
    } else {
      this._notes = val;
    }
  }

  /** Get the notes. */
  get notes() {
    return this._notes;
  }
}

module.exports = Customer;
