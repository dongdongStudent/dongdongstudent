import axios from 'axios';
import { G_config, getToken } from '../config.js';
import { message } from 'antd';
// import { R_audio_src_3 } from '../6_my_md/redux/set_div/1_store.js';

// 注册账号
export function F_post_register(server_address, username, password, confirmPassword) {
  const url = server_address + '/api/register';
  console.log('F_post_register:请求地址:', url);

  return new Promise((resolve, reject) => {
    axios.post(url, {
      username: username,
      password: password,
      repeat_password: confirmPassword  // 根据你后端的字段名，可能是 confirmPassword 或 repeat_password
    })
    .then((response) => {
      console.log('F_post_register:注册响应:', response.data);
      
      if (response.data && response.data.flag === 1) {
        // 注册成功
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
        // 注册失败
        resolve({
          success: false,
          message: response.data.message || '注册失败'
        });
      }
    })
    .catch((error) => {
      console.error("F_post_register:网络请求错误:", error);
      
      // 根据错误类型返回不同的错误信息
      let errorMessage = '网络请求失败';
      if (error.response) {
        // 服务器返回了错误状态码
        errorMessage = `服务器错误: ${error.response.status}`;
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
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
        resolve(response.data); // 返回成功,返回数据
      })
      .catch((error) => {
        console.error("F_login:网络请求错误:", error);
      });
  });
}

// 1_1 文本-数据库-翻译,当有新单词的时候,还会更新个人生涯单词
export function F_translator(word, server_address = G_config.G_server_address, token = getToken()) {
  // 先判断word是不是一个单词, 如果不是, 则返回null
  if (/^[a-zA-Z]+$/.test(word)) {
    // F_post_personal_add_me_word_index(server_address, token, word)
  }
  // 判断是否有中文,有就返回
  if (/[\u4e00-\u9fa5]/.test(word)) {
    return new Promise((resolve, reject) => {
      resolve(''); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_translator:网络请求错误:", error);
      });
  });
}
// 1_2. 文本-js
export function get_video_list(server_address, token, path) { // 获取视频列表
  return new Promise((resolve, reject) => {
    axios.post(server_address + '/personal/video_list', {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("get_video_list:网络请求错误:", error);
      });
  });
}
// 1_4_1. 文本-js-生涯单词-获取 ------------------ 生涯单词
export function F_get_me_word_list_js(server_address = G_config.G_server_address, token = getToken()) {
  const path = server_address + '/personal/me_word_index'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_me_word_list_js:网络请求错误:", error);
      });
  });
}
function F_post_personal_add_me_word_index(server_address, token, word) { // 2. 增加权重
  const path = server_address + '/personal/add_me_word_index'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_post_personal_add_me_word_index:网络请求错误:", error);
      });
  });
}
export function F_post_down_word_unfamiliarity_weight(server_address, token, word) { // 3. 降低权重
  const path = server_address + '/personal/down_word_unfamiliarity_weight'

  return new Promise((resolve, reject) => {
    axios.post(path, {
      headers: {
        content: word,
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_post_personal_add_me_word_index:网络请求错误:", error);
      });
  });
}
// 1_5_1. 文本-js-生词-获取 ------------------------ 生词
export function F_get_unfamily_word_index(server_address, token) {
  const path = server_address + '/personal/unfamily_word_index'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}
// 1_6_1. 文本-js-生词-获取 ------------------------ 生词
export function F_get_teacher_word_index(server_address, token) {
  const path = server_address + '/personal/teacher_word_index'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}

// -------------------- 个人信息 --------------------
export function F_get_personal_name(server_address = G_config.G_server_address, token = getToken()) { // 获取姓名
  const path = server_address + '/personal/name'

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_personal_string:网络请求错误:", error);
        message.error("请先登录!");
      });
  });
}



// 新增：停止所有语音播放
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

  // 同时停止当前的全局音频
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

// 新增：停止特定语音（根据文本）
export function stopSpeakByText(text) {
  // 如果有文本匹配逻辑可以在这里实现
  // 当前版本停止所有
  stopAllSpeak();
}
let currentAudio = null;
const activeAudioInstances = new Set();
const audioCachePool = new Map();
// 原来的 F_speak 函数
export const F_speak = (function() {
  let currentAudio = null;
  const activeAudioInstances = new Set();
  const audioCachePool = new Map();
  
  return function(word, server_address = G_config.G_server_address) {
    // 1. 先进行文本处理
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
        : "";

    console.log('F_speak--------------------', processedWord);

    const stopCurrent = () => {
      if (currentAudio) {
        currentAudio.onended = null;
        currentAudio.onerror = null;
        try {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        } catch (e) {
          // 忽略暂停时的异常
        }
      }
    };

    return new Promise((resolve, reject) => {
      const playAndListen = (audioObj) => {
        stopCurrent();
        currentAudio = audioObj;
        currentAudio.volume = 1.0;

        // 新增：添加到活动实例集合
        activeAudioInstances.add(audioObj);

        // 清理函数
        const cleanup = () => {
          activeAudioInstances.delete(audioObj);
        };

        currentAudio.onended = () => {
          cleanup();
          resolve(1);
        };

        currentAudio.onerror = () => {
          cleanup();
          // reject(new Error('音频播放失败'));
        };

        const playPromise = currentAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            cleanup();
            if (error.name === 'AbortError') {
              // 正常的中断，不报错
              resolve(0);
            } else {
              console.error("播放失败:", error);
              // reject(error);
            }
          });
        }
      };

      if (audioCachePool.has(processedWord)) {
        const cachedUrl = audioCachePool.get(processedWord);
        playAndListen(new Audio(cachedUrl));
        return;
      }

      const path = server_address + '/resource/translate_mp3';
      axios.get(path, {
        headers: { content: processedWord },
        responseType: 'arraybuffer',
        timeout: 4000
      }).then((response) => {
        let blob = new Blob([response.data], { type: 'audio/mpeg' });
        let url = window.URL.createObjectURL(blob);
        audioCachePool.set(processedWord, url);
        playAndListen(new Audio(url));
      }).catch((error) => {
        console.error("F_Speak 网络错误:", error);
        resolve(0);
      });
    });
  };
})();
export function F_stop_audio() {
  if (currentAudio) {
    currentAudio.pause(); // 暂停当前音频
    currentAudio.currentTime = 0; // 重置播放时间
    currentAudio = null; // 清空当前音频
  }
}

