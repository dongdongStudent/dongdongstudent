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
 * 阅读理解API - English A-Z
 * 基础路径: /api/english_a_z
 */
export const readingApi = {
  /**
   * 健康检查
   * GET /api/english_a_z/health
   */
  healthCheck: () => {
    return request({
      url: '/english_a_z/health',
      method: 'get'
    });
  },

  /**
   * 获取所有JSON文件列表
   * GET /api/english_a_z/json-files
   */
  getJsonFiles: () => {
    return request({
      url: '/english_a_z/json-files',
      method: 'get'
    }).then(response => {
      // 确保每个文件对象都有 fileName 字段
      if (response?.flag === 1 && response.content?.files) {
        response.content.files = response.content.files.map(file => ({
          ...file,
          fileName: file.fileName || `${file.id}.json`
        }));
      }
      return response;
    });
  },

  /**
   * 获取指定JSON文件内容
   * GET /api/english_a_z/json-content/:fileName
   * @param {string} fileName - JSON文件名
   */
  getJsonContent: (fileName) => {
    if (!fileName) {
      console.error('getJsonContent: fileName为空');
      return Promise.reject(new Error('文件名不能为空'));
    }
    return request({
      url: `/english_a_z/json-content/${encodeURIComponent(fileName)}`,
      method: 'get'
    });
  },

  /**
   * 获取题库信息
   * GET /api/english_a_z/info
   * @param {object} params - 参数对象
   * @param {string} params.jsonFile - JSON文件名（可选，默认reading_comprehension_master.json）
   */
  getBankInfo: ({ jsonFile = 'reading_comprehension_master.json' } = {}) => {
    return request({
      url: '/english_a_z/info',
      method: 'get',
      params: { jsonFile }
    });
  },

  /**
   * 获取所有篇章列表
   * GET /api/english_a_z/passages
   * @param {object} params - 参数对象
   * @param {string} params.jsonFile - JSON文件名（可选，默认reading_comprehension_master.json）
   */
  getPassages: ({ jsonFile = 'reading_comprehension_master.json' } = {}) => {
    return request({
      url: '/english_a_z/passages',
      method: 'get',
      params: { jsonFile }
    });
  },

  /**
   * 获取阅读理解篇章
   * GET /api/english_a_z/passage
   * @param {object} params - 参数对象
   * @param {string} params.jsonFile - JSON文件名（可选，默认reading_comprehension_master.json）
   * @param {string} params.passageId - 指定篇章ID（可选）
   * @param {string} params.type - 抽取类型: random, new, review（默认random）
   */
  getPassage: ({ jsonFile = 'reading_comprehension_master.json', passageId = null, type = 'random' } = {}) => {
    const params = { jsonFile, type };
    if (passageId) {
      params.passageId = passageId;
    }
    
    return request({
      url: '/english_a_z/passage',
      method: 'get',
      params
    });
  },

  /**
   * 提交阅读理解答案
   * POST /api/english_a_z/passage/submit
   * @param {object} data - 提交数据
   * @param {string} data.passageId - 篇章ID
   * @param {string} data.jsonFile - JSON文件名（可选，默认reading_comprehension_master.json）
   * @param {string[]} data.questionIds - 题目ID数组
   * @param {string[]} data.answers - 答案数组
   * @param {number} data.timeSpent - 用时（秒）
   */
  submitPassage: ({ passageId, jsonFile = 'reading_comprehension_master.json', questionIds, answers, timeSpent = 0 }) => {
    return request({
      url: '/english_a_z/passage/submit',
      method: 'post',
      data: { passageId, jsonFile, questionIds, answers, timeSpent }
    });
  },

  /**
   * 获取阅读理解篇章详情（带解析）
   * GET /api/english_a_z/passage/:passageId/details
   * @param {string} passageId - 篇章ID
   * @param {object} params - 参数对象
   * @param {string} params.jsonFile - JSON文件名（可选，默认reading_comprehension_master.json）
   */
  getPassageDetails: (passageId, { jsonFile = 'reading_comprehension_master.json' } = {}) => {
    return request({
      url: `/english_a_z/passage/${passageId}/details`,
      method: 'get',
      params: { jsonFile }
    });
  },

  /**
   * 获取学习报告
   * GET /api/english_a_z/report
   */
  getReport: () => {
    return request({
      url: '/english_a_z/report',
      method: 'get'
    });
  }
};

export default readingApi;