import { Message as VercelChatMessage, StreamingTextResponse } from 'ai'
import { Run } from 'langchain/callbacks'
import { kv } from '@vercel/kv'

import { HttpResponseOutputParser } from 'langchain/output_parsers'
import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

import { ChatOpenAI } from '@langchain/openai'
import { OpenAIEmbeddings } from '@langchain/openai'

import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from '@langchain/core/prompts'
import { formatDocumentsAsString } from 'langchain/util/document'

import { VercelPostgres } from 'langchain/vectorstores/vercel_postgres'

import { RunnableSequence } from '@langchain/core/runnables'

export const maxDuration = 300

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`
}

const SYSTEM_TEMPLATE = `You are a knowledgeable and friendly chatbot specialized in answering questions related to the git repository located at {github_url}. Utilize the provided context and previous message history to inform your responses. If the answer to a question is not within your knowledge base or irrelevant to the provided context, simply state that you don't know or engage in a friendly conversation related to the topic. When relevant, include snippets from the context file to support your answers, and clearly cite these snippets as your source.

PREVIOUS MESSAGE HISTORY:
{chat_history}
----------------
DOCUMENT CONTEXT:
{context}

QUESTION:
{question}
`

const PROMPT = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
  HumanMessagePromptTemplate.fromTemplate('{question}')
])

const MODEL = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4-1106-preview',
  maxTokens: 2048
})

const EMBEDDING_MODEL = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY
})

const VECTOR_STORE = VercelPostgres.initialize(EMBEDDING_MODEL)

const saveMessageListener = async (
  run: Run,
  message_id: string,
  userId: string,
  messages: any[]
) => {
  if (run.outputs) {
    // create payload
    const createdAt = Date.now()
    const payload = {
      id: message_id,
      title: messages[0].content.substring(0, 100),
      userId,
      createdAt,
      path: `/chat/${message_id}`,
      messages: [
        ...messages,
        {
          content: run.outputs.content,
          role: 'assistant'
        }
      ]
    }

    // save payload to KV
    const output = await kv.hmset(`chat:${message_id}`, payload).then(() => {
      kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${message_id}`
      }).then(() => {
        console.log(`Successfully saved chat message ${message_id}`)
    })
    console.log(`output: ${JSON.stringify(output)}`)
  })
}

export async function POST(req: Request) {
  // get message history and current message
  const body = await req.json()
  const messages = body.messages ?? []
  const message_id = body.id ?? nanoid()
  const formattedPreviousMessages = messages.slice(-5).map(formatMessage)
  const currentMessageContent = messages[messages.length - 1].content

  // get user id
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  // initialize document retriever
  const retriever = (await VECTOR_STORE).asRetriever()

  const chain = RunnableSequence.from([
    {
      question: (input: { question: string }) => {
        return input.question
      },
      context: async (input: { question: string }) => {
        const relevantDocs = await retriever.getRelevantDocuments(
          input.question
        )

        const serialized = formatDocumentsAsString(relevantDocs)
        return serialized
      },
      chat_history: () => {
        return formattedPreviousMessages.join('\n')
      },
      github_url: () => {
        return 'https://github.com/sublime-security/sublime-rules'
      }
    },
    PROMPT,
    MODEL
  ]).withListeners({
    onEnd: (run: Run) => {
      saveMessageListener(run, message_id, userId, messages)
    }
  })

  const stream = await chain.pipe(new HttpResponseOutputParser()).stream({
    question: currentMessageContent
  })

  return new StreamingTextResponse(stream)
}
