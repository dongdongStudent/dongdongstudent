import React, { useState, useEffect } from 'react';
import { message } from 'antd';
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

// ==================== 句子相关 API ====================
const sentenceApi = {
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

  // 更新最新回答时间
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

  // 添加句子
  addSentence: (sentenceData, target = 'sentences') => {
    return apiRequest.post('/update_sentence_review', {
      type: 'add',
      sentence: sentenceData.text,
      sentenceData,
      target
    });
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
const wordApi = {
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
const userApi = {
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

// ==================== 模态框样式 ====================
const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1100
  },
  container: {
    backgroundColor: 'white', borderRadius: '12px',
    width: '800px', maxHeight: '85vh', overflow: 'auto',
    padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px'
  },
  title: { margin: 0, fontSize: '20px', color: '#333' },
  closeButton: {
    width: '32px', height: '32px', borderRadius: '16px',
    border: 'none', backgroundColor: '#e0e0e0',
    cursor: 'pointer', fontSize: '16px'
  },
  content: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' },
  cancelButton: {
    padding: '10px 24px', backgroundColor: '#e0e0e0', color: '#666',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px'
  },
  errorBox: {
    padding: '10px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '6px',
    fontSize: '14px',
    whiteSpace: 'pre-line'
  },
  previewBox: {
    backgroundColor: '#f5f5f5',
    padding: '10px',
    borderRadius: '6px',
    marginTop: '10px',
    fontSize: '13px',
    border: '1px solid #e0e0e0',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  previewTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    backgroundColor: '#f5f5f5',
    padding: '5px 0',
    zIndex: 1
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: 'white',
    marginBottom: '5px',
    borderRadius: '4px'
  },
  previewText: {
    flex: 1,
    fontSize: '13px'
  },
  previewEnglish: {
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: '3px'
  },
  previewChinese: {
    color: '#FF9800',
    fontSize: '12px'
  },
  addButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    marginLeft: '10px',
    minWidth: '60px'
  },
  addAllButton: {
    background: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  statsBox: {
    backgroundColor: '#e3f2fd',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '10px',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px',
    flexWrap: 'wrap'
  },
  categoryTab: {
    padding: '8px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  categoryStats: {
    display: 'flex',
    gap: '15px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  categoryStatItem: {
    flex: 1,
    textAlign: 'center',
    padding: '8px',
    borderRadius: '6px'
  },
  responseButtons: {
    display: 'flex',
    gap: '5px',
    marginTop: '5px'
  },
  understoodButton: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  difficultButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  loadingBox: {
    textAlign: 'center',
    padding: '20px',
    color: '#666'
  },
  serverBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    marginLeft: '10px'
  }
};

// ==================== API 常量 - 个人学习服务器 ====================
const PERSONAL_API_BASE = 'https://www.ddstudent.xyz/server/english/sync_peppa_learning';

// ==================== 自定义 Hook：从个人学习服务器获取数据 ====================
const usePersonalLearningData = () => {
  const loadFromServer = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.error('未找到登录token');
        return null;
      }

      const res = await fetch(PERSONAL_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ type: 'get_peppa_data' })
      });
      console.log('1111111111111', res)

      if (res.ok) {
        const data = await res.json();
        return data.flag === 1 ? data.content : null;
      }
    } catch (err) {
      console.error("从个人学习服务器加载失败:", err);
    }
    return null;
  };

  return { loadFromServer };
};

