import ReactMarkdown from 'react-markdown'

import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'; // To handle line breaks

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

import { Button } from "./ui/button";

export function Mdx({ source }: { source: string }) {
    return (
        <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
                code: ({ children = [], className, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return (<SyntaxHighlighter
                            language={match?.[1]}
                            showLineNumbers={true}
                            style={oneDark as any}
                            PreTag='div'
                            className='syntax-hight-wrapper'
                          >
                            {children as string[]}
                          </SyntaxHighlighter>)
                }
            }}
            skipHtml={false}
        >{ source.replace(/<br\s*\/?>/g, "\n") }</ReactMarkdown>
    )
}