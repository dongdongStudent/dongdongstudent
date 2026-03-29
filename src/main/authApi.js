import axios from 'axios';
import { Message } from '../config';

/** 注册账号
 * 
 * @param {string} server_address 服务器地址
 * @param {string} username 用户名
 * @param {string} password 密码
 * @param {string} confirmPassword 确认密码
 * @returns {Promise} 注册结果
 */
export function F_post_register(server_address, username, password, confirmPassword) {
  const url = server_address + '/english/register';
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
        reject({
          success: false,
          message: '网络请求失败'
        });
      });
  });
}

/**登录账号
 * 
 * @param {string} server_address 服务器地址
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise} 登录结果
 */
export function F_post_login(server_address, username, password) {
  const url = server_address + '/english/login'; // 表示是使用json保存登录信息
  console.log('F_post_login:请求地址:', url);

  return new Promise((resolve, reject) => {
    axios.post(url, {
      username: username,
      password: password,
    })
      .then((response) => {
        // console.log('F_post_login:登录响应:', response.data);

        if (response.data && response.data.flag === 1) {
          const token = response.data.token || response.data.content;

          // ✅ 使用统一的 TOKEN_KEY 保存到本地
          if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            // console.log(`✅ Token已保存到 localStorage[${TOKEN_KEY}]`);
          }

          resolve({
            success: true,
            user: response.data.user,
            token: token,
            message: response.data.message || '登录成功'
          });
        } else {
          resolve({
            success: false,
            message: response.data.message || '登录失败'
          });
        }
      })
      .catch((error) => {
        console.error("F_post_login:网络请求错误:", error);
        reject({
          success: false,
          message: '网络请求失败'
        });
      });
  });
}

/**退出登录
 * 
 * @param {string} server_address 服务器地址
 * @param {string} token 用户token
 * @returns {Promise} 退出结果
 */
export function F_post_logout(server_address, token) {
  const url = server_address + '/api/json/logout';

  return new Promise((resolve, reject) => {
    axios.post(url, {}, {
      headers: {
        Authorization: token
      }
    })
      .then((response) => {
        resolve({
          success: response.data.flag === 1,
          message: response.data.message
        });
      })
      .catch((error) => {
        console.error("F_post_logout:网络请求错误:", error);
        reject({
          success: false,
          message: '网络请求失败'
        });
      });
  });
}

// -------------------
const TOKEN_KEY = 'geek_pc'//定义一个常量，用于存储令牌的键名

export const setToken = token => localStorage.setItem(TOKEN_KEY, token)//定义一个函数，用于存储令牌
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)
