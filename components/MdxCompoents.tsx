"use client";

import ReactMarkdown from 'react-markdown'

import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'; // To handle line breaks

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

import { Button } from "./ui/button";
import { useTheme } from 'next-themes';

export function Mdx({ source }: { source: string }) {

    const { theme, resolvedTheme } = useTheme();

    // 延迟渲染，直到 theme 确定
    if (!theme && !resolvedTheme) {
        return null; // 或者加载指示器
    }

    return (
        <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
                code: ({ children = [], className, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return (<SyntaxHighlighter
                            language={match?.[1]}
                            showLineNumbers={true}
                            style={ theme == "dark" ? (oneDark as any) : (oneLight as any) }
                            PreTag='div'
                            className='syntax-hight-wrapper'
                          >
                            {children as string[]}
                          </SyntaxHighlighter>)
                },
                h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold" {...props} />
                ),
                h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-semibold" {...props} />
                ),
                h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-medium" {...props} />
                ),
                h4: ({ node, ...props }) => (
                    <h4 className="text-lg font-medium" {...props} />
                ),
                h5: ({ node, ...props }) => (
                    <h5 className="text-base font-normal" {...props} />
                ),
                a: ({ node, href, ...props }) => (
                    <a 
                        href={href} 
                        className="text-orange-500 underline hover:text-orange-700 transition-colors" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        {...props}
                    />
                ),
            }}
            skipHtml={false}
        >{ source.replace(/<br\s*\/?>/g, "\n") }</ReactMarkdown>
    )
}