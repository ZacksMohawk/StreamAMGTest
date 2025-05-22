const Logger = require('./Logger');
const amqp = require('amqplib/callback_api');

const queue = 'metadata';

function sendMessage(message){
    amqp.connect('amqp://localhost', function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            channel.assertQueue(queue, {
                durable: false
            });

            channel.sendToQueue(queue, Buffer.from(message));

            Logger.log("Sent to RabbitMQ: " + message);
        });
        setTimeout(function() {
            connection.close();
        }, 500);
    });
}


module.exports = {
    sendMessage : sendMessage
}