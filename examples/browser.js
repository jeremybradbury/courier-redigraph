// constants
// const url = "http://localhost:4000/graphql"; // static
const url = `${location.protocol}//${location.host}/graphql`; // dynamic
const { SubscriptionClient } = require("graphql-subscriptions-client");

// NOTE: `const funcName =` pattern prevent redefines
// - you may desire to use let/var/function to allow redefines
// - however browsers allow users & malware to hack
// - avoid changing from const if possible

// very simple query/mutate client using fetch
const graph = async (query, variables) => {
  query = query.replace(/[\s\r\n\t]+/g, " "); // vaccume inner whitespace
  query = query.replace(/[\s]+/, ""); // clean leading spaces
  try {
    const result = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify({ query, variables }),
    });
    const { data, errors } = await result.json();
    return { data, errors };
  } catch (err) {
    console.error(url, err);
    alert(err.message + "\n" + url);
  }
};

// GraphQL query bodies... in chronological order...-ish

// host: invite // TODO: allow multiple invites per thread
const START_THREAD = `mutation {
    startThread {
      id
      code
      expiry
    }
}`;
// both: start
const NEW_SESSION = `mutation ($publicKey: String!) {
    session(publicKey: $publicKey) {
        id
    }
}`;
// joiner: grab thread id & session id
let JOIN_THREAD = `mutation ($sessionId: UUID!, $code: Int!) {
  joinThread(sessionId: $sessionId, code: $code) {
    id
    sessionId
    hostId
    code
    expiry
  }
}`;
// joiner: grab public key
let GET_KEY = `query ($id: UUID!) {
  session(id: $id) {
      publicKey
  }
}`;
// both: engage
const WATCH_THREAD = `subscription ($id: UUID!) {
    thread(id: $id) {
      id
      hostId
      sessionId
      parts
    }
}`;
// both: say hi
const SEND_MESSAGE = `mutation ($id: UUID!, $sessionId: UUID!, $parts: [String]!, $expiry: Int) {
  thread(id: $id, sessionId: $sessionId, parts: $parts, expiry: $expiry) {
    id
    sessionId
    parts
    expiry
  }
}`;

// very simple websocket client
const wsclient = new SubscriptionClient(
  localStorage.getItem("graphql").replace("http", "ws"), // https -> wss too
  {
    lazy: true, // only connect when there is a query
    reconnect: true,
    connectionCallback: (err) =>
      err && console.error(err) && err.message && alert(err.message),
  }
);

// websocket subscription hook
const onMessage = async ({ data, errors }) => {
  if (errors) throw errors[0].message;
  if (!data) throw "missing data";
  let msg;
  const {
    thread: { id, parts, sessionId },
  } = data;
  console.log({ id, parts, sessionId });

  // TODO: finish this, possibly adding browser encryption

  // message from me, don't decode it
  // - show it in the "send"/onclick event, before encryption

  // message from them?
  // 1st message only: set their id
  // 1st message only: lookup their pubkey
  // 1st message only: overwrite my public key after sharing it
  // 1st message only: send a random "joined" message
  // 1) decode message key using my private key
  // 2) decode message
  // 3) show message
};

// websocket helper
const waitForIt = async (
  variables,
  query = WATCH_THREAD,
  next = ({ data }) => console.log(data),
  error = ({ message }) => console.error(message) && alert(err.message),
  complete = () => console.log("no more messages")
) => {
  query = query || WATCH_THREAD;
  console.log({ query, variables });
  return await wsclient
    .request({ query, variables })
    .subscribe({ next, error, complete });
};

// mutations & queries
const StartThread = async (variables) => await graph(START_THREAD, variables);
const NewSession = async (variables) => await graph(NEW_SESSION, variables);
const JoinThread = async (variables) => await graph(JOIN_THREAD, variables);
const GetKey = async (variables) => await graph(GET_KEY, variables);
const SendMessage = async (variables) => await graph(SEND_MESSAGE, variables);

// subscription
const watchThread = async (id = "") =>
  await waitForIt({ id }, WATCH_THREAD, onMessage);
