import React, {useState, useRef, useEffect, KeyboardEvent, JSX} from "react";
import TextareaAutosize from '@mui/material/TextareaAutosize';
import apiRequest from "./request";
const PUBLIC_URL = process.env.PUBLIC_URL || (process.env.NODE_ENV === 'production' ? '' : '');
const getPublicPath = (path: string) => {
  // 移除路径开头的斜杠
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // 如果 PUBLIC_URL 为空（生产环境），直接返回相对路径（不带 ./）
  if (!PUBLIC_URL) {
    return cleanPath;
  }
  // 否则拼接 PUBLIC_URL
  const base = PUBLIC_URL.endsWith('/') ? PUBLIC_URL.slice(0, -1) : PUBLIC_URL;
  return `${base}/${cleanPath}`;
};
interface GuessAskPostResponse {
    queries_list: string[];
}
// @ts-ignore
const DebouncedTextarea = ({ isLoading,onEnter, delay = 500,sharedState, ...props }) => {
    const [value, setValue] = useState("");
    const timeoutRef = useRef(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [hasMultipleLines, setHasMultipleLines] = useState(false);
    const [isEnterKeyPressed, setIsEnterKeyPressed] = useState(false);
    
    // 500ms 无输入时打印 "没有输入"
    const handleChange = (e: { target: { value: any; }; }) => {
        const newValue = e.target.value;
        setValue(newValue);

        // 清除之前的定时器
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // 设置新的定时器，500ms 后检查是否无输入
        // @ts-ignore
        timeoutRef.current = setTimeout(() => {
            fetchGuessAskList(e.target.value);
            console.log("500ms 没有输入");

        }, delay);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 阻止默认换行行为
            setIsEnterKeyPressed(true);
        }
    };

    const handleKeyUp = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && isEnterKeyPressed) {
            setIsEnterKeyPressed(false);
            submit();
        }
    };

    const submit =()=> {
        if (onEnter && value && !isLoading) {
            onEnter(value); // 传递给父组件
            setValue('');
            fetchGuessAskList('')
        }
    }


    const [bottomScrollData, setBottomScrollList] = useState<JSX.Element | null>(null);
    const fetchGuessAskList = async (value:string  ) => {
        let displayedQueries:string[]
        if (!value) {
            displayedQueries = []
            setBottomScrollList(<ul></ul>)
            apiRequest.cancelBottomPost() // 中断之前请求
            return
        }
        const response = await apiRequest.guessAskPost({
            project_id: window.config.project_id,
            "amount": 4,
            "keywords": value
        }) as GuessAskPostResponse;

        displayedQueries = response.queries_list;

        const chatBottomScrollListArr = displayedQueries.map((child:string,index:number)=>
            <li key={index}
                className='truncate'
                title={child}
                style={{borderBottom: index === displayedQueries.length - 1 ? '' : '1px solid #EEEEEE'}}
                onClick={() => handleChange({ target: { value: child } })}>{child}</li>
        )

        setBottomScrollList(<ul>{chatBottomScrollListArr}</ul>);
    };
    useEffect(() => {
       handleChange({ target: { value: sharedState } })
    }, [sharedState]);
    // 组件卸载时清除定时器（避免内存泄漏）
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // 检测行数变化
    useEffect(() => {
        const calculateLines = () => {
            if (textareaRef.current) {
                const lineHeight = 12;
                const padding =
                    parseInt(getComputedStyle(textareaRef.current).paddingTop) +
                    parseInt(getComputedStyle(textareaRef.current).paddingBottom);
                const scrollHeight = textareaRef.current.scrollHeight - padding;
                const lines = Math.round(scrollHeight / lineHeight);
                setHasMultipleLines(lines > 2); // 超过2行时触发
            }
        };

        calculateLines();
    }, [value]);

    return (

    <div className="chatBottomFix">
        <div className="chatBottomGuessAsk">
            <div className="scroll">
                {bottomScrollData}
            </div>
        </div>
        <div className='chatBottomEnter'>
            <div className="chatBottomLeft">
                <TextareaAutosize
                    ref={textareaRef}
                    maxRows={3}
                    aria-label="maximum height"
                    placeholder="请输入，按Enter直接发送消息，Shift+Enter换行"
                    value={value}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    className={`dynamic-radius-textarea ${hasMultipleLines ? 'multiline' : ''}`}
                    onChange={handleChange}
                    {...props}
                />
            </div>
            <img onClick={submit} className='chatBottomRight' src={getPublicPath('icons/chatBottomSIcon.png')} alt=""/>
        </div>
    </div>
    );
};

export default DebouncedTextarea;