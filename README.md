# GitChat

GitChat is a chatbot that is able to search and answer questions about a GitHub repository.

![hello](public/hello.png)

## Usecases

You can use this chatbot to answer questions about a repository you are new to, or you can offer GitChat
as an internal service to an organization so every engineer has a helpful chatbot to answer questions about
the organization's private repository.

## Features

The UI elements were derived from [Vercel's Next.js AI Chatbot Template](https://vercel.com/templates/next.js/nextjs-ai-chatbot)

It includes

- Google authentication with [Auth.js](https://next-auth.js.org/)
- User session management and chat history
- Chat sharing
- Dark/Light mode

## Installation

After cloning the repository, first create a `.env.local` file in the root directory and populate the variable values with your own.

```bash
cp .env.example .env.local
```

run the following commands to install the dependencies and start the server.

```bash
npm install
npm run dev
```
