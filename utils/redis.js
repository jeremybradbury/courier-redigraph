/**
 * Redis utilities
 */
const Redis = require("ioredis");
const redis = new Redis({ password: process.env.REDIS_AUTH });
const MAX_EXPIRY = 3600; // seconds
const DEFAULT_EXPIRY = 600; // seconds
const { RedisPubSub } = require("graphql-redis-subscriptions");
const pubsub = new RedisPubSub({
  publisher: new Redis({ password: process.env.REDIS_AUTH }),
  subscriber: new Redis({ password: process.env.REDIS_AUTH }),
});

const get = async (key) => {
  try {
    return JSON.parse(await redis.get(key));
  } catch (e) {
    return null;
  }
};

const set = async (key, data) => {
  try {
    await redis.set(key, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
};

const publish = async (data, topic, type = "thread") => {
  try {
    if (data.expiry > 0) {
      pubsub.publish(topic, { [type]: data });
    } else {
      await expire(topic, 0); // purge it now
      return data; // from before the purge
    }
    // validate expiry
    if (data.expiry < 60) {
      data.warn = [
        ...data.warn,
        `expiry must be more than 1 minute - ${
          DEFAULT_EXPIRY / 60
        } minute default used`,
      ];
      console.warn(data.warn);
      data.expiry = DEFAULT_EXPIRY; // fallback to default
    }
    // validate expiry
    if (data.expiry > 3600) {
      data.warn = [
        ...data.warn,
        `expiry must be less than ${MAX_EXPIRY / 60} minutes - ${
          MAX_EXPIRY / 60
        } minute max used`,
      ];
      console.warn(data.warn);
      data.expiry = MAX_EXPIRY; // fallback to max
    }
    // disable debugging for prod
    if (process.env.NODE_ENV !== "production") console.debug(data);

    // save it
    await set(topic, data);
    await expire(topic, data.expiry); // mark it for expiry
    return data;
  } catch (e) {
    console.error(e);
  }
};

const expire = async (...props) => await redis.expire(...props);

module.exports = {
  get,
  set,
  publish,
  expire,
  pubsub,
};
