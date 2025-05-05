import axios,{ AxiosError } from 'axios';
// @ts-ignore
axios.defaults.baseURL = window.configs.baseURL + '/api';
let abortController: AbortController | null = null;
const guessAskPost = async (requestObj: Object) => {
    return await commonPostRequest('/recommend/query_by_website_content',requestObj,null)
}
const cancelBottomPost= ()=>{
    if (abortController) {
        abortController.abort('取消之前的请求，只保留最后一次');
    }
}
const bottomScrollPost=async (requestObj:any)=>{
    // 取消之前的请求
    cancelBottomPost() // 中断底部请求
    // 创建新的 AbortController
    abortController = new AbortController();
    return await commonPostRequest('/recommend/query_by_user_input',requestObj,{
        signal: abortController.signal, // 绑定取消信号
    })
}
const commonPostRequest = async (url:string,postData:object,single:Object|null  ) => {
    return new Promise((resolve,reject)=>{
        axios.post(url, postData,single?single: {},)
            .then(function (response) {
                if (response && response.status === 200) {
                    resolve(response.data);
                } else {
                    reject(response);
                }
            })
            .catch(function (error) {
                if (axios.isCancel(error)) {
                    console.log('请求已取消（预期行为）:', error.message);
                    return null; // 或者返回特定标记
                }
                // 处理真实错误
                const axiosError = error as AxiosError;
                console.error('请求出错:', axiosError.message);
                reject(axiosError);
            });
    })
}

export default {guessAskPost,bottomScrollPost,cancelBottomPost}