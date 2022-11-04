"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const { BadRequestError } = require("../expressError");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this._numGuests = numGuests;
    this.startAt = startAt;
    this._notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** get reservation by id */

  static async getReservationById(id) {
    const results = await db.query(`
    SELECT id,
    customer_id AS "customerId",
    num_guests AS "numGuests",
    start_at AS "startAt",
    notes AS "notes"
    FROM reservations
    WHERE id = $1`,
    [id]);
    return new Reservation(results.rows[0]);
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  /** Set the number of guests.
   * Accepts the number of guests.
   * If have fewer than 1 guest, throw BadRequestError.
   */
  set numGuests(val) {
    if (val < 1) {
      throw new BadRequestError("Must have at least 1 guest!");
    } else {
      this._numGuests = val;
    }
  }

  /** Get the number of guests. */
  get numGuests() {
    return this._numGuests;
  }

  /**
   * Set the notes.
   * Accepts a note: string.
   * If invalid, set to empty string.
   * Else, set the note.
   */
  set notes(val) {
    if (Boolean(val) === false) {
      this._notes = "";
      }
    else if (typeof val !== String) {
      throw new BadRequestError("Input must be a string!");
    } else{
      this._notes = val;
    }
  }

  /** Get the notes. */
  get notes() {
    return this._notes;
  }

  /** save this reservation. */
  //NOTE: style. "id=1" is SETTING
  // "id = 1" is CHECKING. strong CONVENTION

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET customer_id=$1,
                 start_at=$2,
                 num_guests=$3,
                 notes=$4
             WHERE id = $5`,
        [this.customerId, this.startAt, this.numGuests, this.notes, this.id]
      );
    }
  }
}

module.exports = Reservation;
