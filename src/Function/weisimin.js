import axios from 'axios';
import { G_config, getToken } from '../config.js';
import { message } from 'antd';

// 注册账号
export function F_post_register(server_address, username, password, confirmPassword) {
  const url = server_address + '/api/register';
  console.log('F_post_register:请求地址:', url);

  return new Promise((resolve, reject) => {
    axios.post(url, {
      username: username,
      password: password,
      repeat_password: confirmPassword
    })
    .then((response) => {
      console.log('F_post_register:注册响应:', response.data);
      
      if (response.data && response.data.flag === 1) {
        resolve({
          success: true,
          user: response.data.user || {
            id: response.data.id,
            name: username,
            email: response.data.email || `${username}@example.com`,
            joinDate: new Date().toISOString().split('T')[0],
            username: username
          },
          message: response.data.message || '注册成功'
        });
      } else {
        resolve({
          success: false,
          message: response.data.message || '注册失败'
        });
      }
    })
    .catch((error) => {
      console.error("F_post_register:网络请求错误:", error);
      
      let errorMessage = '网络请求失败';
      if (error.response) {
        errorMessage = `服务器错误: ${error.response.status}`;
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = '网络连接失败，请检查服务器状态';
      }
      
      reject(new Error(errorMessage));
    });
  });
}

// 登录账号,返回token
export function F_post_login_token(server_address, username, password) {
  const a = server_address + '/api/login'
  console.log('F_login:请求地址:', a);

  return new Promise((resolve, reject) => {
    axios.post(a, {
      username: username,
      password: password,
    })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.error("F_login:网络请求错误:", error);
      });
  });
}

// 1_1 文本-数据库-翻译
export function F_translator(word, server_address = G_config.G_server_address, token = getToken()) {
  if (/^[a-zA-Z]+$/.test(word)) {
    // F_post_personal_add_me_word_index(server_address, token, word)
  }
  if (/[\u4e00-\u9fa5]/.test(word)) {
    return new Promise((resolve, reject) => {
      resolve('');
    });
  }

  const path = server_address + '/resource/translate_word';

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        content: word,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_translator:网络请求错误:", error);
      });
  });
}

// 1_2. 文本-js
export function get_video_list(server_address, token, path) {
  return new Promise((resolve, reject) => {
    axios.post(server_address + '/personal/video_list', {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 1_3. 文本-js-获取个人学习知识点进度
export function F_get_progress_js(server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/personal/progress'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        server_address: server_address,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("get_video_list:网络请求错误:", error);
      });
  });
}

// 获取总进度
export function F_get_total_progress_js(server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/resource/total_progress'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        server_address: server_address,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("get_video_list:网络请求错误:", error);
      });
  });
}

// 1_4_1. 文本-js-生涯单词-获取
export function F_get_me_word_list_js(server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/personal/me_word_index'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_me_word_list_js:网络请求错误:", error);
      });
  });
}

function F_post_personal_add_me_word_index(server_address, token, word) {
  const path = server_address + '/personal/add_me_word_index'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_post_personal_add_me_word_index:网络请求错误:", error);
      });
  });
}

export function F_post_down_word_unfamiliarity_weight(server_address, token, word) {
  const path = server_address + '/personal/down_word_unfamiliarity_weight'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_post_personal_add_me_word_index:网络请求错误:", error);
      });
  });
}

// 1_5_1. 文本-js-生词-获取
export function F_get_unfamily_word_index(server_address, token) {
  const path = server_address + '/personal/unfamily_word_index'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("unfamily_word_index:网络请求错误:", error);
      });
  });
}

// 1_5_2. 文本-js-生词-删除
export function F_post_personal_del_unfamily_word_index(server_address, token, word) {
  const path = server_address + '/personal/del_unfamily_word_index'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_post_personal_del_unfamily_word_index:网络请求错误:", error);
      });
  });
}

// 1_5_3. 文本-js-生词-添加
export function F_post_personal_add_unfamily_word_index(server_address, token, word) {
  const path = server_address + '/personal/add_unfamily_word_index'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}

