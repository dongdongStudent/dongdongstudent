// utils/sentenceUtils.js

// 单词拆分函数
export const splitWords = (text) => {
  if (!text) return [];
  const words = text.match(/\b[\w'-]+\b/g) || [];
  return words;
};

// 随机打乱数组
export const shuffleArray = (array) => {
  const copy = [...array];
  return copy.sort(() => Math.random() - 0.5);
};

// 注入全局样式
let stylesInjected = false;

export const injectGlobalStyles = () => {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes sentenceCenterFall {
      0% { top: -10%; transform: translateX(0) rotate(0deg); }
      100% { top: 110%; transform: translateX(20px) rotate(360deg); }
    }
    @keyframes sentenceCenterGlow {
      0% { box-shadow: 0 0 20px rgba(255,215,0,0.3); }
      50% { box-shadow: 0 0 40px rgba(255,215,0,0.7); }
      100% { box-shadow: 0 0 20px rgba(255,215,0,0.3); }
    }
    @keyframes sentenceCenterBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes sentenceCenterSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(styleElement);
};