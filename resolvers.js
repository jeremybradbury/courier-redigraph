const { v4: uuid } = require("uuid");
const { get, publish, expire, pubsub } = require("./utils/redis");
const { getCode } = require("./utils/crypto");
const newThreadLimit = { max: 3, window: "5m" };
const newSessionLimit = { max: 5, window: "10m" };
const messageLimit = { max: 2, window: "1s" };
const throttle = require("./utils/throttle");

const exp = {
  s: 15 * 60, // sessions (shared public keys) expire in 15 minutes
  c: 10 * 60, // invite codes expire in 10 minutes, deleted on claim
  t: 1 * 60, // messages expire in 1 minute, cached locally
};

// redis key management
const k = {
  t: "$", // thread.id prefix
  s: "@", // session.id prefix
  n: "#", // stub (message id) prefix
  c: "?", // thread code prefix
};

// classic func generator pattern to track count
const getUnique =
  (count = 0) =>
  async () => {
    count++;
    if (count > 3) {
      throw "service is busy, try again later";
    }
    try {
      const code = getCode(6); // get a random code
      const existing = await get(k.c + code); // check for collisions
      return existing ? await getUnique(count)() : code; // recurse on collide
    } catch (e) {
      console.error(e);
      return await getUnique(count)(); // recurse on error
    }
  };

module.exports = {
  Query: {
    session: async (parent, args, context, info) => {
      await throttle({ parent, args, context, info, limit: newSessionLimit });
      return get(k.s + args.id);
    },
  },
  Mutation: {
    // redis upserts - will create or replace matching keys
    session: async (parent, args, context, info) => {
      await throttle({ parent, args, context, info, limit: messageLimit });
      args.expiry = args.expiry || exp.s; // only 1-60 minute expiry's allowed
      args.id = uuid();
      return publish(args, k.s + args.id, "session");
    },
    // each person will have only one key for their last message
    // which will expire in 60 seconds from last write
    // TLDR: there's no forgiveness for disconnects
    thread: async (parent, args, context, info) => {
      await throttle({ parent, args, context, info });
      args.expiry = args.expiry || exp.t; // only 1-60 minute expiry's allowed
      return publish(args, k.t + args.id + k.s + args.sessionId, "thread");
    },
    startThread: async (parent, args, context, info) => {
      await throttle({ parent, args, context, info, limit: newThreadLimit });
      const thread = {
        code: await getUnique()(),
        id: uuid(),
        expiry: exp.c,
      };
      return publish(thread, k.c + thread.code, "thread", thread.expiry);
    },
    joinThread: async (parent, args, context, info) => {
      await throttle({ parent, args, context, info, limit: newThreadLimit });
      let host;
      try {
        host = await get(k.c + args.code);
        if (host) await expire(k.c + args.code, 0);
      } catch (e) {
        console.error(e);
      }
      return publish(
        host ? Object.assign(args, host) : args,
        k.c + args.code,
        "thread",
        0
      ); // give me the result then expire it
    },
    destroyMySession: async (parent, args, context, info) => {
      await throttle({ parent, args, context, info, limit: newThreadLimit });
      return expire(k.s + args.id, 0);
    },
    destroyMyThread: async (parent, { id, sessionId }) => {
      await throttle({ parent, args, context, info, limit: newThreadLimit });
      return expire(k.s + id + k.t + sessionId, 0);
    },
  },
  Subscription: {
    thread: {
      subscribe: (_, { id, sessionId }) => {
        let pattern = false;
        let topic = k.t + id;
        if (sessionId) {
          topic += k.s + sessionId;
        } else {
          topic += "*";
          pattern = true;
        }
        return pubsub.asyncIterator(topic, { pattern });
      },
    },
  },
};