// 1_6_1. 文本-js-生词-获取
export function F_get_teacher_word_index(server_address, token) {
  const path = server_address + '/personal/teacher_word_index'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("unfamily_word_index:网络请求错误:", error);
      });
  });
}

// 1_6_2. 文本-js-生词-删除
export function F_post_personal_del_teacher_word_index(server_address, token, word) {
  const path = server_address + '/personal/del_teacher_word_index'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_post_personal_del_unfamily_word_index:网络请求错误:", error);
      });
  });
}

// 1_6_3. 文本-js-生词-添加
export function F_post_personal_add_teacher_word_index(server_address, token, word) {
  const path = server_address + '/personal/add_teacher_word_index'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}

// 1_7_1. 文本-js-语文生词-获取
export function F_get_chinese_words(server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/personal/chinese_words'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("unfamily_word_index:网络请求错误:", error);
      });
  });
}

// 1_7_2. 文本-js-语文生词-删除
export function F_post_personal_del_chinese_word(server_address, token, word) {
  const path = server_address + '/personal/del_chinese_word'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_post_personal_del_unfamily_word_index:网络请求错误:", error);
      });
  });
}

// 1_7_3. 文本-js-语文生词-添加
export function F_post_personal_add_chinese_word(server_address, token, word) {
  const path = server_address + '/personal/add_chinese_word'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}

// -------------------- 个人信息 --------------------
export function F_get_personal_name(server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/personal/name'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personal_string:网络请求错误:", error);
        message.error("请先登录!");
      });
  });
}

// ==================== 音频相关变量 ====================
let currentAudio = null;
const activeAudioInstances = new Set();
const memoryCache = new Map(); // 内存缓存，存储 Blob 对象

// ==================== IndexedDB 本地持久化缓存 ====================
const DB_NAME = 'AudioCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_cache';
let dbInstance = null;

// 初始化 IndexedDB
function initAudioDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB 打开失败:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'word' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('音频缓存表创建成功');
      }
    };
  });
}

