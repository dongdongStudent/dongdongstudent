import React, { useState } from 'react';
import { F_post_register, F_post_login } from './authApi';

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
};

// ==================== 样式定义 ====================
const styles = {
  // ==================== 用户头像组件样式 ====================
  userAvatar: {
    container: (user, disabled) => ({
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: user ? THEME.accent : THEME.surface,
      color: user ? '#000000' : THEME.textPrimary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: '15px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      flexShrink: 0,
      border: `2px solid ${user ? THEME.accent : THEME.border}`,
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.6 : 1,
    }),
  },

  // ==================== 用户菜单组件样式 ====================
  userMenu: {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 999,
    },
    container: {
      position: 'absolute',
      top: '60px',
      right: '16px',
      backgroundColor: THEME.paper,
      borderRadius: '8px',
      border: `1px solid ${THEME.border}`,
      width: '200px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    },
    userInfo: {
      container: {
        padding: '16px',
        borderBottom: `1px solid ${THEME.border}`,
      },
      avatarContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '8px',
      },
      avatar: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: THEME.accent,
        color: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '14px',
      },
      infoText: {
        display: 'flex',
        flexDirection: 'column',
      },
      name: {
        fontSize: '14px',
        fontWeight: '600',
        color: THEME.textPrimary,
      },
      email: {
        fontSize: '11px',
        color: THEME.textSecondary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      joinDate: {
        fontSize: '10px',
        color: THEME.textMuted,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      },
    },
    menuItems: {
      container: {
        padding: '8px',
      },
      menuButton: {
        width: '100%',
        padding: '10px 12px',
        textAlign: 'left',
        backgroundColor: 'transparent',
        border: 'none',
        color: THEME.textSecondary,
        fontSize: '12px',
        cursor: 'pointer',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
      logoutButton: {
        width: '100%',
        padding: '10px 12px',
        textAlign: 'left',
        backgroundColor: 'transparent',
        border: 'none',
        color: THEME.danger,
        fontSize: '12px',
        cursor: 'pointer',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px',
      },
    },
  },

  // ==================== 登录/注册模态框样式 ====================
  authModal: {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    },
    container: {
      backgroundColor: THEME.paper,
      borderRadius: '12px',
      border: `1px solid ${THEME.border}`,
      width: '100%',
      maxWidth: '400px',
      overflow: 'hidden',
    },
    header: {
      padding: '16px 20px',
      borderBottom: `1px solid ${THEME.border}`,
      backgroundColor: THEME.surface,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '600',
      color: THEME.textPrimary,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: THEME.textSecondary,
      fontSize: '20px',
      cursor: 'pointer',
      padding: '0',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    form: {
      padding: '24px',
    },
    errorAlert: {
      backgroundColor: THEME.danger + '20',
      color: THEME.danger,
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    formLabel: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '500',
      color: THEME.textSecondary,
      marginBottom: '6px',
    },
    inputContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
    },
    togglePasswordButton: (isLoading) => ({
      background: 'none',
      border: 'none',
      color: THEME.accent,
      fontSize: '10px',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '0',
    }),
    input: (isLoading) => ({
      width: '100%',
      padding: '10px 12px',
      backgroundColor: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderRadius: '6px',
      color: THEME.textPrimary,
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      opacity: isLoading ? 0.6 : 1,
      cursor: isLoading ? 'not-allowed' : 'text',
    }),
    submitButton: (isLoading) => ({
      width: '100%',
      padding: '12px',
      backgroundColor: isLoading ? THEME.textMuted : THEME.accent,
      color: isLoading ? THEME.textSecondary : '#000000',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'opacity 0.2s',
      opacity: isLoading ? 0.8 : 1,
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    }),
    loadingSpinner: {
      display: 'inline-block',
      width: '12px',
      height: '12px',
      border: '2px solid transparent',
      borderTopColor: '#000000',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    modeSwitch: {
      textAlign: 'center',
      fontSize: '12px',
      color: THEME.textSecondary,
    },
    switchButton: (isLoading) => ({
      background: 'none',
      border: 'none',
      color: isLoading ? THEME.textMuted : THEME.accent,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      marginLeft: '4px',
      textDecoration: 'underline',
    }),
    iconText: {
      fontSize: '12px',
    },
  },
};

