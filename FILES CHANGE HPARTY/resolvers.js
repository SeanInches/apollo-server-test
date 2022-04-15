const { AuthenticationError } = require("apollo-server-express");
const { isConstValueNode } = require("graphql");
const { User, Party, Rule, Message } = require("../models");
const { signToken } = require("../utils/auth");
const { PubSub } = require("graphql-subscriptions");

const resolvers = {
  Query: {
    users: async (parent, args) => {
      return await User.find();
    },
    user: async (parent, args) => {
      return await User.findById(args);
    },

    parties: async (parent, args) => {
      return await Party.findById(args).populate("rules");
    },
    rules: async (parent, args) => {
      return await Rule.find(args);
    },
    party: async (parent, args) => {
      const party = await Party.findById(args).populate("rules");
      return party;
      // console.log({ ...party });
    },
    message: (_, { ID }) => {
      Message.findById(ID);
    },
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      console.log("New user added");
      return { token, user };
    },
    addParty: async (parent, args, context) => {
      if (context.user) {
        const party = await Party.create(args);

        await User.findByIdAndUpdate(context.user._id, {
          $push: { parties: party },
        });

        return party;
      }
      throw new AuthenticationError("Not logged in");
    },
    createMessage: async (_, { messageInput: { text, username } }) => {
      const newMessage = new Message({
        text: text,
        createdBy: username,
      });

      const res = await newMessage.save();

      PubSub.publish("MESSAGE_CREATED", {
        messageCreated: {
          text: text,
          createdBy: username,
        },
      });

      return {
        id: res.id,
        ...res._doc,
      };
    },
    addRule: async (parent, { name, partyId }) => {
      const rule = await Rule.create({ name });

      await Party.findByIdAndUpdate(partyId, {
        $push: { rules: rule },
      });
      return rule;
    },
    // addUsers: async (parent, args, contect) => {};
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);
      console.log("you are logged in");
      return { token, user };
    },
  },
  Subscription: {
    messageCreated: {
      subscribe: () => PubSub.asynciterator("MESSAGE_CREATED"),
    },
  },
};

module.exports = resolvers;