// 保存音频到 IndexedDB
async function saveAudioToCache(word, audioBlob) {
  try {
    const db = await initAudioDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const cacheData = {
      word: word,
      blob: audioBlob,
      timestamp: Date.now(),
      type: 'audio/mpeg'
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(cacheData);
      request.onsuccess = () => {
        console.log(`音频已缓存到 IndexedDB: ${word}`);
        resolve(true);
      };
      request.onerror = (event) => {
        console.error(`缓存失败: ${word}`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('保存音频到缓存失败:', error);
    return false;
  }
}

// 从 IndexedDB 获取音频
async function getAudioFromCache(word) {
  try {
    const db = await initAudioDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(word);
      request.onsuccess = (event) => {
        const result = event.target.result;
        if (result && result.blob) {
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = (event) => {
        console.error(`从 IndexedDB 获取失败: ${word}`, event.target.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('从 IndexedDB 获取音频失败:', error);
    return null;
  }
}

// 清除所有缓存
export async function clearAllAudioCache() {
  try {
    // 清除内存缓存
    memoryCache.clear();
    console.log('内存缓存已清除');
    
    // 清除 IndexedDB
    const db = await initAudioDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('IndexedDB 音频缓存已清除');
        resolve(true);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('清除缓存失败:', error);
    return false;
  }
}

// 获取缓存统计
export async function getAudioCacheStats() {
  try {
    const db = await initAudioDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => {
        resolve({
          memoryCount: memoryCache.size,
          indexedDBCount: request.result,
          memoryKeys: Array.from(memoryCache.keys())
        });
      };
      request.onerror = () => {
        resolve({
          memoryCount: memoryCache.size,
          indexedDBCount: 0,
          memoryKeys: Array.from(memoryCache.keys())
        });
      };
    });
  } catch (error) {
    return {
      memoryCount: memoryCache.size,
      indexedDBCount: 0,
      memoryKeys: Array.from(memoryCache.keys())
    };
  }
}

// 停止所有语音播放
export function stopAllSpeak() {
  activeAudioInstances.forEach(audio => {
    try {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
    } catch (e) {
      // 忽略错误
    }
  });
  activeAudioInstances.clear();

  if (currentAudio) {
    try {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {
      // 忽略错误
    }
    currentAudio = null;
  }
}

export function stopSpeakByText(text) {
  stopAllSpeak();
}

export function F_stop_audio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// 修复后的 F_speak 函数 - 支持本地持久化缓存
export const F_speak = (function() {
  // 清理单个音频实例
  const cleanupAudio = (audio) => {
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.onended = null;
        audio.onerror = null;
        audio.oncanplaythrough = null;
      } catch (e) {
        console.warn('清理音频时出错:', e);
      }
      activeAudioInstances.delete(audio);
    }
  };
  
  // 停止所有正在播放的音频
  const stopAllAudio = () => {
    activeAudioInstances.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        // 忽略错误
      }
    });
    activeAudioInstances.clear();
    
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {
        // 忽略错误
      }
      currentAudio = null;
    }
  };
  
  // 从 Blob 创建并播放音频
  const playFromBlob = (blob, processedWord, resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    // 设置音频属性
    audio.volume = 1.0;
    audio.preload = 'auto';
    
    // 播放完成后释放 URL
    audio.onended = () => {
      URL.revokeObjectURL(url);
      cleanupAudio(audio);
      resolve(1);
    };
    
    audio.onerror = (error) => {
      console.error('音频播放错误:', error, processedWord);
      URL.revokeObjectURL(url);
      cleanupAudio(audio);
      reject(new Error('音频播放失败'));
    };
    
    // 停止所有正在播放的音频
    stopAllAudio();
    
    // 设置当前音频
    currentAudio = audio;
    activeAudioInstances.add(audio);
    
    // 重置并播放
    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("播放失败:", error, processedWord);
          cleanupAudio(audio);
          
          if (error.name === 'NotAllowedError') {
            reject(new Error('用户未与页面交互，请先点击页面任意位置'));
          } else if (error.name === 'AbortError') {
            resolve(0);
          } else {
            reject(error);
          }
        });
      }
    } catch (error) {
      console.error('播放音频异常:', error);
      cleanupAudio(audio);
      reject(error);
    }
  };
  
  return function(word, server_address = G_config.G_server_address) {
    // 文本处理
    let processedWord = word ? word
        .replace(/：/g, ":")
        .replace(/。/g, ".")
        .replace(/，/g, ",")
        .replace(/？/g, "")
        .replace(/！/g, "!")
        .replace(/；/g, ";")
        .replace(/[‘’]/g, "'")
        .replace(/"/g, "'")
        .replace(/”/g, "'")
        .replace(/\//g, "")
        .replace(/\?/g, "")
        .replace(/!/g, "")
        .replace(/’/g, "'")
        .trim() : "";

    // 空文本或无效文本直接返回
    if (!processedWord) {
      return Promise.resolve(0);
    }

    return new Promise(async (resolve, reject) => {
      // 1. 先检查内存缓存
      if (memoryCache.has(processedWord)) {
        const cachedBlob = memoryCache.get(processedWord);
        console.log('从内存缓存播放:', processedWord);
        playFromBlob(cachedBlob, processedWord, resolve, reject);
        return;
      }
      
      // 2. 检查 IndexedDB 缓存
      try {
        const cachedBlob = await getAudioFromCache(processedWord);
        if (cachedBlob) {
          // 同时保存到内存缓存，下次更快
          memoryCache.set(processedWord, cachedBlob);
          playFromBlob(cachedBlob, processedWord, resolve, reject);
          return;
        }
      } catch (error) {
        console.warn('读取 IndexedDB 缓存失败:', error);
      }
      
      // 3. 从服务器获取
      console.log('从服务器获取音频:', processedWord);
      const path = server_address + '/resource/translate_mp3';
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        reject(new Error('音频加载超时'));
      }, 10000);
      
      axios.get(path, {
        headers: { content: processedWord },
        responseType: 'arraybuffer',
        timeout: 10000
      }).then(async (response) => {
        clearTimeout(timeoutId);
        
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        
        // 保存到内存缓存
        memoryCache.set(processedWord, blob);
        
        // 异步保存到 IndexedDB（不阻塞播放）
        saveAudioToCache(processedWord, blob).catch(err => {
          console.warn('保存到 IndexedDB 失败:', err);
        });
        
        // 播放音频
        playFromBlob(blob, processedWord, resolve, reject);
        
      }).catch((error) => {
        clearTimeout(timeoutId);
        console.error("F_Speak 网络错误:", error, processedWord);
        
        if (error.code === 'ECONNABORTED') {
          reject(new Error('网络超时，请检查连接'));
        } else {
          reject(new Error('网络请求失败'));
        }
      });
    });
  };
})();

