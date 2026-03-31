import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal, { AuthService, UserAvatar, UserMenu } from './main/auth.js';
import { F_post_login, F_post_register } from './main/authApi.js';
import { getToken, clearToken } from "./config.js";
import Notebook from './notebook/notebook.js';
import { message } from "antd";


// ==================== 颜色主题配置 ====================
const THEME = {
  bg: '#0A0A0A',
  paper: '#121212',
  surface: '#1A1A1A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  accent: '#00B4FF',
  success: '#00CC88',
  warning: '#FFAA33',
  danger: '#FF6688',
  info: '#66BBFF',
  border: '#222222',
  borderLight: '#333333',
  borderActive: '#FFFFFF',

  // 模块专属色
  reading: '#4A9EFF',
  listening: '#AA77FF',
  vocabulary: '#33CC99',
  sentence: '#FFAA33',
  writing: '#FF6688',
  speaking: '#FFAA33',
};

// ==================== 样式配置 ====================
const styles = {
  wrapper: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: THEME.bg,
    color: THEME.textPrimary,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: THEME.paper,
    borderBottom: `1px solid ${THEME.border}`,
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: '8px',
  },

  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
    padding: '12px',
    overflow: 'auto',
  },

  panel: {
    backgroundColor: THEME.paper,
    borderRadius: '12px',
    border: `1px solid ${THEME.border}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'auto',
  },

  panelHeader: {
    padding: '12px 16px',
    borderBottom: `1px solid ${THEME.border}`,
    backgroundColor: THEME.surface,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  panelContent: {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    transition: 'all 0.3s ease',
  },
};

// ==================== 日历日期格子组件 ====================
const DateCell = ({
  day,
  isToday,
  isSelected,
  isCompleted,
  hasData,
  onClick
}) => {
  const getCellStyle = () => {
    const baseStyle = {
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontWeight: '600',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      position: 'relative',
      margin: '3px',
    };

    if (isToday) {
      return {
        ...baseStyle,
        backgroundColor: THEME.accent,
        color: '#000000',
        border: `2px solid ${THEME.accent}`,
        fontWeight: '700',
      };
    }

    if (isSelected) {
      return {
        ...baseStyle,
        backgroundColor: THEME.accent + '20',
        color: THEME.accent,
        border: `2px solid ${THEME.accent}`,
        fontWeight: '700',
      };
    }

    if (isCompleted) {
      return {
        ...baseStyle,
        backgroundColor: THEME.success + '15',
        color: THEME.success,
        border: `1px solid ${THEME.success}40`,
      };
    }

    if (hasData) {
      return {
        ...baseStyle,
        backgroundColor: THEME.info + '10',
        color: THEME.info,
        border: `1px solid ${THEME.info}20`,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: THEME.surface,
      color: THEME.textSecondary,
      border: `1px solid ${THEME.border}`,
    };
  };

  return (
    <div
      onClick={onClick}
      style={getCellStyle()}
      onMouseEnter={(e) => {
        if (!isToday && !isSelected && !isCompleted && !hasData) {
          e.currentTarget.style.backgroundColor = THEME.borderLight;
          e.currentTarget.style.borderColor = THEME.accent;
        }
      }}
      onMouseLeave={(e) => {
        if (!isToday && !isSelected && !isCompleted && !hasData) {
          e.currentTarget.style.backgroundColor = THEME.surface;
          e.currentTarget.style.borderColor = THEME.border;
        }
      }}
    >
      {day}
      {isCompleted && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: THEME.success,
        }} />
      )}
    </div>
  );
};

// ==================== 学习模块卡片组件 ====================
const ModuleCard = ({
  title,
  color,
  icon,
  description,
  completed,
  onClick,
  hasSubmenu = false,
  submodules = [],
  isExpanded = false,
  onToggleExpand,
  onSubmoduleClick // 新增：子菜单点击回调
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMainClick = (e) => {
    if (hasSubmenu) {
      e.stopPropagation();
      onToggleExpand && onToggleExpand();
    } else {
      onClick && onClick();
    }
  };

  const handleSubmoduleClick = (submodule, e) => {
    e.stopPropagation();
    onSubmoduleClick && onSubmoduleClick(submodule);
  };

  const cardStyle = {
    backgroundColor: THEME.paper,
    border: `1px solid ${isHovered || isExpanded ? color : THEME.border}`,
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transform: isHovered ? 'translateX(3px)' : 'none',
    backgroundColor: isHovered ? THEME.surface : THEME.paper,
  };

  return (
    <div>
      <div
        onClick={handleMainClick}
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '6px',
              backgroundColor: color + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
              fontSize: '17px',
              color: color,
            }}>
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2px',
                flexWrap: 'wrap',
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: THEME.textPrimary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {title}
                </h4>
                {completed && (
                  <div style={{
                    fontSize: '10px',
                    backgroundColor: THEME.success + '20',
                    color: THEME.success,
                    padding: '3px 6px',
                    borderRadius: '4px',
                    fontWeight: '600',
                    marginLeft: '8px',
                    flexShrink: 0,
                  }}>
                    已完成
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '11px',
                color: THEME.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {description}
              </div>
            </div>
          </div>
          {hasSubmenu && (
            <div style={{
              marginLeft: '8px',
              fontSize: '12px',
              color: color,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
            }}>
              ›
            </div>
          )}
        </div>
      </div>

      {/* 子模块列表 */}
      {hasSubmenu && isExpanded && submodules && submodules.length > 0 && (
        <div style={{
          marginLeft: '20px',
          marginBottom: '8px',
          borderLeft: `2px solid ${color}40`,
          paddingLeft: '16px',
        }}>
          {submodules.map((submodule) => (
            <div
              key={submodule.id}
              onClick={(e) => handleSubmoduleClick(submodule, e)}
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                paddingLeft: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = color + '10';
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = THEME.surface;
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '14px',
                color: color,
              }}>
                {submodule.icon}
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: THEME.textPrimary,
                  marginBottom: '2px',
                }}>
                  {submodule.title}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: THEME.textSecondary,
                }}>
                  {submodule.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== 全屏切换按钮组件 ====================
const FullscreenToggle = ({ isFullscreen, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      style={{
        backgroundColor: 'transparent',
        border: 'none',
        color: THEME.textPrimary,
        fontSize: '20px',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        marginLeft: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = THEME.surface;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={isFullscreen ? '退出全屏' : '进入全屏'}
    >
      {isFullscreen ? '📱' : '📲'}
    </button>


  );
};

// ==================== 主组件 ====================
const Main = () => {
  const navigate = useNavigate();

  // ==================== 状态管理 ====================
  const [selectedDate, setSelectedDate] = useState(15);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 新增：控制面板展开/折叠的状态
  const [expandedEnglish, setExpandedEnglish] = useState(true);  // 英语模块默认展开
  const [expandedMath, setExpandedMath] = useState(true);       // 数学模块默认展开

  // 服务器地址
  const server_address = "https://www.ddstudent.xyz/server";

  // 今日日期
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthName = today.toLocaleDateString('zh-CN', { month: 'long' });
  const currentYear = today.getFullYear();

  // ==================== 数据定义 ====================
  // 英语学习模块
  const englishModules = [
    {
      id: 'reading1',
      title: '小猪佩奇',
      color: THEME.reading,
      path: '/movie_pepa',
      icon: '📖',
      description: '观看动画学习英语',
      completed: false,
    },
    {
      id: 'reading2',
      title: '一天一阅读',
      color: THEME.reading,
      path: '/book',
      icon: '📖',
      description: '每日阅读练习',
      completed: false,
    },
    {
      id: 'personal_testng',
      title: '睡前听力',
      color: THEME.speaking,
      path: null,
      icon: '📋',
      description: '个性化测试和练习',
      completed: false,
      hasSubmenu: true,
      submodules: [
        {
          id: 'listening_spelling_test',
          title: '单元听力',
          color: THEME.speaking,
          path: '/listen',
          icon: '👂',
          description: '听句子，然后拼写',
        },
        {
          id: 'listening_spelling_test',
          title: '特殊词语',
          color: THEME.speaking,
          path: '/listen_2',
          icon: '👂',
          description: '听句子，然后拼写',
        },
        {
          id: 'listen_spelling',
          title: '特殊词语测试',
          color: THEME.sentence,
          path: '/listen_speed',
          icon: '👂',
          description: '听句子，然后拼写',
        },
      ]
    },
    {
      id: 'personal_testing',
      title: '课本知识点测试',
      color: THEME.speaking,
      path: null,
      icon: '📋',
      description: '个性化测试和练习',
      completed: false,
      hasSubmenu: true,
      submodules: [
        {
          id: 'listening_spelling_test',
          title: '课本单词',
          color: THEME.speaking,
          path: '/listen_3',
          icon: '👂',
          description: '听句子，然后拼写',
        },
        {
          id: 'listen_spelling',
          title: '听句子拼写',
          color: THEME.sentence,
          path: '/sentence_listen',
          icon: '👂',
          description: '听句子，然后拼写',
        }
      ]
    },
    // 英语选择题库测试
    {
      id: 'english_test_select',
      title: '英语选择题库',
      color: THEME.vocabulary, // 使用词汇模块的颜色 #33CC99
      path: null,
      icon: '📝',
      description: '智能选择练习，追踪掌握程度',
      completed: false,
      hasSubmenu: true,
      submodules: [
        {
          id: 'english_test_smart',
          title: '选择题',
          color: THEME.accent,
          path: '/english_test_select',
          icon: '🤖',
          description: '根据掌握程度智能推荐题目',
        },
        {
          id: 'english_test_cloze',
          title: '完形填空题',
          color: THEME.accent,
          path: '/english_test_cloze',
          icon: '📝',
          description: '完形填空练习',
        },
        {
          id: 'english_test_wordbank',
          title: '词汇变形',
          color: THEME.accent,
          path: '/english_test_wordbank',
          icon: '🔤',
          description: '词汇变形练习',
        },
        {
          id: 'english_test_CtoE',
          title: '中译英句子完成',
          color: THEME.accent,
          path: '/english_test_CtoE',
          icon: '🔄',
          description: '中文到英文句子完成练习',
        },
        {
          id: 'english_test_cloze_sentence',
          title: '句子完形填空',
          color: THEME.accent,
          path: '/english_test_cloze_sentence',
          icon: '📝',
          description: '句子完形填空练习',
        },
        {
          id: 'english_test_cloze_bank_select',
          title: '完形填空词汇选择',
          color: THEME.accent,
          path: '/english_test_cloze_bank_select',
          icon: '📚',
          description: '完形填空词汇选择练习',
        },
        {
          id: 'english_test_cloze_passage',
          title: '篇章完形填空',
          color: THEME.accent,
          path: '/english_test_cloze_passage',
          icon: '📖',
          description: '篇章完形填空练习',
        },
        {
          id: 'english_test_8_reading_comprehension',
          title: '阅读理解',
          color: THEME.accent,
          path: '/english_test_8_reading_comprehension',
          icon: '📚',
          description: '阅读理解练习',
        },
        {
          id: 'english_book_1_work',
          title: '英语书1作业',
          color: THEME.accent,
          path: '/english_book_1_work',
          icon: '📓',
          description: '英语书1作业练习',
        },
        {
          id: 'english_a_z',
          title: 'English A-Z',
          color: THEME.accent,
          path: '/english_a_z',
          icon: '🔤',
          description: 'English A-Z阅读学习',
        },
        {
          id: 'sentence_view',
          title: '句子复习',
          color: THEME.accent,
          path: '/sentence_view',
          icon: '📖',
          description: '句子复习中心',
        }
      ]
    },
    {
      id: 'teacher',
      title: '教师测试',
      color: THEME.grammar,
      path: '/book_senntence_test',
      icon: '🧑',
      description: '检测学生专用',
      completed: false,
    },
  ];

  // 数学学习模块
  const mathModules = [
    {
      id: 'math_test_select',
      title: '数学选择题库',
      color: '#4CAF50', // 绿色主题色
      path: '/math_test_select',
      icon: '🧮',
      description: '数学选择题练习，智能抽取',
      completed: false,
    }
  ];


  // ==================== 登录状态管理函数 ====================
  // 检查登录状态（组件加载时）
  useEffect(() => {
    const user = AuthService.checkAuth();
    if (user) {
      setCurrentUser(user);
    }

    // 检查当前是否在全屏状态
    const checkFullscreen = () => {
      const isFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('MSFullscreenChange', checkFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
      document.removeEventListener('MSFullscreenChange', checkFullscreen);
    };
  }, []);

  // ==================== 全屏切换函数 ====================
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // 进入全屏
        const element = document.documentElement;

        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
        setIsFullscreen(true);
        // 在移动设备上，隐藏地址栏等浏览器UI
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          // 设置viewport meta标签以支持全屏体验
          const metaViewport = document.querySelector('meta[name="viewport"]');
          if (metaViewport) {
            metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
          }

          // 隐藏滚动条
          document.body.style.overflow = 'hidden';

          // 添加防止误触的提示
          alert('已进入全屏模式，要退出全屏，请点击左上角图标或使用设备返回键。');
        }
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }

        setIsFullscreen(false);

        // 恢复移动设备的设置
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          const metaViewport = document.querySelector('meta[name="viewport"]');
          if (metaViewport) {
            metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
          }

          document.body.style.overflow = 'auto';
        }
      }
    } catch (error) {
      console.error('全屏切换失败:', error);

      // 如果标准全屏API失败，使用全屏CSS模拟
      if (!isFullscreen) {
        // 进入模拟全屏
        document.documentElement.style.position = 'fixed';
        document.documentElement.style.top = '0';
        document.documentElement.style.left = '0';
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        // 添加退出按钮
        if (!document.getElementById('fullscreen-exit-button')) {
          const exitButton = document.createElement('div');
          exitButton.id = 'fullscreen-exit-button';
          exitButton.innerHTML = '✕';
          exitButton.style.position = 'fixed';
          exitButton.style.top = '10px';
          exitButton.style.left = '10px';
          exitButton.style.width = '40px';
          exitButton.style.height = '40px';
          exitButton.style.backgroundColor = THEME.accent;
          exitButton.style.color = '#000';
          exitButton.style.borderRadius = '50%';
          exitButton.style.display = 'flex';
          exitButton.style.alignItems = 'center';
          exitButton.style.justifyContent = 'center';
          exitButton.style.fontSize = '20px';
          exitButton.style.fontWeight = 'bold';
          exitButton.style.cursor = 'pointer';
          exitButton.style.zIndex = '9999';
          exitButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
          exitButton.onclick = toggleFullscreen;
          document.body.appendChild(exitButton);
        }

        setIsFullscreen(true);
      } else {
        // 退出模拟全屏
        document.documentElement.style.position = '';
        document.documentElement.style.top = '';
        document.documentElement.style.left = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';

        // 移除退出按钮
        const exitButton = document.getElementById('fullscreen-exit-button');
        if (exitButton) {
          exitButton.remove();
        }

        setIsFullscreen(false);
      }
    }
  };

  // ==================== 登录注册相关函数 ====================
  // 主登录函数 - 仅使用后端API
  const handleLogin = async (username, password) => {
    setIsLoading(true);
    setAuthError('');
    try {
      // 调用后端登录API
      const result = await F_post_login(server_address, username, password);
      if (result.success) {
        // 保存token和用户信息
        if (result.token) {
          localStorage.setItem('token', result.token);
        }

        const userData = {
          ...result.user,
          username: username,
          joinDate: result.user.joinDate || new Date().toISOString().split('T')[0]
        };

        // 保存用户状态
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setCurrentUser(userData);
        setShowAuthModal(false);

        console.log('登录成功:', userData);
      } else {
        setAuthError(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录过程中出错:', error);
      setAuthError(error.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 注册函数 - 仅使用后端API
  const handleRegister = async (username, password, confirmPassword) => {
    setIsLoading(true);
    setAuthError('');

    try {
      // 调用后端注册API
      const result = await F_post_register(server_address, username, password, confirmPassword);

      if (result.success) {
        // 注册成功，自动登录
        if (result.token) {
          localStorage.setItem('token', result.token);
        }

        const userData = {
          ...result.user,
          username: username,
          joinDate: result.user.joinDate || new Date().toISOString().split('T')[0]
        };

        // 保存用户状态
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setCurrentUser(userData);
        setShowAuthModal(false);

        console.log('注册成功:', userData);
      } else {
        setAuthError(result.message || '注册失败');
      }
    } catch (error) {
      console.error('注册过程中出错:', error);
      setAuthError(error.message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 退出登录
  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setShowUserMenu(false);
    // 清理token
    clearToken();
    console.log('用户已退出登录');
  };

  const handleModuleClick = (module) => {
    if (module.path) {
      navigate(module.path);
    }
  };

  // 新增：子菜单点击处理
  const handleSubmoduleClick = (submodule) => {
    if (submodule.path) {
      navigate(submodule.path);
    }
  };

  const toggleModuleExpand = (moduleId) => {
    setExpandedModuleId(expandedModuleId === moduleId ? null : moduleId);
  };

  const handleUserAvatarClick = () => {
    if (currentUser) {
      setShowUserMenu(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const [showNotebook, setShowNotebook] = useState(false);
  const [notebookContext, setNotebookContext] = useState({
    initialText: '',
    videoContext: null,
  });

  // ==================== 主渲染 ====================
  return (
    <div style={{
      ...styles.wrapper,
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? '0' : 'auto',
      left: isFullscreen ? '0' : 'auto',
      width: isFullscreen ? '100vw' : '100%',
      height: isFullscreen ? '100vh' : '100vh',
      zIndex: isFullscreen ? 9999 : 'auto',
    }}>
      {/* 头部 */}
      <header style={styles.header}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '800',
            color: THEME.textPrimary,
            lineHeight: 1.2,
          }}>
            LINGO<span style={{ color: THEME.accent }}>FLOW</span>
          </h1>
          <div style={{
            fontSize: '12px',
            color: THEME.textSecondary,
            marginTop: '2px',
            fontWeight: '500',
          }}>
            {currentYear}年{currentMonthName}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '11px',
              color: THEME.textSecondary,
              fontWeight: '500',
            }}>
              {currentUser ? `欢迎, ${currentUser.name}` : '当前时间'}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: THEME.textPrimary,
            }}>
              {!currentUser && today.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {currentUser && '已登录'}
            </div>
          </div>

          {/* 全屏切换按钮 */}
          <FullscreenToggle
            isFullscreen={isFullscreen}
            onToggle={toggleFullscreen}
          />

          <button
            onClick={() => {
              // 先检测是否登录了

              setShowNotebook(!showNotebook);
              ;
            }}
            style={{
              backgroundColor: showNotebook ? "#9c27b0" : "#0e639c",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              marginTop: "5px"
            }}
          >
            {showNotebook ? '📓 关闭笔记本' : '📓 打开笔记本'}
          </button>

          {/* 用户头像 */}
          <div style={{ position: 'relative' }}>
            <UserAvatar
              user={currentUser}
              onClick={handleUserAvatarClick}
              disabled={isLoading}
            />
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: THEME.accent,
                animation: 'spin 1s linear infinite',
              }} />
            )}
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <div style={{
        ...styles.mainContent,
        height: isFullscreen ? 'calc(100vh - 60px)' : 'auto',
        overflow: isFullscreen ? 'auto' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>

        {/* 英语模块面板 - 可折叠 */}
        <div style={styles.panel}>
          <div 
            style={styles.panelHeader}
            onClick={() => setExpandedEnglish(!expandedEnglish)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#222222';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = THEME.surface;
            }}
          >
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '600',
                color: THEME.textPrimary,
              }}>
                📚 英语模块
              </h3>
              <div style={{
                fontSize: '11px',
                color: THEME.textSecondary,
                marginTop: '3px',
                fontWeight: '500',
              }}>
                {englishModules.length}个模块
              </div>
            </div>
            <div style={{
              fontSize: '18px',
              color: THEME.accent,
              transform: expandedEnglish ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.3s ease',
            }}>
              ▼
            </div>
          </div>
          {expandedEnglish && (
            <div style={{
              ...styles.panelContent,
              padding: '14px 18px',
              animation: 'slideDown 0.3s ease',
            }}>
              {englishModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  title={module.title}
                  color={module.color}
                  icon={module.icon}
                  description={module.description}
                  completed={module.completed}
                  onClick={() => handleModuleClick(module)}
                  hasSubmenu={module.hasSubmenu}
                  submodules={module.submodules}
                  isExpanded={expandedModuleId === module.id}
                  onToggleExpand={() => toggleModuleExpand(module.id)}
                  onSubmoduleClick={handleSubmoduleClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* 数学模块面板 - 可折叠 */}
        <div style={styles.panel}>
          <div 
            style={styles.panelHeader}
            onClick={() => setExpandedMath(!expandedMath)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#222222';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = THEME.surface;
            }}
          >
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '600',
                color: THEME.textPrimary,
              }}>
                🧮 数学模块
              </h3>
              <div style={{
                fontSize: '11px',
                color: THEME.textSecondary,
                marginTop: '3px',
                fontWeight: '500',
              }}>
                {mathModules.length}个模块
              </div>
            </div>
            <div style={{
              fontSize: '18px',
              color: THEME.accent,
              transform: expandedMath ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.3s ease',
            }}>
              ▼
            </div>
          </div>
          {expandedMath && (
            <div style={{
              ...styles.panelContent,
              padding: '14px 18px',
              animation: 'slideDown 0.3s ease',
            }}>
              {mathModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  title={module.title}
                  color={module.color}
                  icon={module.icon}
                  description={module.description}
                  completed={module.completed}
                  onClick={() => handleModuleClick(module)}
                  hasSubmenu={module.hasSubmenu}
                  submodules={module.submodules}
                  isExpanded={expandedModuleId === module.id}
                  onToggleExpand={() => toggleModuleExpand(module.id)}
                  onSubmoduleClick={handleSubmoduleClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 登录/注册模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={isLoading}
        error={authError}
        server_address={server_address}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
        }}
      />

      {/* 笔记本组件 */}
      <Notebook
        isOpen={showNotebook}
        onClose={() => setShowNotebook(false)}
        onAddNote={(newNote) => {
          console.log('新笔记添加:', newNote);
          message.success(`笔记已保存到服务器`);
        }}
        initialText={notebookContext.initialText}
        videoContext={notebookContext.videoContext}
        themeMode="dark"
        baseUrl="https://www.ddstudent.xyz/server/english/"
        getToken={getToken}
      />

      {/* 用户菜单 */}
      {showUserMenu && currentUser && (
        <UserMenu
          user={currentUser}
          onLogout={handleLogout}
          onClose={() => setShowUserMenu(false)}
        />
      )}

      {/* 添加旋转动画样式 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* 全屏模式下的样式优化 */
          body:fullscreen {
            background-color: ${THEME.bg};
          }
          
          body:-webkit-full-screen {
            background-color: ${THEME.bg};
          }
          
          body:-moz-full-screen {
            background-color: ${THEME.bg};
          }
          
          body:-ms-fullscreen {
            background-color: ${THEME.bg};
          }
          
          /* 触摸设备优化 */
          @media (hover: none) and (pointer: coarse) {
            .date-cell, .module-card {
              min-height: 44px;
              min-width: 44px;
            }
            
            button, [role="button"] {
              min-height: 44px;
              min-width: 44px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Main;