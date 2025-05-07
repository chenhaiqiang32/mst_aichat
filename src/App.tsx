import * as React from 'react';
import {useState,useCallback, useEffect, useRef, JSX} from 'react';
import GuessAskListComponent from './GuessAskList';
import DebouncedTextarea from "./DebouncedTextarea";
import { fetchEventSource,EventStreamContentType } from '@fortaine/fetch-event-source';
import './app.css'
import { Message, ChatCompletionParams } from './types';
import apiRequest from "./request";
const isClient = typeof window !== 'undefined'
const isIframe = isClient ? window.self !== window.top : false
let lastTime = ''
function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
function getResponseData(remainText: string) {
    if (remainText.length > 0) {
        const fetchCount = Math.max(1, Math.round(remainText.length / 60));
        const fetchText = remainText.slice(0, fetchCount);
        const newRemainText = remainText.slice(fetchCount);
        return {
            responseText: fetchText,  // 当前批次的文本
            remainText: newRemainText,  // 剩余的文本
            next: () => getResponseData(newRemainText)  // 获取下一批次的函数
        };
    }
    return null;  // 当没有剩余文本时返回null
}
const getTime:()=>string = () => {
    let timeData: string = getCurrentTime(); // 气泡时间参数
    return timeData;
}


export default function TodoList() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [iframeData, setIframeData] = useState({titleName: 'dewrew',chatName: '小T',projectId:'001'});
    const [parentOrigin, setParentOrigin] = useState('')
    const [showToggleExpandButton, setShowToggleExpandButton] = useState(false)
    const [sharedState, setSharedState] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const relatedIssues = (relatedLists: any[] | undefined)=>{ // 关联问题列表
        if(!relatedLists || relatedLists.length === 0){
            setMessages((prev) => {
                return [
                    ...prev,
                    { role: 'reference', content: <ul></ul> }
                ];
            });
            return;
        }
        const handleClick = (url:string) => {
            window.open(url, '_blank', 'noopener,noreferrer');
        };
        const relatedListsArr = relatedLists && relatedLists.map((child,index)=>
            <li onClick={() => handleClick(child.url)} key={index} className={index === relatedLists.length -1 ? "":'line'}><div className='relatedListContent'><div className="title truncate" title={child.title}>{child.title}</div><div className="content truncate" title={child.content}>{child.content}</div></div><div><img src='/icons/chatListIcon.png' alt="" /></div> </li>
        );
        setMessages((prev) => {
            return [
                ...prev,
                { role: 'reference', content: <ul>{relatedListsArr}</ul> }
            ];
        });
    }

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleMessageReceived = useCallback((event: MessageEvent) => {
        let currentParentOrigin = parentOrigin
        if (!currentParentOrigin && event.data.type === 'chatbot-config') {
            currentParentOrigin = event.origin
            setParentOrigin(event.origin)
        }
        if (event.origin !== currentParentOrigin)
            return
        if (event.data.type === 'chatbot-config') {
            setIframeToDom(event.data.postData)
        }
           
    }, [parentOrigin])

    const setIframeToDom = (postData: { titleName: string; chatName: string; projectId: string; apiUrl:string}) => {
        setIframeData(postData);
        (window as any).config = {
            project_id: postData.projectId || '001',
            baseURL: postData.apiUrl || "https://ragsite.teamhelper.cn/api",    
        };
        apiRequest.setDefaultUrl() // 设置默认接口请求地址
        setShowToggleExpandButton(true) // 渲染dom
    }

    useEffect(() => {
        if (!isIframe) return
        const listener = (event: MessageEvent) => handleMessageReceived(event)
        window.addEventListener('message', listener)

        window.parent.postMessage({ type: 'chatbot-iframe-ready' }, '*')

        return () => window.removeEventListener('message', listener)
    }, [isIframe, handleMessageReceived])
    useEffect(() => {
        let timeData: string = getCurrentTime(); // 气泡时间参数
        lastTime = timeData;
        setCurrentTime(lastTime)
        return ()=>{lastTime}
    }, [])
    useEffect(() => {
        if (!isIframe) return
        const urlParams = new URLSearchParams(window.location.search);
        const apiUrl = urlParams.get("apiUrl");
        const titleName = urlParams.get("titleName");
        const chatName = urlParams.get("chatName");
        const projectId = urlParams.get("projectId");
        setIframeToDom(
            {
              chatName: chatName || "小T", // 默认小T
              titleName: titleName || "智能助理", // 标题名称
              projectId: projectId || "001",
              apiUrl: apiUrl || "https://ragsite.teamhelper.cn/api",
            }
        )
    }, [])
    // 滚动到最新消息
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleEnter = async (text: string) => {
        const userMessage: Message = {
            role: 'user',
            content: text,
        };
        let currentTime = getTime();
        if (currentTime !== lastTime) { // 时间变了
            const timeMessage: Message = {
                role: 'time',
                content: currentTime,
            };
            lastTime = currentTime;
            setMessages((prev) => [...prev, timeMessage]);
        }
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        // 准备请求参数
        let postMessage = messages.filter(item => item.role !== 'reference');
        const requestParams: ChatCompletionParams = {
            messages: [...postMessage, userMessage], // 包含历史消息和新用户消息
            project_id:  window.config.project_id
        };

        let assistantMessage = '';

        try {
            // @ts-ignore
            await fetchEventSource(window.config.baseURL + '/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestParams),
                onopen: async (response) => {
                    if (response.ok) {
                        return;
                    }
                    throw new Error('Failed to connect');
                },
                onmessage: (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if(data.reference) {
                            relatedIssues(data.reference)
                            setIsLoading(false);
                            return;
                        }
                        // 更新最后一条消息（AI的回复）
                        if (data.answer.length > 0) {
                            let result = getResponseData(data.answer);
                            while (result) {
                                assistantMessage =assistantMessage + result.responseText;
                                console.log(result.responseText);
                                result = result.next();  // 获取下一批次
                                setMessages((prev) => {
                                    const lastMessage = prev[prev.length - 1];
                                    if (lastMessage?.role === 'assistant') {
                                        return [
                                            ...prev.slice(0, -1),
                                            { ...lastMessage, content: assistantMessage }
                                        ];
                                    } else {
                                        return [
                                            ...prev,
                                            { role: 'assistant', content: assistantMessage }
                                        ];
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Error parsing event data:', error);
                    }
                },
                onerror: (error) => {
                    setIsLoading(false);
                    throw error;
                },
                openWhenHidden: true, // 即使页面隐藏也保持连接
            });
        } catch (error) {
            setIsLoading(false);
            console.error('Request error:', error);
        }
        // 提交逻辑...
    };
    // @ts-ignore
    if (showToggleExpandButton) {
        return (
            <div className='chatBg'>
                <div className='chatBgNei'>
                    <div className="chatTopFix">
                        <div className="chatTopFixTitle">
                            <div className="chatTopLeft enableSelect">{ iframeData.titleName}</div>
                            {/*<div className="chatTopRight"><img src='/icons/chatClose.png' alt=""/></div>*/}
                        </div>
                        <div className='line'></div>
                    </div>
                    <div className='mainScroll'>
                        <div className='time enableSelect'>{currentTime}</div>
                        <div className='chatT'>
                            <img className="chatTImg" src='/icons/chatTIcon.png' alt="" />
                            <div className='chatTTitle enableSelect'>{ iframeData.chatName}</div>
                            <div className='chatTContent enableSelect'>您好，我是您的{ iframeData.titleName}，很高兴为您服务，您可以直接发送产品和问题向我提问~</div>
                        </div>
                        <GuessAskListComponent projectId={window.config.project_id}
                            itemCount={4}
                            onStateChange={
                                setSharedState
                            } 
                        ></GuessAskListComponent>
                        {messages.map((message: Message, index: number) => {
                            if (message.role === 'time') {
                                return (
                                    <div className='time enableSelect' style={{margin:'16px auto'}}>{message.content}</div>
                                )
                            }
                            if (message.role === 'user') {
                                return (
                                    <div>
                                        <div className='askAi' key={`user-${index}`}>
                                        <div className='askAiTitle enableSelect'>我</div>
                                        <div className='askAiContent'>{message.content}</div>
                                        <img className='askAiIcon enableSelect' src="/icons/chatPerson.png" alt="" />
                                    </div>
                                    </div>
                                )
                            }
                            if (message.role === 'assistant') {
                                return (
                                    <div className='chatT' key={`assistant-${index}`}>
                                        <img className="chatTImg enableSelect no-drag" src='/icons/chatTIcon.png' alt="" />
                                        <div className='chatTTitle enableSelect'>{iframeData.chatName}</div>
                                        <div className='chatTContent'>{message.content}</div>
                                    </div>
                                )
                            }
                            if (message.role === 'reference') {
                                return (
                                    <div className='relatedList' key={`reference-${index}`}>
                                        {message.content}
                                    </div>
                                )
                            }
                        })}
                        {isLoading && (
                            <div className="message">
                                <div className="content">AI Thinking...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <DebouncedTextarea isLoading={isLoading} onEnter={handleEnter} delay={500} sharedState={sharedState}  ></DebouncedTextarea>
                </div>
            </div>
        );
    } else {
        return (
            <div></div>
        )
    }
}

