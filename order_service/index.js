const amqp = require('amqplib/callback_api');
const { Order, OrderItem} = require('./data/db');

const messageBrokerInfo = {
    exchanges: {
        order: 'order_exchange'
    },
    queues: {
        orderQueue: 'order_queue'
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
    const { order } = messageBrokerInfo.exchanges;
    const { orderQueue } = messageBrokerInfo.queues;
    const { createOrder } = messageBrokerInfo.routingKeys;

    channel.assertExchange(order, 'direct', {durable: true});
    channel.assertQueue(orderQueue, {durable: true});
    channel.bindQueue(orderQueue, order, createOrder);
};

(async () => {
    const messageBrokerConnection = await createMessageBrokerConnection();
    const channel = await createChannel(messageBrokerConnection);

    configureMessageBroker(channel);

    const { order } = messageBrokerInfo.exchanges;
    const { orderQueue } = messageBrokerInfo.queues;
    const { createOrder } = messageBrokerInfo.routingKeys;

    channel.consume(orderQueue, data => {

        const dataJson = JSON.parse(data.content.toString());
        var items = dataJson.items;
        var totalPrice = 0;

        const newOrder = new Order;
        newOrder.customerEmail = dataJson.email;
        for (var i in items) {
            totalPrice += items[i].quantity * items[i].unitPrice;
        }
        newOrder.totalPrice = totalPrice;
        newOrder.orderDate = new Date();

        Order.create(newOrder,(err) => {
            if(err) return err;
        });

        for (var i in items) {
            const newOrderItem = new OrderItem;
            newOrderItem.description = items[i].description;
            newOrderItem.quantity = items[i].quantity;
            newOrderItem.unitPrice = items[i].unitPrice;
            newOrderItem.rowPrice = items[i].quantity * items[i].unitPrice;
            newOrderItem.orderId = newOrder._id;

            OrderItem.create(newOrderItem,(err) => {
                if(err) return err;
            });
        }

    }, { noAck: true });


})().catch(e => console.error(e));