// 3. 视频-src -------------------视频--------------------
export function F_get_video_source_src(server_address, token, name) {
  const path = `${server_address}/personal/video_path?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content.src);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 视频字幕
export function F_get_video_subtitle_src(server_address, token, name) {
  const path = `${server_address}/personal/video_subtitle_path?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 4. 字幕-srt
export const fetchSRT = async (data) => {
  const parseSRT = (data) => {
    const convertToSeconds = (time) => {
      const parts = time.split(':');
      const seconds = parseFloat(parts[2].replace(',', '.'));
      return (+parts[0]) * 3600 + (+parts[1]) * 60 + seconds;
    };
    const lines = data.split('\n');
    const subtitles = [];
    let index = 0;
    let num = 0;

    while (index < lines.length) {
      if (lines[index].trim() === '') {
        index++;
        continue;
      }

      if (!/^\d+$/.test(lines[index].trim())) {
        index++;
        continue;
      }

      const startEnd = lines[index + 1]?.split(' --> ');
      if (!startEnd || startEnd.length !== 2) {
        index += 4;
        continue;
      }

      const start = convertToSeconds(startEnd[0]) + G_sub_time;
      const end = convertToSeconds(startEnd[1]) + G_sub_time;
      const text = lines[index + 2] || '';
      const key = num;

      subtitles.push({ text, start, end, key });
      index += 4;
      num++;
    }

    return subtitles;
  };

  let G_sub_time = 0;
  try {
    const parsedSubtitles = parseSRT(data);
    return parsedSubtitles;
  } catch (error) {
    console.error('读取字幕失败', error);
  }
};

// 5. -------------------个人笔记本--------------------
export function F_get_notebook(server_address, token, name) {
  const path = `${server_address}/personal/notebook_path?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;
  console.log('notebook_path', path);
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

export function F_post_save_notebook(server_address, token, word) {
  const path = server_address + '/personal/save_notebook'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}

// 6. ------------------- 管理员 -------------------
export function F_get_student_info_list(server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/admin/student_info_list`
  console.log('notebook_path', path);
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

export function F_get_student_progress(name, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/admin/student_progress?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

export function F_post_update_student_progress(content, currentUser, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/admin/update_student_progress`
  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: content,
        currentUser: currentUser,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}

export function F_get_progress_template(server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/admin/progress_template`
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

export function F_post_create_student_progress(content, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/admin/create_student_progress`

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        test: '123',
        content: content,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}

export function F_post_upload_video(file, file_path, video_name, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/admin/upload_video`;

  const formData = new FormData();
  formData.append('video', file);
  console.log('file_path', file_path, 'video_name', video_name);

  return new Promise((resolve, reject) => {
    axios.post(path, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        file_path: file_path,
        video_name: video_name,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        resolve(response.data.content)
      }
    })
      .catch((error) => {
        console.error("F_post_upload_video: 网络请求错误:", error);
        reject(error);
      });
  });
}

// ESS
export function F_get_template(name) {
  let server_address = G_config.G_server_address
  let token = getToken()
  const path = `${server_address}/resource/template?js_name=${encodeURIComponent(name)}`;
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
        name: name,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 删除视频
export function F_post_delete_video(personal_file_path, video_name, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/admin/delete_video`;

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        personal_file_path: personal_file_path,
        video_name: video_name,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_post_delete_video: 网络请求错误:", error);
      });
  });
}

// 7. ------------------- 给定目录,返回一个图片数量 -------------------
export function F_get_image_count(m_path, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/resource/get_image_count?path=${encodeURIComponent(m_path)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 8. ------------------- 获取md -------------------
export function F_get_md(name, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/resource/get_md?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 9. ------------------- 保存md -------------------
export function F_save_md(file_path, md, server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/resource/save_md'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        file_path: file_path,
        content: md,
        server_address: server_address,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.flag);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personage_progress:网络请求错误:", error);
      });
  });
}

// 10. ------------------- 上传图片 -------------------
export function F_post_upload_image_base64(file_path, base64Image, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/resource/save_image`;
  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        file_path: file_path,
        content: base64Image,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.flag);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personage_progress:网络请求错误:", error);
      });
  });
}

