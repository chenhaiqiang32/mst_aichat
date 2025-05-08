import React from 'react';
import MermaidComponent from './MermaidComponent';

// Custom components for markdown rendering
export const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  
  // 检测是否是mermaid代码块
  if (!inline && match && match[1] === 'mermaid') {
    const content = String(children).replace(/\n$/, '');
    return <MermaidComponent content={content} />;
  }
  
  // 普通代码块的渲染
  return !inline && match ? (
    <pre className={className} {...props}>
      <code className={`language-${match[1]}`}>{children}</code>
    </pre>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export const Img: React.FC<any> = (props) => {
  return <img {...props} className="markdown-image" style={{ maxWidth: '100%' }} alt={props.alt || ''} />;
};

export const VideoBlock: React.FC<any> = (props) => {
  return <video controls {...props} style={{ maxWidth: '100%' }} />;
};

export const AudioBlock: React.FC<any> = (props) => {
  return <audio controls {...props} />;
};

export const Link: React.FC<any> = ({ node, children, ...props }) => {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
};

export const Paragraph: React.FC<any> = ({ children, ...props }) => {
  return <p {...props}>{children}</p>;
};

export const MarkdownButton: React.FC<any> = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};

export const MarkdownForm: React.FC<any> = ({ children, ...props }) => {
  return <form {...props}>{children}</form>;
};

export const ScriptBlock: React.FC<any> = () => {
  return null; // For security, we don't render script tags
};

export const ThinkBlock: React.FC<any> = ({ children, ...props }) => {
  return <details {...props}>{children}</details>;
};