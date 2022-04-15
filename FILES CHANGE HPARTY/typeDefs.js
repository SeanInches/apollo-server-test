const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Party {
    _id: ID
    name: String!
    users: [User]
    rules: [Rule]
    startDate: String
    endDate: String
  }
  type Message {
    text: String
    createdby: String
  }

  type Rule {
    _id: ID
    name: String!
    party: Party
  }

  type User {
    _id: ID
    username: String
    email: String
    parties: [Party]
  }

  type Auth {
    token: ID
    user: User
  }

  input MessageInput {
    text: String
    username: String
  }

  type Query {
    parties: [Party]
    rules(party: ID): [Rule]
    users: [User]
    party(_id: ID!): Party
    user(_id: ID!): User
    message(id: ID!): Message
  }

  type Mutation {
    addUser(username: String!, email: String!, password: String!): Auth
    addParty(name: String): Party
    addRule(name: String, partyId: String): Rule
    updateUser(username: String, email: String, password: String): User
    login(email: String!, password: String!): Auth
    createMessage(messageInput: MessageInput): Message!
  }

  type Subscription {
    messageCreated: Message
  }
`;

module.exports = typeDefs;
