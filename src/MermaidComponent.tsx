import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// 初始化mermaid配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  logLevel: 'error',
});

interface MermaidProps {
  content: string;
}

const MermaidComponent: React.FC<MermaidProps> = ({ content }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 生成唯一ID，确保在重新渲染时ID不变
  const id = useRef(`mermaid-${Math.random().toString(36).substring(2, 11)}`).current;
  
  // 处理mindmap格式
  const formatMindmapContent = (content: string) => {
    // 如果已经是正确格式，直接返回
    if (content.trim().startsWith('mindmap\n')) {
      return content;
    }
    
    // 将内容按行分割
    const lines = content.trim().split('\n');
    
    // 确保第一行只有"mindmap"
    if (lines[0].trim() !== 'mindmap') {
      // 如果第一行包含"mindmap"和其他内容，拆分成两行
      if (lines[0].trim().startsWith('mindmap')) {
        const parts = lines[0].trim().split(/\s+/);
        // 提取"mindmap"后的内容
        if (parts.length > 1) {
          const restContent = parts.slice(1).join(' ');
          // 替换第一行，并在第二行插入其余内容
          lines[0] = 'mindmap';
          lines.splice(1, 0, restContent);
        } else {
          lines[0] = 'mindmap';
        }
      } else {
        // 如果第一行不包含"mindmap"，添加一行
        lines.unshift('mindmap');
      }
    }
    
    return lines.join('\n');
  };
  
  useEffect(() => {
    if (!mermaidRef.current) return;
    
    try {
      // 清除之前的内容和错误
      setError(null);
      mermaidRef.current.innerHTML = '';
      
      // 预处理内容
      let processedContent = content.trim();
      
      // 如果是含有"mindmap"关键字的内容
      if (processedContent.includes('mindmap')) {
        // 特别处理嵌套结构不正确的情况
        const regex = /^mindmap\s+root\(\((.*?)\)\)/;
        if (regex.test(processedContent)) {
          // 将格式重写为正确的mindmap格式
          // 提取第一行中的root节点标题
          const match = processedContent.match(regex);
          if (match && match[1]) {
            const rootTitle = match[1];
            // 移除第一行，重新构建正确的格式
            const restLines = processedContent.split('\n').slice(1);
            processedContent = `mindmap\n  root((${rootTitle}))\n${restLines.map(line => `  ${line}`).join('\n')}`;
          }
        } else {
          // 使用一般格式化方法
          processedContent = formatMindmapContent(processedContent);
        }
      }
      
      // 调试信息
      console.log('处理后的Mermaid内容:', processedContent);
      
      // 渲染图表
      mermaid.render(id, processedContent)
        .then(result => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = result.svg;
          }
        })
        .catch(err => {
          console.error('Mermaid渲染错误:', err);
          setError(`渲染错误: ${err.message || '未知错误'}`);
          
          // 显示格式错误的提示
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `
              <div style="color: red; margin-bottom: 10px;">思维导图格式错误</div>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; color: #333; white-space: pre-wrap; font-size: 12px;">${processedContent}</pre>
            `;
          }
        });
    } catch (error: any) {
      console.error('Mermaid处理错误:', error);
      setError(`处理错误: ${error.message || '未知错误'}`);
      
      // 显示错误信息
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '<div style="color: red;">思维导图格式错误，请检查语法</div>';
      }
    }
  }, [content, id]);

  return (
    <div>
      <div ref={mermaidRef} className="mermaid-diagram"></div>
      {error && <div style={{ color: 'red', marginTop: '10px', whiteSpace: 'pre-wrap' }}>{error}</div>}
    </div>
  );
};

export default MermaidComponent; 