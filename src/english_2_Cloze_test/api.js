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
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 直接返回data
request.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export const clozeApi = {
  /**
   * 获取题库列表
   * 从服务器获取，如果没有返回空数组
   */
  getBanks: () => {
    return request({
      url: '/cloze/banks',
      method: 'get'
    }).catch(error => {
      console.error('获取题库列表失败:', error);
      return { flag: 0, message: '获取题库列表失败', content: { banks: [] } };
    });
  },

  /**
   * 获取完形填空文章
   * 从服务器获取，如果没有返回默认空文章
   * @param {string} type - 抽取类型: smart, new, random
   * @param {string} bank - 题库ID
   */
  getPassage: (type = 'smart', bank = 'default') => {
    return request({
      url: '/cloze/passage',
      method: 'get',
      params: { type, bank }
    }).catch(error => {
      console.error('获取文章失败:', error);
      return { 
        flag: 0, 
        message: '获取文章失败，请检查服务器连接', 
        content: { 
          passage: null,
          stats: { totalPassages: 0, attemptedPassages: 0, totalQuestions: 0 }
        } 
      };
    });
  },

  /**
   * 提交答案
   * @param {string} passageId - 文章ID
   * @param {object} answers - 答案对象 { questionId: answer }
   * @param {number} timeSpent - 用时（秒）
   * @param {string} bank - 题库ID
   */
  submitAnswers: (passageId, answers, timeSpent, bank = 'default') => {
    return request({
      url: '/cloze/submit',
      method: 'post',
      data: { passageId, answers, timeSpent, bank }
    }).catch(error => {
      console.error('提交答案失败:', error);
      return { 
        flag: 0, 
        message: '提交失败，请检查网络连接',
        content: null
      };
    });
  },

  /**
   * 获取文章详情（带解析）
   * @param {string} passageId - 文章ID
   * @param {string} bank - 题库ID
   */
  getPassageDetails: (passageId, bank = 'default') => {
    return request({
      url: `/cloze/passage/${passageId}/details`,
      method: 'get',
      params: { bank }
    }).catch(error => {
      console.error('获取文章详情失败:', error);
      return { 
        flag: 0, 
        message: '获取详情失败',
        content: { passage: null, stats: {} }
      };
    });
  },

  /**
   * 批量获取题目统计
   * @param {array} questionIds - 题目ID数组
   * @param {string} bank - 题库ID
   */
  getBatchQuestionStats: (questionIds, bank = 'default') => {
    return request({
      url: '/cloze/stats/batch',
      method: 'post',
      data: { questionIds, bank }
    }).catch(error => {
      console.error('批量获取题目统计失败:', error);
      return { 
        flag: 0, 
        message: '获取统计失败',
        content: { stats: [], count: 0 }
      };
    });
  },

  /**
   * 获取学习报告
   * @param {string} bank - 题库ID
   */
  getReport: (bank = 'default') => {
    return request({
      url: '/cloze/report',
      method: 'get',
      params: { bank }
    }).catch(error => {
      console.error('获取学习报告失败:', error);
      return { 
        flag: 0, 
        message: '获取报告失败',
        content: { 
          metadata: {}, 
          summary: { totalPassages: 0, attemptedPassages: 0, weakQuestions: 0, masteredQuestions: 0 },
          categoryStats: {},
          weakQuestions: [],
          masteredQuestions: []
        }
      };
    });
  },

  /**
   * 检查服务器连接状态
   */
  checkServerStatus: () => {
    return request({
      url: '/health',
      method: 'get',
      timeout: 3000
    }).catch(error => {
      console.error('服务器连接失败:', error);
      return { flag: 0, message: '服务器连接失败' };
    });
  }
};