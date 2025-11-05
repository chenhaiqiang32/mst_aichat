import React, { useState, useEffect,JSX } from 'react';
import apiRequest from "./request";
import Skeleton from '@mui/material/Skeleton';
// 动态获取基础路径，支持子路径部署
const getPublicPath = (path: string) => {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    let basePath = pathname.replace(/\/[^/]*\.html?$/, '').replace(/\/$/, '');
    const base = basePath ? `${basePath}/` : './';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${cleanPath}`;
  }
  
  const buildTimeBase = process.env.PUBLIC_URL || './';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${buildTimeBase}${cleanPath}`;
};
interface GuessAskPostResponse {
    queries_list:string[];
}

interface GuessAskListProps {
    projectId?: string;  // 可选的projectId参数
    itemCount?: number;  // 可选的显示数量
    onStateChange?: (value: string) => void;
}
const GuessAskListComponent: React.FC<GuessAskListProps> = ({
                                                       projectId = "001",
                                                       itemCount = 4,
                                                       onStateChange
                                                   }) => {
    const [guessAskListData, setGuessAskList] = useState<JSX.Element | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGuessAskList = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiRequest.guessAskPost({
                project_id: projectId,
                "amount": 4
            }) as GuessAskPostResponse;

            const displayedQueries = response.queries_list;

            const listItems = displayedQueries.map((query, index) => (
                <li key={index} className="guess-ask-item"  onClick={(e) => onStateChange && onStateChange(query)}>
                    <div className='guessAskListContent truncate' title={query} >
                        {query}
                    </div>
                    <img src={getPublicPath('icons/chatListIcon.png')} alt="chat icon" className="chat-icon" />
                </li>
            ));

            setGuessAskList(<ul className="guess-ask-list">{listItems}</ul>);

            // 调用刷新回调（如果存在）
        } catch (err) {
            console.error("Failed to fetch guess ask list:", err);
            setError("接口请求失败，请重试！");
            setGuessAskList(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 初始化时获取数据
    useEffect(() => {
        fetchGuessAskList();
    }, [projectId, itemCount]); // 当projectId或itemCount变化时重新获取

    const handleRefreshClick = () => {
        fetchGuessAskList();
    };

    return (
        <div className="guessAsk">
            <div className="guessAskTop">
                <div className="guessAskLeft">
                    <img src={getPublicPath('icons/chatAnswerIcon.png')} alt="" />
                    <div className="name enableSelect">猜你想问</div>
                </div>
                {!isLoading && <div className="guessAskRight" >
                    <div className="name" onClick={handleRefreshClick}>{'换一换'}</div>
                    <img src={getPublicPath('icons/chatReset.png')} alt="" />
                </div>}

            </div>

            {error && <div className="error-message"><img src={getPublicPath('icons/chatAnswerIcon.png')} alt="" /><span>{error}</span></div>}

            {isLoading ? (
                <div className="guessAskList">
                    <ul className="guess-ask-list">
                        <li className="guess-ask-item">
                            <Skeleton
                                style={{
                                width: "calc(100% - 20px)", // 使用 CSS calc()
                                height: 37,
                            }} />
                        </li>
                        <li className="guess-ask-item">
                            <Skeleton
                                style={{
                                width: "calc(100% - 20px)", // 使用 CSS calc()
                                height: 37,
                            }} />
                        </li>
                        <li className="guess-ask-item">
                            <Skeleton
                                style={{
                                width: "calc(100% - 20px)", // 使用 CSS calc()
                                height: 37,
                            }} />
                        </li>
                        <li className="guess-ask-item">
                            <Skeleton
                                style={{
                                width: "calc(100% - 20px)", // 使用 CSS calc()
                                height: 37,
                            }} />
                        </li>
                    </ul>
                </div>
            ) : (
                <div className="guessAskList">
                    {guessAskListData}
                </div>
            )}
        </div>
    );
};

export default GuessAskListComponent;