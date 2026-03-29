// src/services/api.js
const API_BASE = 'https://www.ddstudent.xyz/server/english'; // 你的后端地址

// 获取token（可以从localStorage或登录状态获取）
const getToken = () => {
  return localStorage.getItem('token') || 'your_test_token_here';
};

// 通用请求函数
const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const config = {
    headers: { ...defaultHeaders, ...options.headers },
    ...options
  };

  try {
    console.log(`[API请求] ${config.method || 'GET'} ${API_BASE}${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    console.log('[API响应]', data);
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    return { flag: 0, message: '网络请求失败', error: error.message };
  }
};

// API接口
export const questionApi = {
  // === 题库管理接口 ===
  
  /**
   * 获取可用题库列表
   * @returns {Promise} 返回题库列表
   */
  getBanks: () => 
    request('/questions/banks'),

  /**
   * 获取题目（支持多题库）
   * @param {string} type - 抽取类型: smart/weak/new/review/mastered
   * @param {number} count - 题目数量
   * @param {string} bank - 题库标识: default/中考/高考/专项
   * @returns {Promise} 返回题目数据
   */
  getQuestions: (type = 'smart', count = 10, bank = 'default') => 
    request(`/questions/get?type=${type}&count=${count}&bank=${encodeURIComponent(bank)}`),

/**
 * 按题号范围获取题目（支持按类型筛选）
 * @param {number} start - 起始题号
 * @param {number} end - 结束题号
 * @param {string} bank - 题库标识
 * @param {string} type - 抽取类型: smart/weak/new/review/mastered/random
 * @returns {Promise} 返回指定范围和类型的题目数据
 */
// 在 api.js 中
getQuestionsByRange: (start, end, bank = 'default', type = 'smart') => 
  request(`/questions/range?start=${start}&end=${end}&type=${type}&bank=${encodeURIComponent(bank)}`),

  /**
   * 获取题库总题数
   * @param {string} bank - 题库标识: default/中考/高考/专项
   * @returns {Promise} 返回题库总题数
   */
  getTotalQuestions: (bank = 'default') => 
    request(`/questions/total?bank=${encodeURIComponent(bank)}`),

  /**
   * 提交答案（支持多题库）
   * @param {Object} answers - 答案对象 { questionId: "A", ... }
   * @param {number} timeSpent - 答题用时（秒）
   * @param {string} bank - 题库标识: default/中考/高考/专项
   * @returns {Promise} 返回提交结果
   */
  submitAnswers: (answers, timeSpent, bank = 'default') => 
    request('/questions/submit', {
      method: 'POST',
      body: JSON.stringify({ answers, timeSpent, bank })
    }),

  /**
   * 获取学习报告（支持多题库）
   * @param {string} bank - 题库标识: default/中考/高考/专项
   * @returns {Promise} 返回学习报告数据
   */
  getReport: (bank = 'default') => 
    request(`/questions/report?bank=${encodeURIComponent(bank)}`),

  /**
   * 重置统计（支持多题库）
   * @param {string} questionId - 题目ID（可选）
   * @param {boolean} all - 是否重置所有
   * @param {string} bank - 题库标识: default/中考/高考/专项
   * @returns {Promise} 返回重置结果
   */
  resetStats: (questionId = null, all = false, bank = 'default') => 
    request('/questions/reset', {
      method: 'POST',
      body: JSON.stringify({ questionId, all, bank })
    }),

  /**
   * 获取所有母版题（带学生统计，支持多题库）
   * @param {string} bank - 题库标识: default/中考/高考/专项
   * @returns {Promise} 返回包含所有题目和学生统计的数据
   */
  getMasterQuestions: (bank = 'default') => 
    request(`/questions/master?bank=${encodeURIComponent(bank)}`),

  // === 其他接口 ===

  /**
   * 获取学生个人学习报告（增强版）
   * @param {string} bank - 题库标识
   * @returns {Promise} 返回详细的学习报告
   */
  getStudentReport: (bank = 'default') => 
    request(`/questions/report/detailed?bank=${encodeURIComponent(bank)}`),

  /**
   * 获取单个题目的详细统计
   * @param {string} questionId 题目ID
   * @param {string} bank - 题库标识
   * @returns {Promise} 返回题目的详细统计信息
   */
  getQuestionStats: (questionId, bank = 'default') => 
    request(`/questions/stats/${questionId}?bank=${encodeURIComponent(bank)}`),

  /**
   * 批量获取题目统计
   * @param {Array} questionIds 题目ID数组
   * @param {string} bank - 题库标识
   * @returns {Promise} 返回多个题目的统计信息
   */
  getBatchQuestionStats: (questionIds, bank = 'default') => 
    request('/questions/stats/batch', {
      method: 'POST',
      body: JSON.stringify({ questionIds, bank })
    }),

  /**
   * 获取薄弱题列表
   * @param {number} count 数量
   * @param {string} bank - 题库标识
   * @returns {Promise} 返回薄弱题列表
   */
  getWeakQuestions: (count = 20, bank = 'default') => 
    request(`/questions/weak?count=${count}&bank=${encodeURIComponent(bank)}`),

  /**
   * 获取推荐复习题
   * @param {number} count 数量
   * @param {string} bank - 题库标识
   * @returns {Promise} 返回推荐复习的题目列表
   */
  getReviewQuestions: (count = 20, bank = 'default') => 
    request(`/questions/review?count=${count}&bank=${encodeURIComponent(bank)}`),

  /**
   * 获取学习进度总结
   * @param {string} bank - 题库标识
   * @returns {Promise} 返回学习进度总结
   */
  getProgressSummary: (bank = 'default') => 
    request(`/questions/progress/summary?bank=${encodeURIComponent(bank)}`),

  /**
   * 导出学习数据
   * @param {string} bank - 题库标识
   * @returns {Promise} 返回可下载的学习数据
   */
  exportLearningData: (bank = 'default') => 
    request(`/questions/export?bank=${encodeURIComponent(bank)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
};

// 为了方便使用，也可以导出单个函数
export const {
  getBanks,
  getQuestions,
  getQuestionsByRange,
  getTotalQuestions,
  submitAnswers,
  getReport,
  resetStats,
  getMasterQuestions,
  getStudentReport,
  getQuestionStats,
  getBatchQuestionStats,
  getWeakQuestions,
  getReviewQuestions,
  getProgressSummary,
  exportLearningData
} = questionApi;

export default questionApi;