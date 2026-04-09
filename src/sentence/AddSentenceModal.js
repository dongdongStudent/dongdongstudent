// AddSentenceModal.js - 修复 onAdd 回调错误处理
import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { sentenceApi } from './api';

// ==================== 添加句子弹窗组件 ====================
const AddSentenceModal = ({
  onClose,
  onAdd,
  allSentences = []
}) => {
  const [englishText, setEnglishText] = useState('');
  const [chineseText, setChineseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 验证句子是否已存在
  const checkIfExists = (english) => {
    if (!english || !allSentences.length) return false;
    return allSentences.some(s => 
      s.text?.toLowerCase().trim() === english.toLowerCase().trim()
    );
  };

  const handleAddSentence = async () => {
    // 验证输入
    if (!englishText.trim()) {
      setError('请输入英文句子');
      return;
    }

    if (!chineseText.trim()) {
      setError('请输入中文翻译');
      return;
    }

    const trimmedEnglish = englishText.trim();
    const trimmedChinese = chineseText.trim();

    // 检查是否已存在
    if (checkIfExists(trimmedEnglish)) {
      setError(`句子 "${trimmedEnglish}" 已存在于句子库中`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sentenceData = {
        text: trimmedEnglish,
        chinese: trimmedChinese,
        pass: false,
        correct_count: 0,
        wrong_count: 0,
        extraction_count: 0,
        last_answer_time: new Date().toISOString(),
        time: new Date().toISOString()
      };

      console.log('准备添加到句子库:', sentenceData);

      const result = await sentenceApi.addSentence(sentenceData, 'sentences');

      console.log('句子库服务器返回:', result);
      
      // 修复：正确解析服务器返回的数据结构
      if (result && result.flag === 1) {
        // 从 content 中获取 id 和 sentenceData
        const addedId = result.content?.id || result.id || Date.now().toString();
        const addedSentenceData = result.content?.sentenceData || sentenceData;
        
        console.log('解析后的ID:', addedId);
        console.log('解析后的句子数据:', addedSentenceData);

        // 修复：添加 try-catch 包裹 onAdd 调用，防止回调函数抛出异常
        if (onAdd) {
          try {
            // 传递完整的句子数据对象
            const newSentence = {
              ...addedSentenceData,
              id: addedId
            };
            await onAdd(newSentence);
            console.log('✅ onAdd 回调执行成功');
          } catch (callbackErr) {
            console.error('onAdd 回调执行失败:', callbackErr);
            // 即使回调失败，句子已经添加成功，只记录错误，不抛出
            message.warning('句子已添加，但更新列表失败');
          }
        }

        // 清空输入框
        setEnglishText('');
        setChineseText('');
        setError('');
        message.success(`✅ 句子已添加到句子库`);
        
        // 延迟关闭弹窗，让用户看到成功消息
        setTimeout(() => {
          onClose();
        }, 1000);
        
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && englishText.trim() && chineseText.trim()) {
      handleAddSentence();
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>
            ➕ 手动添加句子到句子库
            <span style={modalStyles.badge}>句子库服务器</span>
          </h3>
          <button onClick={onClose} style={modalStyles.closeButton}>✕</button>
        </div>

        <div style={modalStyles.content}>
          {/* 英文输入 */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>
              英文句子 <span style={{ color: '#f44336' }}>*</span>
            </label>
            <textarea
              value={englishText}
              onChange={(e) => setEnglishText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入英文句子，例如：What is your name?"
              style={modalStyles.textarea}
              rows={3}
              disabled={loading}
            />
          </div>

          {/* 中文翻译输入 */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>
              中文翻译 <span style={{ color: '#f44336' }}>*</span>
            </label>
            <textarea
              value={chineseText}
              onChange={(e) => setChineseText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入中文翻译，例如：你叫什么名字？"
              style={modalStyles.textarea}
              rows={2}
              disabled={loading}
            />
          </div>

          {/* 提示信息 */}
          <div style={modalStyles.infoBox}>
            <div style={modalStyles.infoIcon}>💡</div>
            <div style={modalStyles.infoText}>
              添加的句子将用于听力测试和复习练习。支持按Enter键快速添加。
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={modalStyles.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* 操作按钮 */}
          <div style={modalStyles.actions}>
            <button 
              onClick={handleAddSentence}
              disabled={loading || !englishText.trim() || !chineseText.trim()}
              style={{
                ...modalStyles.submitButton,
                opacity: (loading || !englishText.trim() || !chineseText.trim()) ? 0.6 : 1,
                cursor: (loading || !englishText.trim() || !chineseText.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '添加中...' : '✅ 添加到句子库'}
            </button>
            <button 
              onClick={onClose} 
              style={modalStyles.cancelButton}
              disabled={loading}
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 样式 ====================
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100
  },
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '550px',
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflow: 'auto',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.3s ease'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f0f0f0'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: '#e3f2fd',
    color: '#1976D2'
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#e0e0e0',
    color: '#666',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  infoBox: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    alignItems: 'flex-start'
  },
  infoIcon: {
    fontSize: '20px'
  },
  infoText: {
    fontSize: '13px',
    color: '#1976D2',
    lineHeight: '1.5',
    flex: 1
  },
  errorBox: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#f44336'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  submitButton: {
    padding: '10px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: '#e0e0e0',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

// 添加动画
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default AddSentenceModal;