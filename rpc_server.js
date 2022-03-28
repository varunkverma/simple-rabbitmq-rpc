const amqp = require("amqplib/callback_api");

amqp.connect("amqp://localhost", (err0, connection) => {
  if (err0) {
    throw err0;
  }

  connection.createChannel((err1, channel) => {
    if (err1) {
      throw err1;
    }

    const queue = "rpc_queue";

    channel.assertQueue(queue, {
      durable: false,
    });

    channel.prefetch(1);

    console.log(`[x] Awaiting for RPC requests`);

    channel.consume(queue, (msg) => {
      const n = parseInt(msg.content.toString());

      console.log(` [.] fib(${n})`);

      const res = fibonacci(n);

      console.log(
        ` [.] Res: ${res}, sending to queue: ${msg.properties.replyTo} with correlationId :${msg.properties.correlationId}`
      );

      channel.sendToQueue(msg.properties.replyTo, Buffer.from(res.toString()), {
        correlationId: msg.properties.correlationId,
      });

      channel.ack(msg);
    });
  });
});

function fibonacci(n) {
  if (n == 0 || n == 1) return n;
  else return fibonacci(n - 1) + fibonacci(n - 2);
}
