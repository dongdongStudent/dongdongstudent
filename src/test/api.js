// API 基础配置
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://www.ddstudent.xyz/server/english'  // 生产环境使用完整域名
  : 'https://www.ddstudent.xyz/server/english'; // 开发环境也使用同一个地址

// 获取认证头
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// API 请求函数
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = getAuthHeader();
  
  console.log(`【API请求】${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('【API响应】', data);
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};

// 句子相关 API - 适配 personal_sentence_review 文件夹
export const sentenceApi = {
  /**
   * 更新句子复习数据
   * POST /update_sentence_review
   * @param {object} data - 请求数据
   * @param {string} data.type - 操作类型: add, update, delete, reset_stats, increment_correct, increment_wrong, increment, batch_add, batch_delete, mark_mastered, mark_unmastered
   * @param {string} data.sentence - 句子ID (用于update, delete等操作)
   * @param {object} data.sentenceData - 句子数据 (用于add, update等操作)
   * @param {array} data.sentences - 句子列表 (用于batch操作)
   * @param {string} data.target - 目标文件名 (默认: "sentences")
   */
  updateSentence: (data) => {
    console.log('【句子API】调用 updateSentence:', data);
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(error => {
      console.error('更新句子失败:', error);
      return { flag: 0, message: '更新句子失败', content: null };
    });
  },
  
  /**
   * 添加句子
   * @param {object} sentenceData - 句子数据
   * @param {string} sentenceData.text - 英文句子
   * @param {string} sentenceData.chinese - 中文翻译
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  addSentence: (sentenceData, target = 'sentences') => {
    console.log('【句子API】调用 addSentence:', { sentenceData, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'add',
        sentence: sentenceData.text, // 使用text作为ID基础
        sentenceData,
        target,
      }),
    }).catch(error => {
      console.error('添加句子失败:', error);
      return { flag: 0, message: '添加句子失败', content: null };
    });
  },
  
  /**
   * 更新句子
   * @param {string} sentenceId - 句子ID
   * @param {object} sentenceData - 更新的句子数据
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  updateSentenceById: (sentenceId, sentenceData, target = 'sentences') => {
    console.log('【句子API】调用 updateSentenceById:', { sentenceId, sentenceData, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'update',
        sentence: sentenceId,
        sentenceData,
        target,
      }),
    }).catch(error => {
      console.error('更新句子失败:', error);
      return { flag: 0, message: '更新句子失败', content: null };
    });
  },
  
  /**
   * 删除句子
   * @param {string} sentenceId - 句子ID
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  deleteSentence: (sentenceId, target = 'sentences') => {
    console.log('【句子API】调用 deleteSentence:', { sentenceId, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'delete',
        sentence: sentenceId,
        target,
      }),
    }).catch(error => {
      console.error('删除句子失败:', error);
      return { flag: 0, message: '删除句子失败', content: null };
    });
  },
  
  /**
   * 重置句子统计
   * @param {string} sentenceId - 句子ID
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  resetStats: (sentenceId, target = 'sentences') => {
    console.log('【句子API】调用 resetStats:', { sentenceId, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'reset_stats',
        sentence: sentenceId,
        target,
      }),
    }).catch(error => {
      console.error('重置统计失败:', error);
      return { flag: 0, message: '重置统计失败', content: null };
    });
  },
  
  /**
   * 增加正确次数
   * @param {string} sentenceId - 句子ID
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  incrementCorrect: (sentenceId, target = 'sentences') => {
    console.log('【句子API】调用 incrementCorrect:', { sentenceId, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'increment_correct',
        sentence: sentenceId,
        target,
      }),
    }).catch(error => {
      console.error('增加正确次数失败:', error);
      return { flag: 0, message: '增加正确次数失败', content: null };
    });
  },
  
  /**
   * 增加错误次数
   * @param {string} sentenceId - 句子ID
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  incrementWrong: (sentenceId, target = 'sentences') => {
    console.log('【句子API】调用 incrementWrong:', { sentenceId, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'increment_wrong',
        sentence: sentenceId,
        target,
      }),
    }).catch(error => {
      console.error('增加错误次数失败:', error);
      return { flag: 0, message: '增加错误次数失败', content: null };
    });
  },
  
  /**
   * 增加抽取次数
   * @param {string} sentenceId - 句子ID
   * @param {object} sentenceData - 句子数据（当句子不存在时使用）
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  increment: (sentenceId, sentenceData = null, target = 'sentences') => {
    console.log('【句子API】调用 increment:', { sentenceId, sentenceData, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'increment',
        sentence: sentenceId,
        sentenceData,
        target,
      }),
    }).catch(error => {
      console.error('增加抽取次数失败:', error);
      return { flag: 0, message: '增加抽取次数失败', content: null };
    });
  },
  
  /**
   * 更新句子统计（练习结果）- 组合多个操作
   * @param {string} sentenceId - 句子ID
   * @param {object} stats - 统计数据
   * @param {boolean} stats.correct - 是否正确
   * @param {boolean} stats.wrong - 是否错误
   * @param {boolean} stats.extraction - 是否抽取
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  updateStats: (sentenceId, stats, target = 'sentences') => {
    console.log('【句子API】调用 updateStats:', { sentenceId, stats, target });
    
    // 由于服务端不支持组合操作，我们分别调用各个API
    const promises = [];
    
    if (stats.correct) {
      promises.push(sentenceApi.incrementCorrect(sentenceId, target));
    }
    if (stats.wrong) {
      promises.push(sentenceApi.incrementWrong(sentenceId, target));
    }
    if (stats.extraction) {
      promises.push(sentenceApi.increment(sentenceId, null, target));
    }
    
    return Promise.all(promises).then(results => {
      // 检查是否有失败的结果
      const hasError = results.some(r => r.flag === 0);
      if (hasError) {
        return { flag: 0, message: '部分操作失败', content: results };
      }
      return { flag: 1, message: '更新成功', content: results };
    }).catch(error => {
      console.error('更新统计失败:', error);
      return { flag: 0, message: '更新统计失败', content: null };
    });
  },
  
  /**
   * 标记句子为已掌握
   * @param {string} sentenceId - 句子ID
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  markAsMastered: (sentenceId, target = 'sentences') => {
    console.log('【句子API】调用 markAsMastered:', { sentenceId, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'mark_mastered',
        sentence: sentenceId,
        target,
      }),
    }).catch(error => {
      console.error('标记句子失败:', error);
      return { flag: 0, message: '标记失败', content: null };
    });
  },
  
  /**
   * 标记句子为未掌握
   * @param {string} sentenceId - 句子ID
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  markAsUnmastered: (sentenceId, target = 'sentences') => {
    console.log('【句子API】调用 markAsUnmastered:', { sentenceId, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'mark_unmastered',
        sentence: sentenceId,
        target,
      }),
    }).catch(error => {
      console.error('取消标记失败:', error);
      return { flag: 0, message: '取消标记失败', content: null };
    });
  },
  
  /**
   * 批量添加句子
   * @param {array} sentences - 句子列表
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  batchAddSentences: (sentences, target = 'sentences') => {
    console.log('【句子API】调用 batchAddSentences:', { sentencesCount: sentences?.length, target });
    
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'batch_add',
        sentences: sentences,
        target,
      }),
    }).catch(error => {
      console.error('批量添加句子失败:', error);
      return { flag: 0, message: '批量添加句子失败', content: { addedCount: 0, total: sentences?.length || 0, ids: [] } };
    });
  },
  
  /**
   * 批量删除句子
   * @param {array} sentenceIds - 句子ID列表
   * @param {string} target - 目标文件名 (默认: "sentences")
   */
  batchDeleteSentences: (sentenceIds, target = 'sentences') => {
    console.log('【句子API】调用 batchDeleteSentences:', { sentenceIdsCount: sentenceIds?.length, target });
    return apiRequest('/update_sentence_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'batch_delete',
        sentences: sentenceIds,
        target,
      }),
    }).catch(error => {
      console.error('批量删除句子失败:', error);
      return { flag: 0, message: '批量删除句子失败', content: { deletedCount: 0, total: sentenceIds?.length || 0 } };
    });
  },
  
  /**
   * 获取句子列表
   * GET /get_sentence_review/:filename?
   * @param {string} filename - 文件名 (默认: "sentences")
   * @param {object} params - 查询参数 (可选)
   */
  getSentences: (filename = 'sentences', params = {}) => {
    console.log('【句子API】调用 getSentences:', { filename, params });
    
    // 构建URL，文件名作为路径参数
    let url = `/get_sentence_review/${filename}`;
    
    // 添加查询参数（如果有）
    const queryParams = new URLSearchParams(params).toString();
    if (queryParams) {
      url += '?' + queryParams;
    }
    
    return apiRequest(url, {
      method: 'GET',
    }).catch(error => {
      console.error('获取句子列表失败:', error);
      return { flag: 0, message: '获取句子列表失败', content: { sentences: {} } };
    });
  },
  
  /**
   * 获取用户 personal_sentence_review 文件夹中的所有文件列表
   * GET /get_sentence_files
   */
  getSentenceFiles: () => {
    console.log('【句子API】调用 getSentenceFiles');
    return apiRequest('/get_sentence_files', {
      method: 'GET',
    }).catch(error => {
      console.error('获取文件列表失败:', error);
      return { flag: 0, message: '获取文件列表失败', content: { files: [] } };
    });
  },
  
  /**
   * 健康检查
   */
  healthCheck: () => {
    console.log('【句子API】调用 healthCheck');
    return apiRequest('/sentence/health', {
      method: 'GET',
    }).catch(error => {
      console.error('健康检查失败:', error);
      return { flag: 0, message: '健康检查失败', content: null };
    });
  },
};

// 单词相关 API (保持不变)
export const wordApi = {
  // 获取单词列表
  getWords: (type = 'word_pepa.json', params = {}) => {
    const url = type.endsWith('.json') ? type : type + '.json';
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/get_review/${url}${queryParams ? '?' + queryParams : ''}`, {
      method: 'GET',
    });
  },
  
  // 更新单词
  updateWord: (data) => {
    return apiRequest('/update_word_review', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 添加单词
  addWord: (word, wordData, target = 'word_pepa') => {
    return apiRequest('/update_word_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'add',
        word,
        wordData,
        target,
      }),
    });
  },
  
  // 删除单词
  deleteWord: (word, target = 'word_pepa') => {
    return apiRequest('/update_word_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'delete',
        word,
        target,
      }),
    });
  },
  
  // 增加正确次数
  incrementCorrect: (word, target = 'word_pepa') => {
    return apiRequest('/update_word_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'increment_correct',
        word,
        target,
      }),
    });
  },
  
  // 增加错误次数
  incrementWrong: (word, target = 'word_pepa') => {
    return apiRequest('/update_word_review', {
      method: 'POST',
      body: JSON.stringify({
        type: 'increment_wrong',
        word,
        target,
      }),
    });
  },
};

// 用户相关 API (保持不变)
export const userApi = {
  // 登录
  login: (credentials) => {
    return fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    }).then(res => res.json());
  },
  
  // 注册
  register: (userData) => {
    return fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    }).then(res => res.json());
  },
};

export default {
  sentence: sentenceApi,
  word: wordApi,
  user: userApi,
};