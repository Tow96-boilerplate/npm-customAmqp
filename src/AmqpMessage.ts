/** AmqpMessage
 * Copyright (c) 2021, Jose Tow
 * All rights reserved.
 * Class that holds the properties for the messages that will be exchanged between the services
 *
 * Also contains some predefined messages for errors
 */

import { Response } from 'express';
export default class AmqpMessage {
  status: number;
  type: string;
  payload: any;

  constructor(thePayload: any = null, theType: string = '', theStatus: number = 500) {
    this.status = theStatus;
    this.type = theType;
    this.payload = thePayload;
  }

  /** errorMessage
   * Special AmqpMessage designed to quickly create error messages
   *
   * @param {string} message Main message for the error
   * @param {status} number HTTP status
   * @param {any} errors JSON with more specific errors
   *
   * @returns AmqpMessage
   */
  static errorMessage = (message: string, status: number = 500, errors: any = null): AmqpMessage => {
    // Creates the payload
    const payload: any = { message };
    if (errors) {
      payload.errors = errors;
    }

    return new AmqpMessage(payload, '', status);
  };

  /** sendHttpError
   *
   * Utilized for error catching, exists so I don't forget error type checking
   */
  static sendHttpError = (res: Response, error: any): void => {
    if (error instanceof AmqpMessage) {
      res.status(error.status).send(error.payload);
    } else {
      res.status(400).send(error);
    }
  };
}