// ==================== 用户认证服务 ====================
export const AuthService = {
  // 模拟用户数据库
  users: [
    { id: 1, username: 'test', password: '123456', name: '测试用户', email: 'test@example.com' },
    { id: 2, username: 'winter', password: '123456', name: '冬', email: 'winter@example.com' },
  ],

  // 验证登录
  login: async (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = AuthService.users.find(
          u => u.username === username && u.password === password
        );

        if (user) {
          resolve({
            id: user.id,
            name: user.name,
            email: user.email,
            joinDate: new Date().toISOString().split('T')[0],
            username: user.username
          });
        } else {
          reject(new Error('用户名或密码错误'));
        }
      }, 500);
    });
  },

  // 用户注册
  register: async (username, password, confirmPassword) => {
    console.log('检测用户名是否已存在', AuthService)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 验证输入
        if (!username || !password) {
          reject(new Error('用户名和密码不能为空'));
          return;
        }

        if (password !== confirmPassword) {
          reject(new Error('两次输入的密码不一致'));
          return;
        }

        if (password.length < 6) {
          reject(new Error('密码长度不能少于6位'));
          return;
        }

        // 检查用户是否已存在
        const existingUser = AuthService.users.find(u => u.username === username);
        if (existingUser) {
          reject(new Error('用户名已存在'));
          return;
        }

        // 创建新用户
        const newUser = {
          id: Date.now(),
          username,
          password,
          name: username,
          email: `${username}@example.com`
        };

        AuthService.users.push(newUser);

        resolve({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          joinDate: new Date().toISOString().split('T')[0],
          username: newUser.username
        });
      }, 500);
    });
  },

  // 检查登录状态
  checkAuth: () => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('解析用户数据失败:', error);
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  },

  // 退出登录
  logout: () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    return true;
  },

  // 获取当前用户
  getCurrentUser: () => {
    return AuthService.checkAuth();
  }
};

// ==================== 用户头像组件 ====================
export const UserAvatar = ({ user, onClick, disabled }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const [isHovered, setIsHovered] = useState(false);

  const avatarStyle = {
    ...styles.userAvatar.container(user, disabled),
    ...(!disabled && isHovered && {
      transform: 'scale(1.05)',
      border: `2px solid ${THEME.accent}`,
    })
  };

  return (
    <div
      onClick={disabled ? null : onClick}
      style={avatarStyle}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
    >
      {user ? getInitials(user.name) : '?'}
    </div>
  );
};

