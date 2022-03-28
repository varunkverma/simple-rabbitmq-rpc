const amqp = require("amqplib/callback_api");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: rpc_client.js num");
  process.exit(1);
}

amqp.connect("amqp://localhost", (err0, connection) => {
  if (err0) {
    throw err0;
  }

  connection.createChannel((err1, channel) => {
    if (err1) {
      throw err1;
    }

    // Listening for response from rpc
    channel.assertQueue(
      "",
      {
        exclusive: true,
      },
      (err2, q) => {
        if (err2) {
          throw err2;
        }
        const correlationId = generateUuid();
        const num = parseInt(args[0]);

        console.log(`[x] Requesting fib(${num})`);

        channel.consume(
          q.queue,
          (msg) => {
            console.log(`Recieved:\n ${msg.properties.correlationId}`);
            if (msg.properties.correlationId == correlationId) {
              console.log(` [.] Got ${msg.content.toString()}`);
              setTimeout(() => {
                connection.close();
                process.exit(0);
              }, 500);
            }
          },
          {
            noAck: true,
          }
        );

        // sending rpc request to server's queue
        channel.sendToQueue("rpc_queue", Buffer.from(num.toString()), {
          correlationId: correlationId,
          replyTo: q.queue,
        });
      }
    );
  });
});

function generateUuid() {
  return (
    Math.random().toString() +
    Math.random().toString() +
    Math.random().toString()
  );
}
