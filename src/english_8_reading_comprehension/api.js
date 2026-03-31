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
 * 阅读理解API
 * 基础路径: /api/8_reading_comprehension (与服务端保持一致)
 */
export const readingApi = {
  /**
   * 健康检查
   * GET /api/8_reading_comprehension/health
   */
  healthCheck: () => {
    console.log('【API】调用 healthCheck');
    return request({
      url: '/8_reading_comprehension/health',
      method: 'get'
    }).catch(error => {
      console.error('健康检查失败:', error);
      return { flag: 0, message: '健康检查失败', content: null };
    });
  },

  /**
   * 获取所有可用的题库列表
   * GET /api/8_reading_comprehension/banks
   */
  getBanks: () => {
    console.log('【API】调用 getBanks');
    return request({
      url: '/8_reading_comprehension/banks',
      method: 'get'
    }).catch(error => {
      console.error('获取题库列表失败:', error);
      return { flag: 0, message: '获取题库列表失败', content: { banks: [] } };
    });
  },

  /**
   * 获取题库信息（已废弃，使用 getBanks 代替）
   * GET /api/8_reading_comprehension/info
   */
  getBankInfo: () => {
    console.log('【API】调用 getBankInfo');
    return request({
      url: '/8_reading_comprehension/info',
      method: 'get'
    }).catch(error => {
      console.error('获取题库信息失败:', error);
      return { flag: 0, message: '获取题库信息失败', content: null };
    });
  },

  /**
   * 获取所有篇章列表（支持指定题库）
   * GET /api/8_reading_comprehension/passages?bank=xxx
   * @param {string} bankId - 题库ID
   */
  getPassages: (bankId) => {
    console.log('【API】调用 getPassages:', { bankId });
    return request({
      url: '/8_reading_comprehension/passages',
      method: 'get',
      params: { bank: bankId }
    }).catch(error => {
      console.error('获取篇章列表失败:', error);
      return { flag: 0, message: '获取篇章列表失败', content: { passages: [] } };
    });
  },

  /**
   * 获取阅读理解篇章（支持指定题库）
   * GET /api/8_reading_comprehension/passage?passageId=xxx&type=random&bank=xxx
   * @param {object} params - 参数对象
   * @param {string} params.passageId - 指定篇章ID（可选）
   * @param {string} params.type - 抽取类型: random, new, review
   * @param {string} params.bank - 题库ID
   */
  getPassage: ({ passageId = null, type = 'random', bank = null } = {}) => {
    const params = { type };
    if (passageId) {
      params.passageId = passageId;
    }
    if (bank) {
      params.bank = bank;
    }
    
    console.log('【API】调用 getPassage:', params);
    
    return request({
      url: '/8_reading_comprehension/passage',
      method: 'get',
      params
    }).catch(error => {
      console.error('获取阅读理解篇章失败:', error);
      return { 
        flag: 0, 
        message: '获取阅读理解篇章失败',
        content: { passage: null }
      };
    });
  },

  /**
   * 提交阅读理解答案（支持指定题库）
   * POST /api/8_reading_comprehension/passage/submit
   * @param {object} data - 提交数据
   * @param {string} data.passageId - 篇章ID
   * @param {string[]} data.questionIds - 题目ID数组
   * @param {string[]} data.answers - 答案数组
   * @param {number} data.timeSpent - 用时（秒）
   * @param {string} data.bank - 题库ID
   */
  submitPassage: ({ passageId, questionIds, answers, timeSpent = 0, bank = null }) => {
    console.log('【API】调用 submitPassage:', { passageId, questionIds, answers, timeSpent, bank });
    
    return request({
      url: '/8_reading_comprehension/passage/submit',
      method: 'post',
      data: { passageId, questionIds, answers, timeSpent, bank }
    }).catch(error => {
      console.error('提交阅读理解答案失败:', error);
      return { 
        flag: 0, 
        message: '提交失败',
        content: null
      };
    });
  },

  /**
   * 获取阅读理解篇章详情（带解析，支持指定题库）
   * GET /api/8_reading_comprehension/passage/:passageId/details?bank=xxx
   * @param {string} passageId - 篇章ID
   * @param {string} bank - 题库ID
   */
  getPassageDetails: (passageId, bank = null) => {
    console.log('【API】调用 getPassageDetails:', { passageId, bank });
    
    return request({
      url: `/8_reading_comprehension/passage/${passageId}/details`,
      method: 'get',
      params: { bank }
    }).catch(error => {
      console.error('获取阅读理解篇章详情失败:', error);
      return { 
        flag: 0, 
        message: '获取详情失败',
        content: { passage: null, questions: [] }
      };
    });
  },

  /**
   * 获取学习报告（支持指定题库）
   * GET /api/8_reading_comprehension/report?bank=xxx
   * @param {string} bank - 题库ID
   */
  getReport: (bank = null) => {
    console.log('【API】调用 getReport:', { bank });
    
    return request({
      url: '/8_reading_comprehension/report',
      method: 'get',
      params: { bank }
    }).catch(error => {
      console.error('获取学习报告失败:', error);
      return { 
        flag: 0, 
        message: '获取报告失败',
        content: { metadata: {}, questions: {}, passages: {} }
      };
    });
  }
};

export default readingApi;