# tow96-logger

![License: BSD-3-Clause](https://img.shields.io/github/license/Tow96-boilerplate/npm-customamqp)

Wrapper for amqlib that I utilize for communication between services. Contains
some functions that I utilize the most.

If for some reason you want to utilize it, it can be added via npm with the 
command.

> npm install tow96-amqpwrapper

This library utilizes the following env variables:

> RABBITMQ_URL    # Url to the rabbitMQ server in format: amqp://user:pass@url
>
> EXCHANGE_NAME   # Name of the exchange that the functions will use
>
> NAME            # Name of the Queue that only this worker will use, intended for replyTo messages

This library also is connected to amqplib, so the regular functions from it can be used.

This library was created by utilizing [this](https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c) guide