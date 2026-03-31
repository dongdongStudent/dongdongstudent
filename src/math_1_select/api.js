// math_1_select/api.js
// 数学选择题API - 完全服务器获取版
// 参考英语选择题库实现，全部从服务器获取数据

import { G_config } from '../config.js';

const serverAddress = G_config.G_server_address;

// 获取题库列表 - 完全从服务器获取
export const getMathBanks = async () => {
  try {
    // 从服务器获取最新题库列表
    const response = await fetch(`${serverAddress}/math/banks`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const serverData = await response.json();
    
    if (serverData.flag === 1) {
      return serverData;
    } else {
      throw new Error(serverData.message || '获取题库列表失败');
    }
  } catch (error) {
    console.error('从服务器获取数学题库列表失败:', error);
    
    // 服务器失败时返回空数据
    return {
      flag: 0,
      message: '服务器连接失败',
      content: {
        banks: []
      }
    };
  }
};

// 获取完整题库（全部题目，不在后端筛选）
export const getFullBankQuestions = async (bankId = 'math_master') => {
  try {
    const response = await fetch(`${serverAddress}/math/bank/questions?bank=${bankId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const serverData = await response.json();
    
    if (serverData.flag === 1) {
      return serverData;
    } else {
      throw new Error(serverData.message || '获取题目失败');
    }
  } catch (error) {
    console.error('从服务器获取完整数学题库失败:', error);
    return {
      flag: 0,
      message: '服务器连接失败',
      content: {
        questions: [],
        stats: {
          totalQuestions: 0,
          masteredCount: 0,
          weakCount: 0,
          newCount: 0
        }
      }
    };
  }
};

// 获取所有题目 - 完全从服务器获取（智能抽取）
export const getMasterQuestions = async (bankId = 'math_master', type = 'smart', count = 10) => {
  try {
    // 从服务器获取题目
    const response = await fetch(`${serverAddress}/math/questions?bank=${bankId}&type=${type}&count=${count}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const serverData = await response.json();
    
    if (serverData.flag === 1) {
      return serverData;
    } else {
      throw new Error(serverData.message || '获取题目失败');
    }
  } catch (error) {
    console.error('从服务器获取数学题目失败:', error);
    
    // 服务器失败时返回空数据
    return {
      flag: 0,
      message: '服务器连接失败',
      content: {
        questions: [],
        stats: {
          totalQuestions: 0,
          masteredCount: 0,
          weakCount: 0,
          newCount: 0
        }
      }
    };
  }
};

// 提交测试结果
export const submitTestResult = async (testData) => {
  try {
    const response = await fetch(`${serverAddress}/math/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('提交测试结果失败:', error);
    
    // 服务器失败时返回模拟数据
    return {
      flag: 0,
      message: '服务器连接失败',
      content: {
        results: [],
        summary: {
          total: 0,
          correct: 0,
          wrong: 0,
          accuracy: 0
        }
      }
    };
  }
};

// 转换数学数据为题目格式
const convertMathDataToQuestions = (mathData) => {
  const questions = [];
  let questionId = 1;
  
  // 遍历所有年级
  mathData.grades.forEach(grade => {
    // 遍历所有单元
    grade.units.forEach(unit => {
      // 遍历所有知识点
      unit.knowledgePoints.forEach(knowledgePoint => {
        // 遍历所有题目
        knowledgePoint.data.forEach(questionData => {
          // 将选项从数组转换为对象格式，使用A、B、C、D作为label
          const options = questionData.options.map((option, index) => ({
            id: index.toString(),
            label: String.fromCharCode(65 + index), // A, B, C, D
            text: option
          }));
          
          // 将正确答案从字母转换为索引
          const correctAnswerIndex = questionData.correctAnswer.charCodeAt(0) - 65; // A->0, B->1, C->2, D->3
          
          questions.push({
            id: questionId.toString(),
            question: questionData.question,
            options: options,
            answer: String.fromCharCode(65 + correctAnswerIndex), // 转换为A、B、C、D
            explanation: questionData.explanation || `正确答案是${questionData.correctAnswer}。`,
            category: unit.name,
            difficulty: questionData.difficulty || 'medium',
            tags: questionData.tags || [],
            stats: {
              total_attempts: 0,
              correct_attempts: 0,
              mastery_level: 0
            },
            metadata: {
              grade: grade.name,
              unit: unit.name,
              knowledgePoint: knowledgePoint.name,
              originalId: questionData.id
            }
          });
          
          questionId++;
        });
      });
    });
  });
  
  return questions;
};

// 生成模拟数学题目
const generateMockMathQuestions = () => {
  const questions = [];
  const categories = ['代数', '几何', '算术', '概率', '统计'];
  const difficulties = ['简单', '中等', '困难'];
  
  for (let i = 1; i <= 25; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    questions.push({
      id: i.toString(),
      question: `数学题目 ${i}: 计算 ${Math.floor(Math.random() * 100)} + ${Math.floor(Math.random() * 100)} 的结果是多少？`,
      options: [
        `${Math.floor(Math.random() * 200)}`,
        `${Math.floor(Math.random() * 200)}`,
        `${Math.floor(Math.random() * 200)}`,
        `${Math.floor(Math.random() * 200)}`
      ],
      answer: Math.floor(Math.random() * 4).toString(), // 0-3
      explanation: `这是第 ${i} 道数学题的答案解析。`,
      category: category,
      difficulty: difficulty,
      stats: {
        total_attempts: Math.floor(Math.random() * 10),
        correct_attempts: Math.floor(Math.random() * 10),
        mastery_level: Math.random()
      }
    });
  }
  
  return questions;
};

export const mathApi = {
  getBanks: getMathBanks,
  getMasterQuestions: getMasterQuestions,
  getFullBankQuestions: getFullBankQuestions,  // 新增
  submitTestResult: submitTestResult
};