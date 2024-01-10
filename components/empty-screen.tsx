import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Summarize the README file',
    message: `Please summarize the README file.`
  },
  {
    heading: 'Ask about specific detections',
    message: 'How does the malicious QR code scanner detection work? \n'
  },
  {
    heading: 'Learn about threat techniques',
    message: `How does an attacker smuggle an attachment? \n`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  const githubRepoUrl = `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO}`
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">Welcome to GitChat!</h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          GitChat is a chatbot to chat with a Git repository. For this POC
          version, this chatbot has access to the Git repository{' '}
          <ExternalLink href={githubRepoUrl}>{githubRepoUrl}</ExternalLink>.
        </p>
        <p className="leading-normal text-muted-foreground">
          You can start a conversation here or try the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