// ==================== 用户菜单组件 ====================
export const UserMenu = ({ user, onLogout, onClose }) => {
  const [hoveredButton, setHoveredButton] = useState(null);

  const getButtonStyle = (type) => {
    const baseStyle = type === 'logout' 
      ? styles.userMenu.menuItems.logoutButton
      : styles.userMenu.menuItems.menuButton;
    
    return {
      ...baseStyle,
      backgroundColor: hoveredButton === type 
        ? (type === 'logout' ? THEME.danger + '15' : THEME.surface)
        : 'transparent',
      color: type === 'logout' ? THEME.danger : (hoveredButton === type ? THEME.textPrimary : THEME.textSecondary),
    };
  };

  const getCloseButtonStyle = {
    ...styles.authModal.closeButton,
    color: hoveredButton === 'close' ? THEME.textPrimary : THEME.textSecondary,
  };

  return (
    <div style={styles.userMenu.overlay} onClick={onClose}>
      <div style={styles.userMenu.container}>
        {/* 用户信息 */}
        <div style={styles.userMenu.userInfo.container}>
          <div style={styles.userMenu.userInfo.avatarContainer}>
            <div style={styles.userMenu.userInfo.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userMenu.userInfo.infoText}>
              <div style={styles.userMenu.userInfo.name}>
                {user.name}
              </div>
              <div style={styles.userMenu.userInfo.email}>
                {user.email}
              </div>
            </div>
          </div>
          <div style={styles.userMenu.userInfo.joinDate}>
            <span>📅</span>
            <span>加入时间：{user.joinDate}</span>
          </div>
        </div>

        {/* 菜单项 */}
        <div style={styles.userMenu.menuItems.container}>
          <button 
            style={getButtonStyle('profile')}
            onMouseEnter={() => setHoveredButton('profile')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <span>👤</span>
            个人资料
          </button>
          <button 
            style={getButtonStyle('settings')}
            onMouseEnter={() => setHoveredButton('settings')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <span>⚙️</span>
            设置
          </button>
          <button 
            style={getButtonStyle('logout')}
            onClick={onLogout}
            onMouseEnter={() => setHoveredButton('logout')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <span>🚪</span>
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== 登录/注册模态框组件 ====================
const AuthModal = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  isLoading,
  error,
  server_address,
  onAuthSuccess
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // 本地验证
    if (!username.trim() || !password.trim()) {
      setLocalError('用户名和密码不能为空');
      return;
    }

    if (!isLoginMode && password !== confirmPassword) {
      setLocalError('两次输入的密码不一致');
      return;
    }

    if (!isLoginMode && password.length < 6) {
      setLocalError('密码长度不能少于6位');
      return;
    }

    if (isLoginMode) {
          console.log('111handleSubmit',username, password, confirmPassword)
      // 调用父组件传入的登录函数
      await onLogin(username, password);
    } else {
      // 调用F_post_register进行注册
      console.log('222handleSubmit',username, password, confirmPassword)
      setIsApiLoading(true);
      try {
        const result = await F_post_register(server_address, username, password, confirmPassword);

        if (result.success) {
          // 注册成功，调用父组件的回调
          if (onAuthSuccess) {
            onAuthSuccess(result.user);
          }
          // 如果父组件传入了onRegister回调，也调用
          if (onRegister) {
            await onRegister(username, password, confirmPassword);
          }
          onClose(); // 关闭模态框
        } else {
          setLocalError(result.message);
        }
      } catch (err) {
        setLocalError(err.message || '注册失败');
      } finally {
        setIsApiLoading(false);
      }
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setLocalError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // 获取输入框样式
  const getInputStyle = (loading) => {
    const baseStyle = styles.authModal.input(loading);
    return {
      ...baseStyle,
      borderColor: hoveredButton === 'input' ? THEME.accent : THEME.border,
    };
  };

  // 获取按钮样式
  const getButtonStyle = (type, loading) => {
    if (type === 'submit') {
      return {
        ...styles.authModal.submitButton(loading),
        opacity: hoveredButton === 'submit' && !loading ? 1 : (loading ? 0.8 : 1),
      };
    }
    if (type === 'toggle') {
      return {
        ...styles.authModal.togglePasswordButton(loading),
        opacity: hoveredButton === 'toggle' && !loading ? 1 : (loading ? 0.6 : 1),
      };
    }
    if (type === 'switch') {
      return {
        ...styles.authModal.switchButton(loading),
        opacity: hoveredButton === 'switch' && !loading ? 0.8 : 1,
      };
    }
    if (type === 'close') {
      return {
        ...styles.authModal.closeButton,
        color: hoveredButton === 'close' ? THEME.textPrimary : THEME.textSecondary,
      };
    }
    return {};
  };

  if (!isOpen) return null;

  return (
    <div style={styles.authModal.overlay}>
      <div style={styles.authModal.container}>
        {/* 模态框头部 */}
        <div style={styles.authModal.header}>
          <h3 style={styles.authModal.title}>
            {isLoginMode ? '用户登录' : '用户注册'}
          </h3>
          <button
            onClick={onClose}
            style={getButtonStyle('close')}
            onMouseEnter={() => setHoveredButton('close')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            ×
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} style={styles.authModal.form}>
          {/* 错误提示 */}
          {(localError || error) && (
            <div style={styles.authModal.errorAlert}>
              <span>⚠️</span>
              <span>{localError || error}</span>
            </div>
          )}

          {/* 用户名输入 */}
          <div style={styles.authModal.formGroup}>
            <label style={styles.authModal.formLabel}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={isLoading || isApiLoading}
              style={getInputStyle(isLoading || isApiLoading)}
              autoComplete="username"
              onFocus={() => setHoveredButton('input')}
              onBlur={() => setHoveredButton(null)}
            />
          </div>

          {/* 密码输入 */}
          <div style={styles.authModal.formGroup}>
            <div style={styles.authModal.inputContainer}>
              <label style={styles.authModal.formLabel}>
                密码
              </label>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isLoading || isApiLoading}
                style={getButtonStyle('toggle', isLoading || isApiLoading)}
                onMouseEnter={() => !(isLoading || isApiLoading) && setHoveredButton('toggle')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {showPassword ? (
                  <>
                    <span style={styles.authModal.iconText}>👁️</span>
                    隐藏密码
                  </>
                ) : (
                  <>
                    <span style={styles.authModal.iconText}>👁️</span>
                    显示密码
                  </>
                )}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={isLoading || isApiLoading}
              style={getInputStyle(isLoading || isApiLoading)}
              autoComplete={isLoginMode ? "current-password" : "new-password"}
              onFocus={() => setHoveredButton('input')}
              onBlur={() => setHoveredButton(null)}
            />
          </div>

          {/* 确认密码输入（注册模式） */}
          {!isLoginMode && (
            <div style={{ marginBottom: '24px' }}>
              <div style={styles.authModal.inputContainer}>
                <label style={styles.authModal.formLabel}>
                  确认密码
                </label>
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  disabled={isLoading || isApiLoading}
                  style={getButtonStyle('toggle', isLoading || isApiLoading)}
                  onMouseEnter={() => !(isLoading || isApiLoading) && setHoveredButton('toggle')}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  {showConfirmPassword ? (
                    <>
                      <span style={styles.authModal.iconText}>👁️</span>
                      隐藏密码
                    </>
                  ) : (
                    <>
                      <span style={styles.authModal.iconText}>👁️</span>
                      显示密码
                    </>
                  )}
                </button>
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                disabled={isLoading || isApiLoading}
                style={getInputStyle(isLoading || isApiLoading)}
                autoComplete="new-password"
                onFocus={() => setHoveredButton('input')}
                onBlur={() => setHoveredButton(null)}
              />
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading || isApiLoading}
            style={getButtonStyle('submit', isLoading || isApiLoading)}
            onMouseEnter={() => !(isLoading || isApiLoading) && setHoveredButton('submit')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            {isLoading || isApiLoading ? (
              <>
                <span style={styles.authModal.loadingSpinner} />
                处理中...
              </>
            ) : (
              isLoginMode ? '登录' : '注册'
            )}
          </button>

          {/* 模式切换 */}
          <div style={styles.authModal.modeSwitch}>
            {isLoginMode ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={switchMode}
              disabled={isLoading || isApiLoading}
              style={getButtonStyle('switch', isLoading || isApiLoading)}
              onMouseEnter={() => !(isLoading || isApiLoading) && setHoveredButton('switch')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {isLoginMode ? '立即注册' : '立即登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;