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
    this.notes = notes;
  }

  /** find all customers. */

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
      ['%' + query + '%']
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

  getFullName() {
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

    return results.rows.map((c) => ([new Customer(c), c.reservationsCount]));
  }
}

module.exports = Customer;
