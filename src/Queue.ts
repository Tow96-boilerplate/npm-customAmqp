/** queue.ts
 * Copyright (c) 2021, Jose Tow
 * All rights reserved.
 *
 * Process that handles the most common rabbitMQ functions
 */
import dotenv from 'dotenv';
dotenv.config();

import amqlib from 'amqplib';
import logger from 'tow96-logger';
import AmqpMessage from './AmqpMessage';

/** Queue
 * Class that holds all the functions for the communication witht the rabbitMQ server
 */
export default class Queue {
  // Gets some values from the env, if not present, uses default values
  static serverUrl: string = process.env.RABBITMQ_URL || 'amqp://localhost';
  static exchangeName: string = process.env.EXCHANGE_NAME || 'exchange';
  static queueName: string = process.env.NAME || 'localQueue';

  /** startConnection
   *
   * Connects to the rabbitMQ server and logs it
   *
   * @param {string} url connection String to the server
   *
   * @returns {amqlib.Connection} Connection to the server
   */
  static startConnection = async (url: string = Queue.serverUrl) => {
    const connection = await amqlib.connect(url).catch((err: any) => {
      throw err;
    });

    logger.info('Connected to the rabbitMQ Server');

    return connection;
  };

  /** setUpChannelAndExchange
   *
   * @param {amqlib.Connection} connection Connection to the server
   * @param {string} type Type of exchange, defaults to 'direct'
   * @param {string} exchange Name of the exchange, defaults to the internal name
   */
  static setUpChannelAndExchange = async (
    connection: amqlib.Connection,
    type: string = 'direct',
    exchange: string = Queue.exchangeName,
  ): Promise<amqlib.Channel> => {
    // Creates the connection and sets its prefetch to 1
    const channel = await connection.createChannel();
    channel.prefetch(1);
    logger.info('Amqp channel created');

    // Checks if the exchange exists and if not, creates it
    await channel.assertExchange(exchange, type, { durable: false });
    logger.info(`Exchange: ${exchange}, asserted`);

    return channel;
  };

  /** publishWithReply
   *
   * Sends a message with a replyTo to the given queue
   *
   * @param {amqlib.Channel} channel Channel that will be used
   * @param {string} routingKey routing for exchange
   * @param {AmqpMessage} message data to be sent
   *
   * @returns {string} The correlationId to the sent message
   */
  static publishWithReply = (channel: amqlib.Channel, routingKey: string, message: AmqpMessage): string => {
    // Creates a random ID for the replyTo
    const corrId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Sends the message asynchronously
    channel.publish(Queue.exchangeName, routingKey, Buffer.from(JSON.stringify(message)), {
      replyTo: Queue.queueName,
      correlationId: corrId,
    });

    logger.debug(`Sent data to: ${routingKey}`);

    return corrId;
  };

  /** publishSimple
   *
   * Sends a message to the given queue
   *
   * @param {amqlib.Channel} channel Channel that will be used
   * @param {string} routingKey routing for exchange
   * @param {AmqpMessage} message data to be sent
   *
   * @returns {string} The correlationId to the sent message
   */
  static publishSimple = (channel: amqlib.Channel, routingKey: string, message: AmqpMessage): void => {
    channel.publish(Queue.exchangeName, routingKey, Buffer.from(JSON.stringify(message)));

    logger.debug(`Sent data to: ${routingKey}`);
  };

  /** respondToQueue
   *
   * Sends a message to an specific queue with a correlationId
   *
   * @param {amqlib.Channel} channel Channel that will be used
   * @param {string} queue Name of the queue that will be responded to
   * @param {string} correlationId Id of the message
   * @param {AmqpMessage} message data to be sent
   */
  static respondToQueue = (
    channel: amqlib.Channel,
    queue: string,
    correlationId: string,
    message: AmqpMessage,
  ): void => {
    // Sends the message
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { correlationId });

    logger.debug(`Answered to queue: ${queue}`);
  };

  /** fetchFromLocalQueue
   *
   * Reads the messages on the localQueue for a message with the given correlationId
   * It's used to fetch responses from the services. Has a timeout function implemented as well.
   *
   * @param {amqlib.Channel} channel Channel that will be used
   * @param {string} correlationId correlation Id of the message that is being looked upon
   * @param {number} timeout Timeout in seconds (default 10s)
   *
   * @retunrs {AmqpMessage} Response message
   */
  static fetchFromLocalQueue = async (
    channel: amqlib.Channel,
    correlationId: string,
    timeout: number = 10,
  ): Promise<AmqpMessage> => {
    const startTime = Date.now();
    let responded = false;

    let response = new AmqpMessage();

    while (Date.now() - startTime < timeout * 1000 && !responded) {
      const message = await channel.get(Queue.queueName, { noAck: false });

      if (message) {
        if (message.properties.correlationId === correlationId) {
          channel.ack(message);
          response = JSON.parse(message.content.toString()) as AmqpMessage;
          responded = true;
        }
      }
    }

    return response;
  };
}
