const { gql } = require("apollo-server");

const schema = gql`
  """
  a session is a public key, that belongs to a thread
  """
  type Session {
    """
    identifies user sessions, id is created on thread start
    """
    id: UUID

    """
    a public key to send data to this session
    """
    publicKey: String
  }

  """
  a private conversation
  """
  type Thread {
    """
    A globally unique identifier. Can be used in various places throughout the system to identify this single value.
    """
    id: UUID

    """
    session id that invited & created the thread
    """
    hostId: UUID

    """
    session id that joined the thread
    """
    sessionId: UUID

    """
    parts of a message
    """
    parts: [String]

    """
    seconds until message expires
    """
    expiry: Int

    """
    message identifier
    """
    stub: Int

    """
    sharable code
    """
    code: Int
  }

  type Query {
    session(id: UUID!): Session
    thread(id: UUID, sessionId: UUID, code: Int): Thread
  }

  type Mutation {
    session(publicKey: String!): Session
    thread(id: UUID!, sessionId: UUID!, parts: [String]!, expiry: Int): Thread
    startThread: Thread
    joinThread(sessionId: UUID!, code: Int!): Thread
    destroyMySession(id: UUID!): Session
    destroyMyThread(id: UUID!, sessionId: UUID!): Thread
  }

  type Subscription {
    thread(id: UUID!): Thread
  }

  """
  A universally unique identifier as defined by [RFC 4122](https://tools.ietf.org/html/rfc4122).
  """
  scalar UUID
`;

module.exports = schema;
