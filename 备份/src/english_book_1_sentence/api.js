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
 * 句子复习API
 * 基础路径: /api/sentence_review
 */
export const sentenceReviewApi = {
  /**
   * 健康检查
   * GET /api/sentence_review/health
   */
  healthCheck: () => {
    console.log('【API】调用 healthCheck');
    return request({
      url: '/sentence_review/health',
      method: 'get'
    }).catch(error => {
      console.error('健康检查失败:', error);
      return { flag: 0, message: '健康检查失败', content: null };
    });
  },

  /**
   * 获取可用的句子库列表
   * GET /api/sentence_review/banks
   */
  getBanks: () => {
    console.log('【API】调用 getBanks');
    return request({
      url: '/sentence_review/banks',
      method: 'get'
    }).catch(error => {
      console.error('获取句子库列表失败:', error);
      return { flag: 0, message: '获取句子库列表失败', content: { banks: [] } };
    });
  },

  /**
   * 获取句子库信息
   * GET /api/sentence_review/info
   * @param {string} bankFile - 句子库文件名 (如: sentence_pepa_view.json)
   */
  getBankInfo: (bankFile) => {
    console.log('【API】调用 getBankInfo:', { bankFile });
    return request({
      url: '/sentence_review/info',
      method: 'get',
      headers: {
        'X-Word-Bank': bankFile
      }
    }).catch(error => {
      console.error('获取句子库信息失败:', error);
      return { flag: 0, message: '获取句子库信息失败', content: null };
    });
  },

  /**
   * 获取所有句子（带统计）
   * GET /api/sentence_review/sentences
   * @param {string} bankFile - 句子库文件名
   * @param {object} params - 查询参数
   * @param {string} params.status - 状态: all, mastered, unmastered
   * @param {number} params.limit - 限制数量
   * @param {boolean} params.random - 是否随机
   */
  getSentences: (bankFile, params = {}) => {
    console.log('【API】调用 getSentences:', { bankFile, params });
    const queryParams = new URLSearchParams(params).toString();
    const url = `/sentence_review/sentences${queryParams ? '?' + queryParams : ''}`;
    
    return request({
      url: url,
      method: 'get',
      headers: {
        'X-Word-Bank': bankFile
      }
    }).catch(error => {
      console.error('获取句子列表失败:', error);
      return { flag: 0, message: '获取句子列表失败', content: { sentences: [], meta: { total: 0, mastered: 0, unmastered: 0 } } };
    });
  },

  /**
   * 获取随机句子（用于练习）
   * GET /api/sentence_review/random
   * @param {string} bankFile - 句子库文件名
   * @param {string} status - 状态: all, mastered, unmastered
   */
  getRandomSentence: (bankFile, status = 'unmastered') => {
    console.log('【API】调用 getRandomSentence:', { bankFile, status });
    return request({
      url: '/sentence_review/random',
      method: 'get',
      headers: {
        'X-Word-Bank': bankFile,
        'X-Status': status
      }
    }).catch(error => {
      console.error('获取随机句子失败:', error);
      return { flag: 0, message: '获取随机句子失败', content: { sentence: null } };
    });
  },

  /**
   * 获取单个句子
   * GET /api/sentence_review/sentence/:sentenceId
   * @param {string} bankFile - 句子库文件名
   * @param {string} sentenceId - 句子ID
   */
  getSentence: (bankFile, sentenceId) => {
    console.log('【API】调用 getSentence:', { bankFile, sentenceId });
    return request({
      url: `/sentence_review/sentence/${sentenceId}`,
      method: 'get',
      headers: {
        'X-Word-Bank': bankFile
      }
    }).catch(error => {
      console.error('获取句子失败:', error);
      return { flag: 0, message: '获取句子失败', content: { sentence: null } };
    });
  },

  /**
   * 添加句子
   * POST /api/sentence_review/sentence
   * @param {string} bankFile - 句子库文件名
   * @param {object} sentenceData - 句子数据
   * @param {string} sentenceData.text - 英文句子
   * @param {string} sentenceData.chinese - 中文翻译
   */
  addSentence: (bankFile, sentenceData) => {
    console.log('【API】调用 addSentence:', { bankFile, sentenceData });
    return request({
      url: '/sentence_review/sentence',
      method: 'post',
      headers: {
        'X-Word-Bank': bankFile,
        'Content-Type': 'application/json'
      },
      data: sentenceData
    }).catch(error => {
      console.error('添加句子失败:', error);
      return { flag: 0, message: '添加句子失败', content: null };
    });
  },

  /**
   * 更新句子
   * PUT /api/sentence_review/sentence/:sentenceId
   * @param {string} bankFile - 句子库文件名
   * @param {string} sentenceId - 句子ID
   * @param {object} sentenceData - 更新的句子数据
   */
  updateSentence: (bankFile, sentenceId, sentenceData) => {
    console.log('【API】调用 updateSentence:', { bankFile, sentenceId, sentenceData });
    return request({
      url: `/sentence_review/sentence/${sentenceId}`,
      method: 'put',
      headers: {
        'X-Word-Bank': bankFile,
        'Content-Type': 'application/json'
      },
      data: sentenceData
    }).catch(error => {
      console.error('更新句子失败:', error);
      return { flag: 0, message: '更新句子失败', content: null };
    });
  },

  /**
   * 删除句子
   * DELETE /api/sentence_review/sentence/:sentenceId
   * @param {string} bankFile - 句子库文件名
   * @param {string} sentenceId - 句子ID
   */
  deleteSentence: (bankFile, sentenceId) => {
    console.log('【API】调用 deleteSentence:', { bankFile, sentenceId });
    return request({
      url: `/sentence_review/sentence/${sentenceId}`,
      method: 'delete',
      headers: {
        'X-Word-Bank': bankFile
      }
    }).catch(error => {
      console.error('删除句子失败:', error);
      return { flag: 0, message: '删除句子失败', content: null };
    });
  },

  /**
   * 批量添加句子
   * POST /api/sentence_review/sentences/batch
   * @param {string} bankFile - 句子库文件名
   * @param {Array} sentences - 句子数组
   */
  batchAddSentences: (bankFile, sentences) => {
    console.log('【API】调用 batchAddSentences:', { bankFile, count: sentences?.length });
    return request({
      url: '/sentence_review/sentences/batch',
      method: 'post',
      headers: {
        'X-Word-Bank': bankFile,
        'Content-Type': 'application/json'
      },
      data: { sentences }
    }).catch(error => {
      console.error('批量添加句子失败:', error);
      return { flag: 0, message: '批量添加句子失败', content: { addedCount: 0, ids: [] } };
    });
  },

  /**
   * 批量删除句子
   * DELETE /api/sentence_review/sentences/batch
   * @param {string} bankFile - 句子库文件名
   * @param {Array} sentenceIds - 句子ID数组
   */
  batchDeleteSentences: (bankFile, sentenceIds) => {
    console.log('【API】调用 batchDeleteSentences:', { bankFile, count: sentenceIds?.length });
    return request({
      url: '/sentence_review/sentences/batch',
      method: 'delete',
      headers: {
        'X-Word-Bank': bankFile,
        'Content-Type': 'application/json'
      },
      data: { sentenceIds }
    }).catch(error => {
      console.error('批量删除句子失败:', error);
      return { flag: 0, message: '批量删除句子失败', content: { deletedCount: 0 } };
    });
  },

  /**
   * 更新句子统计（练习结果）
   * POST /api/sentence_review/sentence/:sentenceId/stats
   * @param {string} bankFile - 句子库文件名
   * @param {string} sentenceId - 句子ID
   * @param {object} stats - 统计数据
   * @param {boolean} stats.correct - 是否正确
   * @param {boolean} stats.extraction - 是否抽取
   */
  updateStats: (bankFile, sentenceId, stats) => {
    console.log('【API】调用 updateStats:', { bankFile, sentenceId, stats });
    return request({
      url: `/sentence_review/sentence/${sentenceId}/stats`,
      method: 'post',
      headers: {
        'X-Word-Bank': bankFile,
        'Content-Type': 'application/json'
      },
      data: stats
    }).catch(error => {
      console.error('更新统计失败:', error);
      return { flag: 0, message: '更新统计失败', content: null };
    });
  },

  /**
   * 标记句子为已掌握
   * POST /api/sentence_review/sentence/:sentenceId/master
   * @param {string} bankFile - 句子库文件名
   * @param {string} sentenceId - 句子ID
   */
  markAsMastered: (bankFile, sentenceId) => {
    console.log('【API】调用 markAsMastered:', { bankFile, sentenceId });
    return request({
      url: `/sentence_review/sentence/${sentenceId}/master`,
      method: 'post',
      headers: {
        'X-Word-Bank': bankFile
      }
    }).catch(error => {
      console.error('标记句子失败:', error);
      return { flag: 0, message: '标记失败', content: null };
    });
  },

  /**
   * 标记句子为未掌握
   * POST /api/sentence_review/sentence/:sentenceId/unmaster
   * @param {string} bankFile - 句子库文件名
   * @param {string} sentenceId - 句子ID
   */
  markAsUnmastered: (bankFile, sentenceId) => {
    console.log('【API】调用 markAsUnmastered:', { bankFile, sentenceId });
    return request({
      url: `/sentence_review/sentence/${sentenceId}/unmaster`,
      method: 'post',
      headers: {
        'X-Word-Bank': bankFile
      }
    }).catch(error => {
      console.error('取消标记失败:', error);
      return { flag: 0, message: '取消标记失败', content: null };
    });
  },

  /**
   * 生成测试题目
   * POST /api/sentence_review/test/generate
   * @param {string} bankFile - 句子库文件名
   * @param {object} data - 测试参数
   * @param {string} data.testType - 测试类型: sentence, word
   * @param {number} data.questionCount - 题目数量
   * @param {string} data.status - 句子状态: all, mastered, unmastered
   */
  generateTest: (bankFile, { testType = 'sentence', questionCount = 5, status = 'unmastered' }) => {
    console.log('【API】调用 generateTest:', { bankFile, testType, questionCount, status });
    return request({
      url: '/sentence_review/test/generate',
      method: 'post',
      headers: {
        'X-Word-Bank': bankFile,
        'Content-Type': 'application/json'
      },
      data: { testType, questionCount, status }
    }).catch(error => {
      console.error('生成测试题目失败:', error);
      return { flag: 0, message: '生成测试题目失败', content: { questions: [] } };
    });
  },

  /**
   * 提交测试答案
   * POST /api/sentence_review/test/submit
   * @param {string} bankFile - 句子库文件名
   * @param {object} data - 提交数据
   * @param {string} data.testType - 测试类型
   * @param {Array} data.results - 答题结果数组
   * @param {number} data.timeSpent - 用时（秒）
   */
  submitTest: (bankFile, { testType, results, timeSpent = 0 }) => {
    console.log('【API】调用 submitTest:', { bankFile, testType, resultsCount: results?.length, timeSpent });
    return request({
      url: '/sentence_review/test/submit',
      method: 'post',
      headers: {
        'X-Word-Bank': bankFile,
        'Content-Type': 'application/json'
      },
      data: { testType, results, timeSpent }
    }).catch(error => {
      console.error('提交测试答案失败:', error);
      return { 
        flag: 0, 
        message: '提交失败',
        content: { 
          summary: { total: 0, correct: 0, wrong: 0, accuracy: 0 }, 
          results: [], 
          testRecord: null 
        }
      };
    });
  },

  /**
   * 获取学习报告
   * GET /api/sentence_review/report
   * @param {string} bankFile - 句子库文件名
   */
  getReport: (bankFile) => {
    console.log('【API】调用 getReport:', { bankFile });
    return request({
      url: '/sentence_review/report',
      method: 'get',
      headers: {
        'X-Word-Bank': bankFile
      }
    }).catch(error => {
      console.error('获取学习报告失败:', error);
      return { 
        flag: 0, 
        message: '获取报告失败',
        content: { 
          metadata: {}, 
          sentences: {}, 
          testHistory: [], 
          totalSentences: 0, 
          masteredCount: 0,
          unmasteredCount: 0,
          bankName: '' 
        }
      };
    });
  },

  /**
   * 获取各模式统计
   * GET /api/sentence_review/mode-stats
   * @param {string} bankFile - 句子库文件名
   */
  getModeStats: (bankFile) => {
    console.log('【API】调用 getModeStats:', { bankFile });
    return request({
      url: '/sentence_review/mode-stats',
      method: 'get',
      headers: {
        'X-Word-Bank': bankFile
      }
    }).catch(error => {
      console.error('获取模式统计失败:', error);
      return { 
        flag: 0, 
        message: '获取模式统计失败',
        content: {
          sentence: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
          word: { total: 0, correct: 0, wrong: 0, accuracy: 0 }
        }
      };
    });
  },

  /**
   * 获取用户文件列表
   * GET /api/sentence_review/user-files
   */
  getUserFiles: () => {
    console.log('【API】调用 getUserFiles');
    return request({
      url: '/sentence_review/user-files',
      method: 'get'
    }).catch(error => {
      console.error('获取用户文件列表失败:', error);
      return { flag: 0, message: '获取用户文件列表失败', content: { files: [] } };
    });
  }
};

// 为了兼容性，保留旧的 sentenceApi 名称
export const sentenceApi = sentenceReviewApi;

// 默认导出所有API
export default {
  sentence: sentenceReviewApi,
  // 可以添加其他API...
};