// 11. orc_image_en
export function F_post_orc_image_en(base64Image, server_address = G_config.G_server_address, token = getToken()) {
  console.log('base64Image', base64Image);

  const path = `${server_address}/resource/orc_image_en`;
  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: base64Image,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.flag);
      } else {
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("F_get_personage_progress:网络请求错误:", error);
      });
  });
}

// 12. ------------------- 给定一个path,返回该目录的子目录,以数组形式返回 -------------------
export function F_get_file_name(m_path, server_address = G_config.G_server_address, token = getToken()) {
  const path = `${server_address}/resource/get_file_name?path=${encodeURIComponent(m_path)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content);
      } else {
        console.log('没有获取数据');
        resolve(null);
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// ==================== 阅读进度相关API ====================

export function F_save_reading_progress(server_address = G_config.G_server_address, token = getToken(), progressData) {
  const path = server_address + '/personal/save_reading_progress';

  return new Promise((resolve, reject) => {
    axios.post(path, {
      video_src: progressData.videoSrc,
      current_time: progressData.currentTime,
      current_sub_index: progressData.currentSubIndex,
      current_subtitle: progressData.currentSubtitle,
      total_subtitles: progressData.totalSubtitles,
      timestamp: progressData.timestamp
    }, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve({
          success: true,
          data: response.data.content
        });
      } else {
        resolve({
          success: false,
          message: response.data.message || '保存失败'
        });
      }
    })
      .catch((error) => {
        console.error("F_save_reading_progress:网络请求错误:", error);
        resolve({
          success: false,
          message: '网络请求失败'
        });
      });
  });
}

export function F_get_reading_progress(server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/personal/get_reading_progress';

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve({
          success: true,
          data: response.data.content
        });
      } else {
        resolve({
          success: false,
          message: response.data.message || '获取失败'
        });
      }
    })
      .catch((error) => {
        console.error("F_get_reading_progress:网络请求错误:", error);
        resolve({
          success: false,
          message: '网络请求失败'
        });
      });
  });
}

export function F_get_reading_history(server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/personal/get_reading_history';

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve({
          success: true,
          data: response.data.content
        });
      } else {
        resolve({
          success: false,
          message: response.data.message || '获取历史记录失败'
        });
      }
    })
      .catch((error) => {
        console.error("F_get_reading_history:网络请求错误:", error);
        resolve({
          success: false,
          message: '网络请求失败'
        });
      });
  });
}

export function F_update_word_translation(server_address = G_config.G_server_address, token = getToken(), word, newTranslation) {
  const path = server_address + '/resource/update_word_translation';

  return new Promise((resolve, reject) => {
    axios.post(path, {
      word: word,
      translation: newTranslation
    }, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(true);
      } else {
        resolve(false);
      }
    })
      .catch((error) => {
        console.error("F_update_word_translation:网络请求错误:", error);
        resolve(false);
      });
  });
}