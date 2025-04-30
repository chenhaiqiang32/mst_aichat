import {JSX} from "react";

export interface Message {
    role: 'user' | 'assistant' | 'reference';
    content: string | JSX.Element;
}

export interface ChatCompletionParams {
    messages: Message[];
    project_id?: string;
    // 其他可能的参数
}