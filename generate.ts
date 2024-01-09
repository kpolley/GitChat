const GithubRepoLoader =
  require('langchain/document_loaders/web/github').GithubRepoLoader

const VercelPostgres =
  require('langchain/vectorstores/vercel_postgres').VercelPostgres
const OpenAIEmbeddings = require('@langchain/openai').OpenAIEmbeddings

const SupportedTextSplitterLanguages =
  require('langchain/text_splitter').SupportedTextSplitterLanguages
const RecursiveCharacterTextSplitter =
  require('langchain/text_splitter').RecursiveCharacterTextSplitter

const kv = require('@vercel/kv').kv

require('dotenv').config({ path: './.env.local' })

const EMBEDDING_MODEL = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY
})

// create a map of RecursiveCharacterTextSplitters for each supported language
const SPLITTERS = SupportedTextSplitterLanguages.map((language: any) => {
  return {
    language,
    splitter: RecursiveCharacterTextSplitter.fromLanguage(language)
  }
})

const DEFAULT_SPLITTER = new RecursiveCharacterTextSplitter()

// Define a type for the language map
type LanguageMap = {
  [key: string]: string[] // Index signature
}

// Define the languageMap with the type
const languageMap: LanguageMap = {
  cpp: ['cpp', 'h'],
  go: ['go'],
  java: ['java'],
  js: ['js', 'ts', 'jsx', 'tsx'],
  php: ['php'],
  proto: ['proto'],
  python: ['py'],
  rst: ['rst'],
  ruby: ['rb'],
  rust: ['rs'],
  scala: ['scala'],
  swift: ['swift'],
  markdown: ['md', 'README'],
  latex: ['tex'],
  html: ['html'],
  sol: ['sol']
}

async function generate() {
  // get current git commit hash from kv
  const commitHash = await kv.get('git-commit')

  // get latest git commit hash from github api
  const latestCommitHash = await fetch(
    `https://api.github.com/repos/${process.env.NEXT_PUBLIC_GITHUB_REPO}/commits`
  ).then(async res => {
    const json = await res.json()
    return json[0].sha
  })

  console.log(`current commit hash: ${commitHash}`)
  console.log(`latest commit hash: ${latestCommitHash}`)

  // if there are no changes, do nothing
  if (commitHash === latestCommitHash) {
    console.log('no changes')
    return new Response('ok', {
      status: 200
    })
  }

  console.log('changes detected')

  const vectorStore = await VercelPostgres.initialize(EMBEDDING_MODEL)

  const loader = new GithubRepoLoader(
    `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO}`,
    {
      branch: process.env.GIT_BRANCH_NAME || 'main',
      accessToken: process.env.GITHUB_ACCESS_TOKEN,
      recursive: true,
      unknown: 'warn'
    }
  )
  const docs = await loader.load()

  console.log(`loaded ${docs.length} documents`)

  // iterate through the documents as async

  let counter = 0
  for (let doc of docs) {
    const extension = doc.metadata['source'].split('.').pop()

    // Find the language whose extensions array includes this extension
    const language = Object.keys(languageMap).find((key: string) =>
      languageMap[key as keyof typeof languageMap].includes(extension)
    )

    if (language) {
      // If a language is found, proceed with splitting
      const splitterObject = SPLITTERS.find(
        (s: { language: string }) => s.language === language
      )

      if (splitterObject) {
        // split the document using the correct splitter
        const docChunks = await splitterObject.splitter.splitDocuments([doc])

        // add the chunks to the vector store
        await vectorStore.addDocuments(docChunks)
      }
    } else {
      // if not, we use the default splitter
      const docChunks = await DEFAULT_SPLITTER.splitDocuments([doc])

      await vectorStore.addDocuments(docChunks)
    }

    counter += 1
    if (counter % 10 === 0) {
      console.log(`processed ${counter} documents`)
    }
  }

  // update the git commit hash in kv
  await kv.set('git-commit', latestCommitHash)

  return 'ok'
}

generate()
