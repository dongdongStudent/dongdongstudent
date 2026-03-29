import axios from 'axios';

// 创建axios实例
const request = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://www.ddstudent.xyz/server/english',
  timeout: 10000
});

// 请求拦截器 - 添加token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * 七选五题型API
 * 基础路径: /api/cloze
 */
export const clozeApi = {
  /**
   * 获取题库列表
   * GET /api/cloze/banks
   */
  getBanks: () => {
    console.log('【API】调用 getBanks');
    return request({
      url: '/cloze_sentence/banks',
      method: 'get'
    }).catch(error => {
      console.error('获取题库列表失败:', error);
      return { flag: 0, message: '获取题库列表失败', content: { banks: [] } };
    });
  },

  /**
   * 获取题目
   * GET /api/cloze/questions
   * @param {object} params - 参数对象
   * @param {string} params.type - 抽取类型: random, weak, new, all
   * @param {string} params.bank - 题库ID: middle, high
   * @param {number} params.count - 抽取数量
   * @param {string} params.category - 分类过滤
   */
  getQuestions: ({ type = 'random', bank = 'middle', count = 1, category } = {}) => {
    const params = { type, bank, count };
    if (category && category !== 'all') params.category = category;
    
    console.log('【API】调用 getQuestions:', params);
    
    return request({
      url: '/cloze_sentence/questions',
      method: 'get',
      params
    }).catch(error => {
      console.error('获取题目失败:', error);
      return { 
        flag: 0, 
        message: '获取题目失败',
        content: { questions: [], total: 0 }
      };
    });
  },

  /**
   * 提交答案
   * POST /api/cloze/submit
   * @param {object} data - 提交数据
   * @param {string[]} data.questionIds - 题目ID数组
   * @param {object[]} data.answers - 答案数组，每个答案是一个对象 { blank1: 'A', blank2: 'B', ... }
   * @param {number} data.timeSpent - 用时（秒）
   * @param {string} data.bank - 题库ID
   */
  submitAnswers: ({ questionIds, answers, timeSpent, bank = 'middle' }) => {
    console.log('【API】调用 submitAnswers:', { questionIds, answers, timeSpent, bank });
    
    return request({
      url: '/cloze_sentence/submit',
      method: 'post',
      data: { questionIds, answers, timeSpent, bank }
    }).catch(error => {
      console.error('提交答案失败:', error);
      return { 
        flag: 0, 
        message: '提交失败',
        content: null
      };
    });
  },

  /**
   * 获取题目详情（带解析）
   * GET /api/cloze/questions/:questionId/details
   * @param {string} questionId - 题目ID
   * @param {string} bank - 题库ID
   */
  getQuestionDetails: (questionId, bank = 'middle') => {
    console.log('【API】调用 getQuestionDetails:', { questionId, bank });
    
    return request({
      url: `/cloze_sentence/questions/${questionId}/details`,
      method: 'get',
      params: { bank }
    }).catch(error => {
      console.error('获取题目详情失败:', error);
      return { 
        flag: 0, 
        message: '获取详情失败',
        content: { question: null }
      };
    });
  },

  /**
   * 获取学习报告
   * GET /api/cloze/report
   * @param {string} bank - 题库ID
   */
  getReport: (bank = 'middle') => {
    console.log('【API】调用 getReport:', { bank });
    
    return request({
      url: '/cloze_sentence/report',
      method: 'get',
      params: { bank }
    }).catch(error => {
      console.error('获取学习报告失败:', error);
      return { 
        flag: 0, 
        message: '获取报告失败',
        content: { metadata: {}, questions: {} }
      };
    });
  }
};

export default clozeApi;