// ==================== 添加句子弹窗组件 ====================
const AddSentenceModal = ({
  onClose,
  onAdd,
  allSentences = [],
  episodes = [],
  getToken
}) => {
  const [selectedEpisode, setSelectedEpisode] = useState('');
  const [episodeData, setEpisodeData] = useState(null);
  const [parsedSentences, setParsedSentences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedToLibrary, setAddedToLibrary] = useState(new Set()); // 记录已添加到句子库的句子ID
  const [serverSentences, setServerSentences] = useState(new Set()); // 服务器上已存在的句子文本集合
  const [addingAll, setAddingAll] = useState(false);

  const { loadFromServer } = usePersonalLearningData();

  const [personalLearningData, setPersonalLearningData] = useState({
    understoodSentences: [],
    difficultSentences: []
  });
  const [loadingPersonalData, setLoadingPersonalData] = useState(false);

  const [sentenceCategories, setSentenceCategories] = useState(new Map());
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [defaultCategory, setDefaultCategory] = useState('unmarked');

  // 在 AddSentenceModal 组件内部，现有代码的基础上添加
  useEffect(() => {
    const fetchPersonalData = async () => {
      setLoadingPersonalData(true);
      try {
        const data = await loadFromServer();
        if (data) {
          // 假设返回的数据格式包含 understoodSentences 和 difficultSentences
          setPersonalLearningData({
            understoodSentences: data.understoodSentences || [],
            difficultSentences: data.difficultSentences || []
          });
          console.log('个人学习数据加载成功:', data);
        }
      } catch (error) {
        console.error('加载个人学习数据失败:', error);
      } finally {
        setLoadingPersonalData(false);
      }
    };

    fetchPersonalData();
  }, []); // 空依赖数组，组件挂载时执行一次

  // 加载服务器上已存在的句子
  const loadServerSentences = async () => {
    try {
      const result = await sentenceApi.getSentences('sentences', { limit: 1000 });
      console.log('加载服务器句子列表:', result);

      if (result && result.sentences) {
        const sentences = result.sentences;
        const serverTexts = new Set();

        // 遍历对象中的所有句子，收集文本
        for (const key in sentences) {
          if (sentences.hasOwnProperty(key)) {
            const sentence = sentences[key];
            if (sentence.text) {
              serverTexts.add(sentence.text.toLowerCase().trim());
            }
          }
        }

        setServerSentences(serverTexts);
        console.log(`服务器上现有 ${serverTexts.size} 个句子`);
      }
    } catch (err) {
      console.error('加载服务器句子失败:', err);
    }
  };

  // 组件加载时获取服务器句子
  useEffect(() => {
    loadServerSentences();
  }, []);

  // 当选择的剧集变化时，解析该剧集的句子并标记已在服务器上的句子
  useEffect(() => {
    if (!selectedEpisode) {
      setEpisodeData(null);
      setParsedSentences([]);
      setSentenceCategories(new Map());
      return;
    }

    const episode = episodes.find(ep => ep.episode_id === parseInt(selectedEpisode));
    if (episode && episode.sentences) {
      setEpisodeData(episode);

      const sentences = episode.sentences.map(s => ({
        id: s.sentence_id,
        english: s.text,
        chinese: s.chinese || '',
        episodeId: episode.episode_id
      }));

      setParsedSentences(sentences);
      setError('');

      // 标记已在服务器上的句子
      const initialAdded = new Set();
      sentences.forEach(s => {
        if (serverSentences.has(s.english.toLowerCase().trim())) {
          initialAdded.add(s.id);
        }
      });
      setAddedToLibrary(initialAdded);

      // 根据个人学习数据初始化分类状态
      const initialCategories = new Map();

      personalLearningData.understoodSentences.forEach(s => {
        if (s.episodeId === episode.episode_id) {
          initialCategories.set(s.id, 'understood');
        }
      });

      personalLearningData.difficultSentences.forEach(s => {
        if (s.episodeId === episode.episode_id) {
          initialCategories.set(s.id, 'difficult');
        }
      });

      setSentenceCategories(initialCategories);
    } else {
      setEpisodeData(null);
      setParsedSentences([]);
      setError('该剧集没有句子数据');
    }
  }, [selectedEpisode, episodes, personalLearningData, serverSentences]);

  const generateLocalId = () => {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  };

  const toggleSentenceCategory = (sentenceId, category) => {
    setSentenceCategories(prev => {
      const newMap = new Map(prev);
      if (prev.get(sentenceId) === category) {
        newMap.delete(sentenceId);
      } else {
        newMap.set(sentenceId, category);
      }
      return newMap;
    });
  };

  const getFilteredSentences = () => {
    if (selectedCategory === 'all') {
      return parsedSentences;
    }

    return parsedSentences.filter(sentence => {
      const category = sentenceCategories.get(sentence.id);
      if (selectedCategory === 'understood') {
        return category === 'understood';
      } else if (selectedCategory === 'difficult') {
        return category === 'difficult';
      } else if (selectedCategory === 'unmarked') {
        return !category;
      }
      return true;
    });
  };

  const getUnaddedCountInCurrentCategory = () => {
    const filtered = getFilteredSentences();
    return filtered.filter(s => !addedToLibrary.has(s.id)).length;
  };

  const getCategoryStats = () => {
    const stats = {
      all: { total: parsedSentences.length, unadded: 0 },
      understood: { total: 0, unadded: 0 },
      difficult: { total: 0, unadded: 0 },
      unmarked: { total: 0, unadded: 0 }
    };

    parsedSentences.forEach(sentence => {
      const category = sentenceCategories.get(sentence.id);
      const added = addedToLibrary.has(sentence.id);

      if (category === 'understood') {
        stats.understood.total++;
        if (!added) stats.understood.unadded++;
      } else if (category === 'difficult') {
        stats.difficult.total++;
        if (!added) stats.difficult.unadded++;
      } else {
        stats.unmarked.total++;
        if (!added) stats.unmarked.unadded++;
      }

      if (!added) stats.all.unadded++;
    });

    return stats;
  };

  const isAddedToLibrary = (sentenceId) => {
    return addedToLibrary.has(sentenceId);
  };

  const playSentenceAudio = (text) => {
    try {
      if (window.F_speak) {
        window.F_speak(text);
      } else {
        import("../Function/weisimin.js").then(module => {
          module.F_speak(text);
        });
      }
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  };

  const handleAddSentenceToLibrary = async (sentence) => {
    setLoading(true);
    setError('');

    try {
      // 再次检查句子是否已存在于服务器（防止并发添加）
      if (serverSentences.has(sentence.english.toLowerCase().trim())) {
        message.warning(`⚠️ 句子 "${sentence.english}" 已存在于句子库中`);
        setAddedToLibrary(prev => new Set(prev).add(sentence.id));
        setLoading(false);
        return;
      }

      const sentenceData = {
        text: sentence.english,
        chinese: sentence.chinese,
        episode_id: parseInt(selectedEpisode),
        pass: false,
        correct_count: 0,
        wrong_count: 0,
        extraction_count: 0,
        last_answer_time: new Date().toISOString()
      };

      console.log('准备添加到句子库服务器:', sentenceData);

      const result = await sentenceApi.addSentence(sentenceData, 'sentences');

      console.log('句子库服务器返回:', result);

      if (result && result.flag === 1) {
        // 更新本地状态
        setAddedToLibrary(prev => new Set(prev).add(sentence.id));
        setServerSentences(prev => new Set(prev).add(sentence.english.toLowerCase().trim()));

        message.success(`✅ 句子已添加到句子库`);

        if (onAdd) {
          await onAdd({
            ...sentenceData,
            id: result.id || generateLocalId()
          });
        }
      } else {
        throw new Error(result?.message || '添加失败');
      }
    } catch (err) {
      console.error('添加到句子库失败:', err);
      setError(`添加失败: ${err.message}`);
      message.error(`❌ 添加到句子库失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllInCurrentCategory = async () => {
    const sentencesToAdd = getFilteredSentences().filter(s => !addedToLibrary.has(s.id));

    if (sentencesToAdd.length === 0) {
      message.info('当前分类下没有可添加到句子库的句子');
      return;
    }

    setAddingAll(true);
    setError('');
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;

    try {
      // 过滤出服务器上不存在的句子
      const newSentences = sentencesToAdd.filter(s => {
        const exists = serverSentences.has(s.english.toLowerCase().trim());
        if (exists) {
          console.log(`跳过重复句子: ${s.english}`);
          setAddedToLibrary(prev => new Set(prev).add(s.id));
          duplicateCount++;
        }
        return !exists;
      });

      if (newSentences.length === 0) {
        message.info(`所有 ${duplicateCount} 个句子都已存在于句子库中`);
        setAddingAll(false);
        return;
      }

      const dataToAdd = newSentences.map(sentence => ({
        text: sentence.english,
        chinese: sentence.chinese,
        episode_id: parseInt(selectedEpisode),
        pass: false,
        correct_count: 0,
        wrong_count: 0,
        extraction_count: 0,
        last_answer_time: new Date().toISOString()
      }));

      console.log(`准备批量添加到句子库 (${newSentences.length}个新句子, ${duplicateCount}个重复):`, dataToAdd);

      const result = await sentenceApi.batchAddSentences(dataToAdd, 'sentences');

      console.log('批量添加到句子库返回:', result);

      if (result && result.flag === 1) {
        // 更新本地状态
        const newTexts = newSentences.map(s => s.english.toLowerCase().trim());

        newSentences.forEach(s => {
          setAddedToLibrary(prev => new Set(prev).add(s.id));
        });

        setServerSentences(prev => {
          const newSet = new Set(prev);
          newTexts.forEach(text => newSet.add(text));
          return newSet;
        });

        successCount = newSentences.length;

        const categoryName =
          selectedCategory === 'understood' ? '听懂' :
            selectedCategory === 'difficult' ? '听不懂' :
              selectedCategory === 'unmarked' ? '未标记' : '全部';

        if (duplicateCount > 0) {
          message.success(`✅ 成功添加 ${successCount} 个${categoryName}句子到句子库（${duplicateCount}个重复已跳过）`);
        } else {
          message.success(`✅ 成功添加 ${successCount} 个${categoryName}句子到句子库`);
        }

        if (onAdd) {
          for (const sentence of dataToAdd) {
            await onAdd({
              ...sentence,
              id: generateLocalId()
            });
          }
        }
      } else {
        message.info('批量添加失败，尝试单个添加...');

        for (let i = 0; i < newSentences.length; i++) {
          const sentence = newSentences[i];
          const sentenceData = dataToAdd[i];

          try {
            const singleResult = await sentenceApi.addSentence(sentenceData, 'sentences');
            if (singleResult && singleResult.flag === 1) {
              setAddedToLibrary(prev => new Set(prev).add(sentence.id));
              setServerSentences(prev => new Set(prev).add(sentence.english.toLowerCase().trim()));
              successCount++;
            } else {
              failCount++;
            }
          } catch (err) {
            console.error('单个添加失败:', sentenceData.text, err);
            failCount++;
          }
        }

        if (successCount > 0) {
          const categoryName =
            selectedCategory === 'understood' ? '听懂' :
              selectedCategory === 'difficult' ? '听不懂' :
                selectedCategory === 'unmarked' ? '未标记' : '全部';

          if (duplicateCount > 0) {
            message.success(`✅ 成功添加 ${successCount} 个${categoryName}句子到句子库（${duplicateCount}个重复已跳过）`);
          } else {
            message.success(`✅ 成功添加 ${successCount} 个${categoryName}句子到句子库`);
          }
        }
        if (failCount > 0) {
          message.warning(`⚠️ ${failCount} 个句子添加失败`);
        }
      }
    } catch (err) {
      console.error('批量添加到句子库失败:', err);
      setError('批量添加失败：' + err.message);
    } finally {
      setAddingAll(false);
    }
  };

  const filteredSentences = getFilteredSentences();
  const stats = getCategoryStats();
  const unaddedInCurrent = getUnaddedCountInCurrentCategory();

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.container}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>
            📖 从剧集添加句子到句子库
            <span style={{
              ...modalStyles.serverBadge,
              backgroundColor: '#e3f2fd',
              color: '#1976D2'
            }}>
              句子库服务器
            </span>
          </h3>
          {/* 操作按钮 */}
          <div style={modalStyles.actions}>
            <button onClick={onClose} style={modalStyles.cancelButton}>关闭</button>
          </div>
        </div>

        <div style={modalStyles.content}>
          {loadingPersonalData && (
            <div style={modalStyles.loadingBox}>
              正在从个人学习服务器加载数据...
            </div>
          )}

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>选择剧集 *</label>
            <select
              value={selectedEpisode}
              onChange={(e) => setSelectedEpisode(e.target.value)}
              style={modalStyles.select}
            >
              <option value="">请选择剧集</option>
              {episodes.map(ep => (
                <option key={ep.episode_id} value={ep.episode_id}>
                  {ep.title} ({ep.sentences?.length || 0}句)
                </option>
              ))}
            </select>
          </div>

          {!loadingPersonalData && (
            <div style={modalStyles.categoryStats}>
              <div style={{ ...modalStyles.categoryStatItem, backgroundColor: '#e3f2fd' }}>
                <div style={{ fontWeight: 'bold', color: '#1976D2' }}>
                  📊 个人学习记录
                  <span style={{
                    ...modalStyles.serverBadge,
                    backgroundColor: '#1976D2',
                    color: 'white',
                    fontSize: '9px'
                  }}>
                    仅显示
                  </span>
                </div>
                <div style={{ fontSize: '14px' }}>
                  听懂: {personalLearningData.understoodSentences.length}<br />
                  听不懂: {personalLearningData.difficultSentences.length}
                </div>
              </div>
            </div>
          )}

          {episodeData && (
            <div style={modalStyles.categoryStats}>
              <div style={{ ...modalStyles.categoryStatItem, backgroundColor: '#e3f2fd' }}>
                <div style={{ fontWeight: 'bold', color: '#1976D2' }}>📊 总计</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{parsedSentences.length}</div>
                <div style={{ fontSize: '12px' }}>待添加: {stats.all.unadded}</div>
              </div>
              <div style={{ ...modalStyles.categoryStatItem, backgroundColor: '#e8f5e9' }}>
                <div style={{ fontWeight: 'bold', color: '#2E7D32' }}>✅ 听懂</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.understood.total}</div>
                <div style={{ fontSize: '12px' }}>待添加: {stats.understood.unadded}</div>
              </div>
              <div style={{ ...modalStyles.categoryStatItem, backgroundColor: '#ffebee' }}>
                <div style={{ fontWeight: 'bold', color: '#C62828' }}>❌ 听不懂</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.difficult.total}</div>
                <div style={{ fontSize: '12px' }}>待添加: {stats.difficult.unadded}</div>
              </div>
              <div style={{ ...modalStyles.categoryStatItem, backgroundColor: '#f5f5f5' }}>
                <div style={{ fontWeight: 'bold', color: '#757575' }}>⚪ 未标记</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.unmarked.total}</div>
                <div style={{ fontSize: '12px' }}>待添加: {stats.unmarked.unadded}</div>
              </div>
            </div>
          )}

          {episodeData && (
            <div style={modalStyles.statsBox}>
              <div>
                <strong>📊 剧集信息</strong>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  标题: {episodeData.title}<br />
                  句子总数: {episodeData.sentences.length}句<br />
                  已存在于服务器: {addedToLibrary.size}句
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '12px'
                  }}
                >
                  <option value="unmarked">默认不加标记</option>
                  <option value="understood">默认标记为听懂</option>
                  <option value="difficult">默认标记为听不懂</option>
                </select>
                <button
                  onClick={handleAddAllInCurrentCategory}
                  disabled={addingAll || unaddedInCurrent === 0}
                  style={{
                    ...modalStyles.addAllButton,
                    opacity: (addingAll || unaddedInCurrent === 0) ? 0.5 : 1,
                    cursor: (addingAll || unaddedInCurrent === 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {addingAll ? '添加中...' :
                    unaddedInCurrent === 0 ? '无可添加' :
                      `添加到句子库 (${unaddedInCurrent}句)`}
                </button>
              </div>
            </div>
          )}

          {parsedSentences.length > 0 && (
            <div style={modalStyles.categoryTabs}>
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  ...modalStyles.categoryTab,
                  backgroundColor: selectedCategory === 'all' ? '#8b5cf6' : '#e0e0e0',
                  color: selectedCategory === 'all' ? 'white' : '#333'
                }}
              >
                全部 ({parsedSentences.length})
                {stats.all.unadded > 0 && (
                  <span style={{
                    marginLeft: '5px',
                    backgroundColor: selectedCategory === 'all' ? 'white' : '#8b5cf6',
                    color: selectedCategory === 'all' ? '#8b5cf6' : 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}>
                    +{stats.all.unadded}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedCategory('understood')}
                style={{
                  ...modalStyles.categoryTab,
                  backgroundColor: selectedCategory === 'understood' ? '#4CAF50' : '#e0e0e0',
                  color: selectedCategory === 'understood' ? 'white' : '#333'
                }}
              >
                ✅ 听懂 ({stats.understood.total})
                {stats.understood.unadded > 0 && (
                  <span style={{
                    marginLeft: '5px',
                    backgroundColor: selectedCategory === 'understood' ? 'white' : '#4CAF50',
                    color: selectedCategory === 'understood' ? '#4CAF50' : 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}>
                    +{stats.understood.unadded}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedCategory('difficult')}
                style={{
                  ...modalStyles.categoryTab,
                  backgroundColor: selectedCategory === 'difficult' ? '#f44336' : '#e0e0e0',
                  color: selectedCategory === 'difficult' ? 'white' : '#333'
                }}
              >
                ❌ 听不懂 ({stats.difficult.total})
                {stats.difficult.unadded > 0 && (
                  <span style={{
                    marginLeft: '5px',
                    backgroundColor: selectedCategory === 'difficult' ? 'white' : '#f44336',
                    color: selectedCategory === 'difficult' ? '#f44336' : 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}>
                    +{stats.difficult.unadded}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedCategory('unmarked')}
                style={{
                  ...modalStyles.categoryTab,
                  backgroundColor: selectedCategory === 'unmarked' ? '#9e9e9e' : '#e0e0e0',
                  color: selectedCategory === 'unmarked' ? 'white' : '#333'
                }}
              >
                ⚪ 未标记 ({stats.unmarked.total})
                {stats.unmarked.unadded > 0 && (
                  <span style={{
                    marginLeft: '5px',
                    backgroundColor: selectedCategory === 'unmarked' ? 'white' : '#9e9e9e',
                    color: selectedCategory === 'unmarked' ? '#9e9e9e' : 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}>
                    +{stats.unmarked.unadded}
                  </span>
                )}
              </button>
            </div>
          )}

          {parsedSentences.length > 0 && (
            <div style={modalStyles.previewBox}>
              <div style={modalStyles.previewTitle}>
                <span>
                  📋 句子列表
                  ({filteredSentences.length}句
                  {unaddedInCurrent > 0 && `，可添加到句子库 ${unaddedInCurrent} 句`})
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  已存在于服务器: {addedToLibrary.size} 句
                </span>
              </div>

              {filteredSentences.map((sentence) => {
                const added = isAddedToLibrary(sentence.id);
                const category = sentenceCategories.get(sentence.id);

                return (
                  <div key={sentence.id} style={{
                    ...modalStyles.previewItem,
                    backgroundColor: added ? '#e8f5e9' :
                      category === 'understood' ? '#e8f5e9' :
                        category === 'difficult' ? '#ffebee' : 'white',
                    border: category === 'understood' ? '1px solid #4CAF50' :
                      category === 'difficult' ? '1px solid #f44336' : 'none',
                    opacity: added ? 0.8 : 1
                  }}>
                    <div style={modalStyles.previewText}>
                      <div style={modalStyles.previewEnglish}>
                        <span
                          style={{ cursor: 'pointer' }}
                          onClick={() => playSentenceAudio(sentence.english)}
                          title="点击播放音频"
                        >
                          🔊 {sentence.english}
                        </span>
                        {added && (
                          <span style={{
                            marginLeft: '8px',
                            color: '#4CAF50',
                            fontSize: '11px',
                            backgroundColor: '#e8f5e9',
                            padding: '2px 6px',
                            borderRadius: '12px'
                          }}>
                            ✓ 已在服务器
                          </span>
                        )}
                      </div>
                      {sentence.chinese && (
                        <div style={modalStyles.previewChinese}>中文: {sentence.chinese}</div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddSentenceToLibrary(sentence)}
                      disabled={loading || added}
                      style={{
                        ...modalStyles.addButton,
                        backgroundColor: added ? '#9e9e9e' : '#4CAF50',
                        opacity: (loading || added) ? 0.5 : 1,
                        cursor: (loading || added) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {added ? '已在服务器' : '添加到句子库'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div style={modalStyles.errorBox}>
              {error}
            </div>
          )}

          <div style={modalStyles.actions}>
            <button onClick={onClose} style={modalStyles.cancelButton}>关闭</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSentenceModal;