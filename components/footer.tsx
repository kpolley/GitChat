import React from 'react'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  const githubRepoUrl = `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO}`
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground',
        className
      )}
      {...props}
    >
      {/* <ExternalLink href={githubRepoUrl}>{githubRepoUrl}</ExternalLink> */}
      {/* <ExternalLink href="https://x.com/kplley">
        Find me on Twitter (kplley)
      </ExternalLink> */}
      {/* Open source AI chatbot built with{' '}
      <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{' '}
      <ExternalLink href="https://vercel.com/storage/kv">
        Vercel KV
      </ExternalLink>
      . */}
    </p>
  )
}
