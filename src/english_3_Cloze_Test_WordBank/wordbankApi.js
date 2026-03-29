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

// 响应拦截器 - 直接返回data
request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export const wordbankApi = {
  /**
   * 获取题库列表
   * GET /api/wordbank/banks
   */
  getBanks: () => {
    return request({
      url: '/wordbank/banks',
      method: 'get'
    }).catch(error => {
      console.error('获取题库列表失败:', error);
      return { flag: 0, message: '获取题库列表失败', content: { banks: [] } };
    });
  },

  /**
   * 获取题目 - 新接口，支持批量获取
   * GET /api/wordbank/questions?type=smart&bank=中考&count=10&category=生活&difficulty=2
   * 
   * @param {object} params - 参数对象
   * @param {string} params.type - 抽取类型: smart, weak, new, review, mastered, random, all
   * @param {string} params.bank - 题库ID，默认 '中考'
   * @param {number} params.count - 抽取数量，默认 10
   * @param {string} params.category - 分类过滤，可选
   * @param {number|string} params.difficulty - 难度过滤，可选
   * @returns {Promise}
   */
  getQuestions: ({ type = 'random', bank = '中考', count = 10, category, difficulty } = {}) => {
    const params = { type, bank };
    if (count) params.count = count;
    if (category && category !== 'all') params.category = category;
    if (difficulty && difficulty !== 'all') params.difficulty = difficulty;
    
    console.log('【API】获取题目:', params);
    
    return request({
      url: '/wordbank/questions',
      method: 'get',
      params
    }).catch(error => {
      console.error('获取题目失败:', error);
      return { 
        flag: 0, 
        message: '获取题目失败，请检查服务器连接', 
        content: { 
          questions: [],
          stats: { totalQuestions: 0, attemptedQuestions: 0 }
        } 
      };
    });
  },

  /**
   * 提交答案 - 新格式
   * POST /api/wordbank/submit
   * 
   * @param {object} data - 提交数据
   * @param {string[]} data.questionIds - 题目ID数组
   * @param {string[]} data.answers - 答案数组（与questionIds顺序对应）
   * @param {number} data.timeSpent - 用时（秒）
   * @param {string} data.bank - 题库ID
   * @returns {Promise}
   */
  submitAnswers: ({ questionIds, answers, timeSpent, bank = '中考' }) => {
    console.log('【API】提交答案:', { questionIds, answers, timeSpent, bank });
    
    return request({
      url: '/wordbank/submit',
      method: 'post',
      data: { questionIds, answers, timeSpent, bank }
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
   * 获取题目详情（带解析）
   * GET /api/wordbank/questions/:questionId/details?bank=中考
   * 
   * @param {string} questionId - 题目ID
   * @param {string} bank - 题库ID
   * @returns {Promise}
   */
  getQuestionDetails: (questionId, bank = '中考') => {
    console.log('【API】获取题目详情:', { questionId, bank });
    
    return request({
      url: `/wordbank/questions/${questionId}/details`,
      method: 'get',
      params: { bank }
    }).catch(error => {
      console.error('获取题目详情失败:', error);
      return { 
        flag: 0, 
        message: '获取详情失败',
        content: { question: null, stats: {} }
      };
    });
  },

  /**
   * 获取学习报告
   * GET /api/wordbank/report?bank=中考
   * 
   * @param {string} bank - 题库ID
   * @returns {Promise}
   */
  getReport: (bank = '中考') => {
    console.log('【API】获取学习报告:', { bank });
    
    return request({
      url: '/wordbank/report',
      method: 'get',
      params: { bank }
    }).catch(error => {
      console.error('获取学习报告失败:', error);
      return { 
        flag: 0, 
        message: '获取报告失败',
        content: { 
          metadata: {}, 
          questions: {}
        } 
      };
    });
  },

  /**
   * 获取分类列表（从题库配置）
   * GET /api/wordbank/banks
   * 
   * @param {string} bank - 题库ID
   * @returns {Promise<string[]>}
   */
  getCategories: async (bank = '中考') => {
    try {
      const response = await wordbankApi.getBanks();
      if (response?.flag === 1 && response.content?.banks) {
        const bankInfo = response.content.banks.find(b => b.id === bank || b.key === bank);
        return bankInfo?.categories || [];
      }
      return [];
    } catch (error) {
      console.error('获取分类失败:', error);
      return [];
    }
  },

  /**
   * 检查服务器连接状态
   * GET /api/wordbank/health
   */
  checkServerStatus: () => {
    return request({
      url: '/wordbank/health',
      method: 'get',
      timeout: 3000
    }).catch(error => {
      console.error('服务器连接失败:', error);
      return { flag: 0, message: '服务器连接失败' };
    });
  },

  // ========== 兼容旧方法（标记为已废弃） ==========
  
  /**
   * @deprecated 请使用 getQuestions 代替
   */
  getPassage: (type = 'smart', bank = 'default') => {
    console.warn('【废弃】getPassage 已废弃，请使用 getQuestions 代替');
    return wordbankApi.getQuestions({ type, bank, count: 1 }).then(res => {
      // 转换格式以保持兼容
      if (res?.flag === 1 && res.content?.questions?.[0]) {
        const question = res.content.questions[0];
        return {
          flag: 1,
          content: {
            passage: {
              id: question.source?.passageId || question.id,
              title: question.source?.passageTitle || '题目',
              category: question.source?.category,
              difficulty: question.source?.difficulty,
              content: question.sentence,
              questions: [{
                id: question.id,
                number: question.number,
                givenWord: question.givenWord,
                correctForm: question.correctForm
              }]
            },
            stats: res.content.stats
          }
        };
      }
      return res;
    });
  },

  /**
   * @deprecated 请使用 submitAnswers 新格式代替
   */
  submitAnswersOld: (passageId, answers, timeSpent, bank = 'default') => {
    console.warn('【废弃】submitAnswers 旧格式已废弃，请使用新格式');
    const questionIds = Object.keys(answers);
    const answerValues = Object.values(answers);
    return wordbankApi.submitAnswers({ questionIds, answers: answerValues, timeSpent, bank });
  },

  /**
   * @deprecated 请使用 getQuestionDetails 代替
   */
  getPassageDetails: (passageId, bank = 'default') => {
    console.warn('【废弃】getPassageDetails 已废弃，请使用 getQuestionDetails 代替');
    return wordbankApi.getQuestionDetails(passageId, bank);
  }
};

// 默认导出
export default wordbankApi;