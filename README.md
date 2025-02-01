# Odin Project #27: Messaging App (RESTful API backend)

The goal of this Odin Project assignment was to create a full-stack messaging application. The backend is a RESTful API that was built with tools like TypeScript, Express, Prisma (with PostgreSQL), Passport and JWT for authentication. It has 20 endpoints for managing users, conversations and messages via CRUD operations. They can be accessed by a guest, user, conversation member or group conversation admin (depending on user permissions). The font-end was built with React and can be found in [this repo](https://github.com/BrightNeon7631/odin-messaging-app-frontend).

I started and finished this project in November 2024.

## Assignment

[The Odin Project - NodeJS - #27 Messaging App](https://www.theodinproject.com/lessons/nodejs-messaging-app)

## Technology

- TypeScript
- Express
- Express validator
- Passport (with passport-jwt strategy)
- Jsonwebtoken
- Prisma (PostgreSQL as db)
- Bcrypt
- Node.js

#### Additional NPM packages:

- Express rate limit
- nodemon
- helmet
- CORS
- dotenv

## Key Concepts

- TypeScript: static vs dynamic typing
- REST API: JSON, HTTP Methods, CORS
- Prisma: ORM, connecting to a PostreSQL db, Prisma Schema, data models, Prisma Client, database migrations, CRUD, queries, relations
- JSON Web Tokens: token authentication vs session based authentication, authorization header; jsonwebtoken library: signing & verifying tokens, token expiration; passport & passport-jwt strategy: verifyCallback function, jwt payload object, passport.authenticate middleware
- Express: setting up an app, middleware functions
- Routes: Express Router, HTTP verbs, paths
- Controllers: response methods, middleware, CRUD operations in the database
- Express validator: form data validation: body() function & validationResult
- Error handling: error middleware function, custom errors
- bcrypt: bcrypt.hash: hashing passwords, bcrypt.compare(): compares plain-text password to the hashed password

## Data Model

The Prisma data model has three tables: User, Conversation and Message.

## Authentication & Authorization

After creating a new account or logging into an existing one user will receive a JWT token. For protected routes, JWT token received with the Authorization header is validated to determine whether the user has access to the endpoint and its data.

## API Documentation

### User Endpoints

| Endpoint             | Method | Description                        | Access    |
| :------------------- | :----- | :--------------------------------- | :-------- |
| /api/user            | GET    | Fetch all users (only public data) | User      |
| /api/user/name/:name | GET    | Fetch users by name                | User      |
| /api/user/:id        | PATCH  | Update a user                      | Same user |
| /api/user/:id        | DELETE | Delete a user                      | Same user |
| /api/user/signup     | POST   | Create a user and get a jwt token  | All       |
| /api/user/login      | POST   | Log in and get a jwt token         | All       |

### Conversation Endpoints

| Endpoint                                                   | Method | Description                                                 | Access                         |
| :--------------------------------------------------------- | :----- | :---------------------------------------------------------- | :----------------------------- |
| /api/conversation                                          | POST   | Create a new conversation                                   | User                           |
| /api/conversation/:id/info                                 | PATCH  | Update a conversation title or image                        | Admin of a group conversation  |
| /api/conversation/:id/delete                               | DELETE | Delete a group conversation                                 | Admin of a group conversation  |
| /api/conversation/:id/leave                                | PATCH  | Leave a group conversation                                  | Member of a group conversation |
| /api/conversation/user/:userid                             | GET    | Fetch all user conversations (with 10 most recent messages) | Same user                      |
| /api/conversation/:conversationid/user/:userid             | GET    | Fetch a user conversation with all messages                 | Same user                      |
| /api/conversation/:conversationid/user/:userid/remove      | PATCH  | Remove a user from a group conversation                     | Admin of a group conversation  |
| /api/conversation/:conversationid/user/:userid/add         | PATCH  | Add a user to a group conversation                          | Admin of a group conversation  |
| /api/conversation/:conversationid/user/:userid/admingive   | PATCH  | Grant admin status                                          | Admin of a group conversation  |
| /api/conversation/:conversationid/user/:userid/adminremove | PATCH  | Remove admin status                                         | Admin of a group conversation  |

### Message Endpoints

| Endpoint                                  | Method | Description                    | Access                   |
| :---------------------------------------- | :----- | :----------------------------- | :----------------------- |
| /api/message/conversation/:conversationid | POST   | Create a new message           | Member of a conversation |
| /api/message/markread                     | PATCH  | Mark selected messages as read | Same user                |
| /api/message/:id/edit                     | PATCH  | Update a message               | Same user                |
| /api/message/:id/delete                   | PATCH  | Mark a message as deleted        | Same user                |

### API Testing

To test the API you can use tools like Insomnia, Postman or curl.

## Links

[Front-end Repo](https://github.com/BrightNeon7631/odin-messaging-app-frontend)

## Deployment

Requires setting up a PostreSQL database and adding its URL to the .env file. Instructions for Linux and macOS can be found [here on The Odin Project website](https://www.theodinproject.com/lessons/nodejs-installing-postgresql).

```bash
# clone repo
git clone https://github.com/BrightNeon7631/odin-messaging-app-backend.git

# install project dependencies
npm install

# generate prisma client
npx prisma generate

# start server
npm run dev
```
