
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote-client/rsc";
import { Button } from "./ui/button";
import { Suspense } from "react";

import { transformerCopyButton } from "@rehype-pretty/transformers";
import { rehypePrettyCode } from "rehype-pretty-code";

import { visit } from 'unist-util-visit';

function customCopyButtonTransformer() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (
        node.tagName === 'button' &&
        node.properties &&
        node.properties.className.includes('rehype-pretty-code-copy-button')
      ) {
        // 修复 onClick
        node.properties.onClick = () => {
          const code = node.parent.children
            .find((child: any) => child.tagName === 'code')
            .children.map((textNode: any) => textNode.value)
            .join('\n');
          navigator.clipboard.writeText(code).then(() => {
            console.log('Copied to clipboard');
          });
        };
      }
    });
  };
}

/** @type {import('rehype-pretty-code').Options} */
const options = {
    // Use one of Shiki's packaged themes
    // https://shiki.style/themes#themes
    theme: "one-dark-pro",
    // Keep the background or use a custom background color?
    grid: true,
    keepBackground: true,
    bypassInlineCode: true,
    defaultLang: "plaintext",
};

const Mdx = (props: MDXRemoteProps) => {
    return (
        <MDXRemote
            {...props}
            components={{
                h1: (props) => {
                    return <h1 className="text-2xl font-bold">{props.children}</h1>;
                },
                Button,
            }}
            options={{
                mdxOptions: {
                    remarkPlugins: [],
                    rehypePlugins: [[rehypePrettyCode, options]],
                    // format: "mdx"
                }
            }}
        />
    );
}

export default Mdx;