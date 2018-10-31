const express = require('express');
const bodyParser = require('body-parser');
const PORT = 3000;
const app = express();
const amqp = require('amqplib/callback_api');

const messageBrokerInfo = {
    exchanges: {
        order: 'order_exchange'
    },
    routingKeys: {
        createOrder: 'create_order'
    }
}

const createMessageBrokerConnection = () => new Promise((resolve, reject) => {
    amqp.connect('amqp://localhost', (err, conn) => {
        if (err) { reject(err); }
        resolve(conn);
    });
});

const createChannel = connection => new Promise((resolve, reject) => {
    connection.createChannel((err, channel) => {
        if (err) { reject(err); }
        resolve(channel);
    });
});

const configureMessageBroker = channel => {
    Object.values(messageBrokerInfo.exchanges).forEach(val => {
        channel.assertExchange(val, 'direct', { durable: true });
    });
};

(async () => {
    const messageBrokerConnection = await createMessageBrokerConnection();
    const channel = await createChannel(messageBrokerConnection);

    configureMessageBroker(channel);

    const { order } = messageBrokerInfo.exchanges;
    const { createOrder } = messageBrokerInfo.routingKeys;

    app.use(bodyParser.json());

    // Create new order
    // http://localhost:3000/api/orders
    // add json object in body
    app.post('/api/orders', (req, res) => {
        const { body } = req;
        const bodyJSON = JSON.stringify(body);

        channel.publish(order, createOrder, new Buffer(bodyJSON));
        console.log(`[x] sent: ${bodyJSON}`);
        return res.json('All is well');
    });

    app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
})().catch(e => console.error(e));
