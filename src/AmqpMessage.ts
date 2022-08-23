/** AmqpMessage
 * Copyright (c) 2021, Jose Tow
 * All rights reserved.
 * Class that holds the properties for the messages that will be exchanged between the services
 *
 * Also contains some predefined messages for errors
 */

import { Response } from 'express';

export interface ErrorMessage {
  message: string;
  errors: any;
}

export default class AmqpMessage<P = any> {
  status: number;
  type: string;
  payload: P;
  language: string;

  constructor(thePayload: P = {} as P, theType: string = '', theStatus: number = 500, theLanguage: string = 'en') {
    this.status = theStatus;
    this.type = theType;
    this.payload = thePayload;
    this.language = theLanguage;
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
  static errorMessage = (
    message: string,
    status: number = 500,
    errors: any = null,
    language: string = 'en',
  ): AmqpMessage<ErrorMessage> => {
    // Creates the payload
    const payload: any = { message };
    if (errors) {
      payload.errors = errors;
    }

    return new AmqpMessage(payload, 'Error', status, language);
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
