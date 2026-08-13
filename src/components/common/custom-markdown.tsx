import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

interface CustomMarkdownProps {
  content: string;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='relative my-6 overflow-hidden rounded-xl bg-[#0d1117] border border-white/10 shadow-2xl'>
      <div className='flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/5'>
        <span className='text-[11px] font-mono uppercase tracking-widest text-white/50'>{language || "text"}</span>
        <button
          onClick={handleCopy}
          className='flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer'
          title='Copy code'
        >
          {copied ? <Check className='h-3.5 w-3.5 text-accent-cyan' /> : <Copy className='h-3.5 w-3.5' />}
          <span className='text-[10px] font-medium uppercase tracking-wider'>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className='text-[13px] overflow-x-auto'>
        <SyntaxHighlighter
          language={language || "text"}
          style={vscDarkPlus}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "2.25em",
            paddingRight: "1em",
            color: "rgba(255, 255, 255, 0.25)",
            textAlign: "right",
            userSelect: "none",
          }}
          customStyle={{
            margin: 0,
            padding: "1rem 1.25rem",
            background: "transparent",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
          PreTag='div'
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const CustomMarkdown = ({ content }: CustomMarkdownProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Typography
        p: ({ node, ...props }) => <p className='mb-4 last:mb-0 leading-relaxed text-[15px]' {...props} />,
        h1: ({ node, ...props }) => <h1 className='mt-8 mb-4 text-2xl font-semibold text-white tracking-tight' {...props} />,
        h2: ({ node, ...props }) => <h2 className='mt-6 mb-3 text-xl font-medium text-white tracking-tight' {...props} />,
        h3: ({ node, ...props }) => <h3 className='mt-5 mb-2 text-lg font-medium text-white/90' {...props} />,

        // Lists
        ul: ({ node, ...props }) => <ul className='mb-4 ml-5 space-y-1.5 list-disc marker:text-white/30' {...props} />,
        ol: ({ node, ...props }) => <ol className='mb-4 ml-5 space-y-1.5 list-decimal marker:text-white/30' {...props} />,
        li: ({ node, ...props }) => <li className='pl-1' {...props} />,

        // Inline formatting
        strong: ({ node, ...props }) => <strong className='font-semibold text-white' {...props} />,
        em: ({ node, ...props }) => <em className='italic text-white/80' {...props} />,
        a: ({ node, ...props }) => (
          <a
            className='font-medium text-accent-cyan hover:text-accent-cyan/80 underline underline-offset-4 decoration-accent-cyan/30 hover:decoration-accent-cyan/80 transition-all duration-200'
            target='_blank'
            rel='noopener noreferrer'
            {...props}
          />
        ),

        blockquote: ({ node, ...props }) => (
          <blockquote
            className='my-5 border-l-2 border-accent-cyan/50 bg-gradient-to-r from-accent-cyan/10 to-transparent py-3 pl-5 pr-4 italic text-white/70 rounded-r-xl'
            {...props}
          />
        ),

        // Code Handling (Checks if block or inline)
        code: ({ node, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "";
          const codeString = String(children).replace(/\n$/, "");

          // Render CodeBlock only if it has an explicit language or contains line breaks
          const isBlock = Boolean(match) || codeString.includes("\n");

          if (isBlock) {
            return <CodeBlock language={language} value={codeString} />;
          }

          // Minimal Inline Code
          return (
            <code
              className='px-1.5 py-0.5 mx-0.5 rounded bg-white/10 text-accent-cyan/90 text-[13px] font-mono whitespace-nowrap border border-white/5'
              {...props}
            >
              {children}
            </code>
          );
        },

        // Minimal Table Design
        table: ({ node, ...props }) => (
          <div className='my-6 w-full overflow-x-auto'>
            <table className='w-full text-left text-[14px] border-collapse' {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className='border-b border-white/20' {...props} />,
        tbody: ({ node, ...props }) => <tbody className='divide-y divide-white/5' {...props} />,
        tr: ({ node, ...props }) => <tr className='hover:bg-white/[0.02] transition-colors duration-150' {...props} />,
        th: ({ node, ...props }) => <th className='px-4 py-3 font-medium text-white/90 whitespace-nowrap text-[13px]' {...props} />,
        td: ({ node, ...props }) => <td className='px-4 py-3 text-white/70 leading-relaxed' {...props} />,

        hr: ({ node, ...props }) => <hr className='my-8 border-white/10' {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
