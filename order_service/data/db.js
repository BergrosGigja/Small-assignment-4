const orderSchema = require('./schema/order');
const orderItemSchema = require('./schema/orderItem');
const mongoose = require('mongoose');

const connection = mongoose.createConnection('mongodb://jodis:abc123@ds145463.mlab.com:45463/small_assignment_4', {
    useNewUrlParser: true
});

module.exports = {
    Order: connection.model('Order', orderSchema),
    OrderItem: connection.model('OrderItem', orderItemSchema)
};
