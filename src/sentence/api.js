import axios from 'axios';

// API 基础配置
const API_BASE_URL = 'https://www.ddstudent.xyz/server/english';

// 创建axios实例
const apiRequest = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// 请求拦截器 - 添加token
apiRequest.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
apiRequest.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API错误:', error);
    return Promise.reject(error);
  }
);

// 用于防止重复添加请求
let pendingAddRequest = null;

// ==================== 句子相关 API ====================
export const sentenceApi = {
  // 获取句子列表
  getSentences: (filename = 'sentences', params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest.get(`/get_sentence_review/${filename}?${queryParams}`);
  },
  
  // 获取单个句子
  getSentence: (id) => {
    return apiRequest.get(`/get_sentence/${id}`);
  },
  
  // 增加正确次数
  incrementCorrect: (sentenceId, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'increment_correct',
      sentence: sentenceId,
      target
    });
  },
  
  // 增加错误次数
  incrementWrong: (sentenceId, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'increment_wrong',
      sentence: sentenceId,
      target
    });
  },
  
  // 增加抽取次数
  increment: (sentenceId, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'increment',
      sentence: sentenceId,
      target
    });
  },
  
  // 新增：更新最新回答时间
  updateLastAnswerTime: (sentenceId, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'update_last_answer',
      sentence: sentenceId,
      target
    });
  },
  
  // 更新句子统计（组合操作）
  updateSentenceStats: (sentenceId, stats) => {
    return apiRequest.post('/update_sentence_review', {
      type: 'update_stats',
      sentence: sentenceId,
      sentenceData: stats,
      target: 'sentences'
    });
  },
  
  // 标记为已掌握
  markAsMastered: (sentenceId, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'mark_mastered',
      sentence: sentenceId,
      target
    });
  },
  
  // 标记为未掌握
  markAsUnmastered: (sentenceId, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'mark_unmastered',
      sentence: sentenceId,
      target
    });
  },
  
  // 添加句子（防止重复调用）
  addSentence: (sentenceData, target = 'sentences') => {

    // 如果已经有正在进行的添加请求，直接返回该请求
    if (pendingAddRequest) {
      console.log('阻止重复的添加请求');
      return pendingAddRequest;
    }
    
    // 创建新请求
    const request = apiRequest.post('/update_sentence_review', {
      type: 'add',
      sentenceData,
      target
    }).finally(() => {
      // 请求完成后清除标记
      pendingAddRequest = null;
    });
    
    // 保存当前请求
    pendingAddRequest = request;
    return request;
  },
  
  // 删除句子
  deleteSentence: (sentenceId, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'delete',
      sentence: sentenceId,
      target
    });
  },
  
  // 重置统计
  resetStats: (sentenceId, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'reset_stats',
      sentence: sentenceId,
      target
    });
  },
  
  // 批量添加句子
  batchAddSentences: (sentences, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'batch_add',
      sentences,
      target
    });
  },
  
  // 批量删除句子
  batchDeleteSentences: (sentenceIds, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'batch_delete',
      sentences: sentenceIds,
      target
    });
  },
  
  // 获取文件列表
  getSentenceFiles: () => {
    return apiRequest.get('/get_sentence_files');
  },
  
  // 健康检查
  healthCheck: () => {
    return apiRequest.get('/sentence/health');
  }
};

// ==================== 单词相关 API ====================
export const wordApi = {
  // 获取单词列表
  getWords: (type = 'word_pepa.json') => {
    return apiRequest.get(`/get_review/${type}`);
  },
  
  // 更新单词
  updateWord: (data) => {
    return apiRequest.post('/update_word_review', data);
  },
  
  // 添加单词
  addWord: (word, wordData, target = 'word_pepa') => {
    return apiRequest.post('/update_word_review', {
      type: 'add',
      word,
      wordData,
      target
    });
  },
  
  // 删除单词
  deleteWord: (word, target = 'word_pepa') => {
    return apiRequest.post('/update_word_review', {
      type: 'delete',
      word,
      target
    });
  },
  
  // 增加正确次数
  incrementCorrect: (word, target = 'word_pepa') => {
    return apiRequest.post('/update_word_review', {
      type: 'increment_correct',
      word,
      target
    });
  },
  
  // 增加错误次数
  incrementWrong: (word, target = 'word_pepa') => {
    return apiRequest.post('/update_word_review', {
      type: 'increment_wrong',
      word,
      target
    });
  }
};

// ==================== 用户相关 API ====================
export const userApi = {
  // 登录
  login: (username, password) => {
    return fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(res => res.json());
  },
  
  // 注册
  register: (username, password) => {
    return fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(res => res.json());
  }
};

// 默认导出所有API
export default {
  sentence: sentenceApi,
  word: wordApi,
  user: userApi
};