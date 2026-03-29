import axios from 'axios';

// 创建axios实例
const request = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://www.ddstudent.xyz/server/english',
  timeout: 10000
});

// 请求拦截器 - 添加token和当前选中的单词库
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    
    // 从localStorage获取当前选中的单词库文件
    const currentBankFile = localStorage.getItem('currentWordBank');
    if (currentBankFile) {
      config.headers['x-word-bank'] = currentBankFile;
      console.log('设置单词库头:', currentBankFile);
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 直接返回后端的数据格式 { flag, message, content }
    return response.data;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * 单词记忆API
 * 基础路径: /api/english_book_1_work
 */
export const wordMemoryApi = {
  /**
   * 获取可用的单词库列表
   * GET /api/english_book_1_work/banks
   */
  getWordBanks: () => {
    console.log('【API】调用 getWordBanks');
    return request({
      url: '/english_book_1_work/banks',
      method: 'get'
    }).catch(error => {
      console.error('获取单词库列表失败:', error);
      return { flag: 0, message: '获取单词库列表失败', content: { banks: [] } };
    });
  },

  /**
   * 设置当前使用的单词库
   * @param {object} bank - 单词库对象
   */
  setCurrentWordBank: (bank) => {
    if (bank && bank.file) {
      localStorage.setItem('currentWordBank', bank.file);
      console.log('【API】设置当前单词库:', bank.name, bank.file);
    }
  },

  /**
   * 获取当前单词库文件
   */
  getCurrentWordBankFile: () => {
    return localStorage.getItem('currentWordBank');
  },

  /**
   * 健康检查
   * GET /api/english_book_1_work/health
   */
  healthCheck: () => {
    console.log('【API】调用 healthCheck');
    return request({
      url: '/english_book_1_work/health',
      method: 'get'
    }).catch(error => {
      console.error('健康检查失败:', error);
      return { flag: 0, message: '健康检查失败', content: null };
    });
  },

  /**
   * 获取单词库信息
   * GET /api/english_book_1_work/info
   */
  getBankInfo: () => {
    console.log('【API】调用 getBankInfo');
    return request({
      url: '/english_book_1_work/info',
      method: 'get'
    }).catch(error => {
      console.error('获取单词库信息失败:', error);
      return { flag: 0, message: '获取单词库信息失败', content: null };
    });
  },

  /**
   * 获取所有单词（带统计）
   * GET /api/english_book_1_work/words
   */
  getWords: () => {
    console.log('【API】调用 getWords');
    return request({
      url: '/english_book_1_work/words',
      method: 'get'
    }).catch(error => {
      console.error('获取单词列表失败:', error);
      return { flag: 0, message: '获取单词列表失败', content: { words: [] } };
    });
  },

  /**
   * 获取单个单词
   * GET /api/english_book_1_work/word/:wordId
   * @param {number|string} wordId - 单词ID
   */
  getWord: (wordId) => {
    console.log('【API】调用 getWord:', { wordId });
    return request({
      url: `/english_book_1_work/word/${wordId}`,
      method: 'get'
    }).catch(error => {
      console.error('获取单词失败:', error);
      return { flag: 0, message: '获取单词失败', content: null };
    });
  },

  /**
   * 获取随机单词（用于闪卡）
   * GET /api/english_book_1_work/random
   */
  getRandomWord: () => {
    console.log('【API】调用 getRandomWord');
    return request({
      url: '/english_book_1_work/random',
      method: 'get'
    }).catch(error => {
      console.error('获取随机单词失败:', error);
      return { flag: 0, message: '获取随机单词失败', content: null };
    });
  },

  /**
   * 生成测试题目
   * POST /api/english_book_1_work/test/generate
   * @param {object} params - 参数
   * @param {string} params.testType - 测试类型: picture, en2zh, listen
   * @param {number} params.questionCount - 题目数量
   */
  generateTest: ({ testType, questionCount = 5 }) => {
    console.log('【API】调用 generateTest:', { testType, questionCount });
    return request({
      url: '/english_book_1_work/test/generate',
      method: 'post',
      data: { testType, questionCount }
    }).catch(error => {
      console.error('生成测试题目失败:', error);
      return { flag: 0, message: '生成测试题目失败', content: { questions: [] } };
    });
  },

  /**
   * 提交测试答案
   * POST /api/english_book_1_work/test/submit
   * @param {object} data - 提交数据
   * @param {string} data.testType - 测试类型
   * @param {Array} data.results - 答题结果数组
   * @param {number} data.timeSpent - 用时（秒）
   */
  submitTest: ({ testType, results, timeSpent = 0 }) => {
    console.log('【API】调用 submitTest:', { testType, resultsCount: results?.length, timeSpent });
    return request({
      url: '/english_book_1_work/test/submit',
      method: 'post',
      data: { testType, results, timeSpent }
    }).catch(error => {
      console.error('提交测试答案失败:', error);
      return { flag: 0, message: '提交测试答案失败', content: null };
    });
  },

  /**
   * 标记单词为已掌握（闪卡模式）
   * POST /api/english_book_1_work/word/:wordId/master
   * @param {number|string} wordId - 单词ID
   */
  markWordAsMastered: (wordId) => {
    console.log('【API】调用 markWordAsMastered:', { wordId });
    return request({
      url: `/english_book_1_work/word/${wordId}/master`,
      method: 'post'
    }).catch(error => {
      console.error('标记单词失败:', error);
      return { flag: 0, message: '标记单词失败', content: null };
    });
  },

  /**
   * 获取学习报告
   * GET /api/english_book_1_work/report
   */
  getReport: () => {
    console.log('【API】调用 getReport');
    return request({
      url: '/english_book_1_work/report',
      method: 'get'
    }).catch(error => {
      console.error('获取学习报告失败:', error);
      return { 
        flag: 0, 
        message: '获取学习报告失败', 
        content: { 
          metadata: {}, 
          words: {}, 
          testHistory: [],
          totalWords: 0
        } 
      };
    });
  },

  /**
   * 获取各模式统计
   * GET /api/english_book_1_work/mode-stats
   */
  getModeStats: () => {
    console.log('【API】调用 getModeStats');
    return request({
      url: '/english_book_1_work/mode-stats',
      method: 'get'
    }).catch(error => {
      console.error('获取模式统计失败:', error);
      return { 
        flag: 0, 
        message: '获取模式统计失败',
        content: {
          flashcard: { viewed: 0, mastered: 0 },
          picture: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
          en2zh: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
          listen: { total: 0, correct: 0, wrong: 0, accuracy: 0 }
        }
      };
    });
  }
};

export default wordMemoryApi;