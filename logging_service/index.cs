using System;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.IO;

class Logger
{
    public static void Main()
    {
        var factory = new ConnectionFactory() { HostName = "localhost" };
        using(var connection = factory.CreateConnection())
        using(var channel = connection.CreateModel())
        {
            var orderExchange = "order_exchange";
            var queueName = channel.QueueDeclare().QueueName;
            var routingKey = "create_order";

            channel.ExchangeDeclare(exchange: "direct_logs", type: "direct");
            channel.QueueBind(queueName,orderExchange, routingKey, null);

            Console.WriteLine(" [*] Waiting for messages.");

            var consumer = new EventingBasicConsumer(channel);
            consumer.Received += (model, ea) =>
            {
                var body = ea.Body;
                var message = Encoding.UTF8.GetString(body);
                Console.WriteLine(message);

                string path = Directory.GetCurrentDirectory();
                using (StreamWriter write = new StreamWriter(Path.Combine(path, "log.txt"), true))
                {
                    write.WriteLine("Log: " + message);
                }
            };
            channel.BasicConsume(queueName,true, consumer);

            Console.WriteLine(" Press [enter] to exit.");
            Console.ReadLine();
        }
    }
}