// 3. 视频-src -------------------视频--------------------
export function F_get_video_source_src(server_address, token, name) { // 获取视频
  const path = `${server_address}/personal/video_path?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content.src); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}
// 视频字幕
export function F_get_video_subtitle_src(server_address, token, name) { // 获取视频

  const path = `${server_address}/personal/video_subtitle_path?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {

      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 4. 字幕-srt
export const fetchSRT = async (data) => { // 5. 读取字幕文件
  const parseSRT = (data) => { // 解析字幕数据,赋值给subtitles_1
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

  let G_sub_time = 0; // 字幕开始时间
  try {
    // const response = await fetch(path);

    // // 检查响应是否成功
    // if (!response.ok) {
    //     throw new Error(`网络错误：${response.status}`);
    // }

    // const text = await data.text();

    const parsedSubtitles = parseSRT(data);

    return parsedSubtitles;
  } catch (error) {
    console.error('读取字幕失败', error); // 打印错误信息
  }
};

// 5. -------------------个人笔记本--------------------
export function F_get_notebook(server_address, token, name) { // 获取笔记本


  const path = `${server_address}/personal/notebook_path?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;
  console.log('notebook_path', path);
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {

      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}

// 6. ------------------- 管理员 -------------------
export function F_get_student_info_list(server_address = G_config.G_server_address, token = getToken()) { // 获取笔记本

  const path = `${server_address}/admin/student_info_list`
  console.log('notebook_path', path);
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}
export function F_get_student_progress(name, server_address = G_config.G_server_address, token = getToken()) { // 获取笔记本

  const path = `${server_address}/admin/student_progress?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 更新学生进度
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
        resolve(response.data); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}
export function F_get_progress_template(server_address = G_config.G_server_address, token = getToken()) { // 获取模板

  const path = `${server_address}/admin/progress_template`
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_personal_progress:网络请求错误:", error);
      });
  });
}
export function F_post_upload_video(file, file_path, video_name, server_address = G_config.G_server_address, token = getToken()) { // 上传视频
  const path = `${server_address}/admin/upload_video`;

  const formData = new FormData();
  formData.append('video', file); // 确保字段名与服务器端一致
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
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        resolve(response.data.content)
      }
    })
      .catch((error) => {
        console.error("F_post_upload_video: 网络请求错误:", error);
        reject(error); // 捕获错误并拒绝 Promise
      });
  });
}

// ESS
export function F_get_template(name) { // 获取模板

  let server_address = G_config.G_server_address
  let token = getToken()
  const path = `${server_address}/resource/template?js_name=${encodeURIComponent(name)}`;
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
        name: name, // 添加name作为请求头
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}

// 删除视频
export function F_post_delete_video(personal_file_path, video_name, server_address = G_config.G_server_address, token = getToken()) { // 删除视频
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
        resolve(response.data); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_post_delete_video: 网络请求错误:", error);
      });
  });
}
// 7. ------------------- 给定目录,返回一个图片数量 -------------------
export function F_get_image_count(m_path, server_address = G_config.G_server_address, token = getToken()) { // 获取模板
  const path = `${server_address}/resource/get_image_count?path=${encodeURIComponent(m_path)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}
// 8. ------------------- 获取md -------------------
export function F_get_md(name, server_address = G_config.G_server_address, token = getToken()) { // 获取笔记本
  const path = `${server_address}/resource/get_md?video_name=${encodeURIComponent(name)}&server_address=${encodeURIComponent(server_address)}`;
  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.flag); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_personage_progress:网络请求错误:", error);
      });
  });
}
// 10. ------------------- 上传图片 -------------------
export function F_post_upload_image_base64(file_path, base64Image, server_address = G_config.G_server_address, token = getToken()) {

  // console.log('11111111111file_path', file_path, 'base64Image', base64Image);

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
        resolve(response.data.flag); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
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
        resolve(response.data.flag); // 返回成功,返回数据
      } else {
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("F_get_personage_progress:网络请求错误:", error);
      });
  });

}
// 11. ------------------- 给定一个path,返回该目录的子目录,以数组形式返回 -------------------
export function F_get_file_name(m_path, server_address = G_config.G_server_address, token = getToken()) { // 获取模板
  const path = `${server_address}/resource/get_file_name?path=${encodeURIComponent(m_path)}`;

  return new Promise((resolve, reject) => {
    axios.get(path, {
      headers: {
        Authorization: token,
      }
    }).then((response) => {
      if (response.data.flag === 1) {
        resolve(response.data.content); // 返回成功,返回数据
      } else {
        console.log('没有获取数据');
        resolve(null); // 返回成功,返回数据
      }
    })
      .catch((error) => {
        console.error("fun_12:网络请求错误:", error);
      });
  });
}


// ==================== 阅读进度相关API ====================

// 保存阅读进度
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

// 获取阅读进度
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

// 获取阅读历史记录（用于个人信息页面显示）
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

// 更新单词翻译
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