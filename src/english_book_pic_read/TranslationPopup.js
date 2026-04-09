// TranslationPopup.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { F_translator, F_speak } from '../Function/weisimin.js';
import WordTranslator from '../translator/index.js';

// 可拖动的翻译悬浮框组件
const TranslationPopup = ({
  word,
  translation,
  onClose,
  visible,
  onSpeak,
  displayMode = 'both', // 'english', 'chinese', 'both'
  onModeChange,
  onWordChange,
  autoSpeak = true,
  onOpenTranslator
}) => {

  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTranslation, setCurrentTranslation] = useState('translation');
  const [currentWord, setCurrentWord] = useState('word');
  const [showTranslator, setShowTranslator] = useState(false);
  const translatorRef = useRef(null);
  const popupRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 辅助函数：获取单词数量
  const getWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // 辅助函数：检查是否为单词（不含空格或只有1个单词）
  const isSingleWord = (text) => {
    const words = text.trim().split(/\s+/);
    return words.length === 1;
  };

  // 分句函数 - 按英文标点分割
  const splitIntoSentences = (text) => {
    if (!text) return [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.map(s => s.trim());
  };

  // 分句翻译函数
  const splitTranslation = (transText) => {
    if (!transText) return [];
    const sentences = transText.split(/[。！？]+/).filter(s => s.trim());
    return sentences.map(s => s.trim() + '。');
  };

  // 单词拆分函数 - 将句子拆分为单词
  const splitIntoWords = (sentence) => {
    if (!sentence) return [];
    const words = sentence.match(/[\w']+|[.,!?;]/g) || [];
    return words.filter(word => word.trim());
  };

  const englishSentences = splitIntoSentences(currentWord);
  const chineseSentences = currentTranslation ? splitTranslation(currentTranslation) : [];
  const isMultiSentence = englishSentences.length > 1;

  // 播放整个句子发音
  const handleSpeakSentence = useCallback((sentence) => {
    if (sentence) {
      F_speak(sentence);
      if (onSpeak) onSpeak(sentence);
    }
  }, [onSpeak]);

  // 播放单个单词发音
  const handleSpeakWord = useCallback((wordToSpeak) => {
    if (wordToSpeak) {
      F_speak(wordToSpeak);
      if (onSpeak) onSpeak(wordToSpeak);
    }
  }, [onSpeak]);

  // 添加单词到翻译器输入框
  const addWordToTranslator = useCallback((wordToAdd) => {
    if (wordToAdd) {
      console.log('添加单词到翻译器:', wordToAdd);
      // 先打开翻译器窗口
      setShowTranslator(true);
      // 延迟一下，确保翻译器组件已经渲染
      setTimeout(() => {
        if (translatorRef.current) {
          console.log('调用 translator.translateText:', wordToAdd);
          translatorRef.current.translateText && translatorRef.current.translateText(wordToAdd);
        } else {
          console.log('translatorRef.current 不存在');
        }
      }, 150);
    }
  }, []);

  // 添加句子到翻译器输入框
  const addSentenceToTranslator = useCallback((sentenceToAdd) => {
    if (sentenceToAdd) {
      console.log('添加句子到翻译器:', sentenceToAdd);

      // 判断文本类型：单词还是句子
      const wordCount = sentenceToAdd.split(/\s+/).filter(w => w.length > 0).length;
      const hasPunctuation = /[.!?]/.test(sentenceToAdd);
      const isLikelySentence = hasPunctuation || wordCount > 7;

      console.log('【TranslationPopup】单词数量:', wordCount, '是否有标点:', hasPunctuation, '是否可能是句子:', isLikelySentence);

      setShowTranslator(true);
      setTimeout(() => {
        if (translatorRef.current) {
          if (isLikelySentence) {
            // 句子：设置到句子框
            translatorRef.current.setSentenceText && translatorRef.current.setSentenceText(sentenceToAdd);
          } else {
            // 单词或短语：设置到单词框并进行翻译
            console.log('【TranslationPopup】判断为单词/短语，调用 translateText:', sentenceToAdd);
            translatorRef.current.translateText && translatorRef.current.translateText(sentenceToAdd);
          }
        } else {
          console.log('translatorRef.current 不存在 (句子)');
        }
      }, 150);
    }
  }, []);

  // 打开完整翻译器
  const handleOpenTranslator = useCallback(() => {
    setShowTranslator(true);
    setTimeout(() => {
      if (translatorRef.current && currentWord) {
        console.log('调用 translator.translateText (完整翻译器):', currentWord);
        translatorRef.current.translateText && translatorRef.current.translateText(currentWord);
      }
    }, 100);
    if (onOpenTranslator) onOpenTranslator();
  }, [currentWord, onOpenTranslator]);

  // 关闭完整翻译器
  const handleCloseTranslator = useCallback(() => {
    setShowTranslator(false);
  }, []);

  // 翻译单词
  const translateWord = useCallback(async (wordToTranslate, shouldSpeak = true) => {
    if (!wordToTranslate || wordToTranslate.trim() === '') {
      setError('请输入要翻译的单词或短语');
      return;
    }

    const wordCount = getWordCount(wordToTranslate);
    if (wordCount > 7) {
      return;
    }

    const cleanedWord = wordToTranslate.trim();

    setLoading(true);
    setError(null);

    try {
      if (shouldSpeak && autoSpeak) {
        F_speak(cleanedWord);
      }

      const result = await F_translator(cleanedWord);

      if (result) {
        setCurrentTranslation(result);
        setCurrentWord(cleanedWord);

        if (onWordChange) {
          onWordChange({
            word: cleanedWord,
            translation: result,
            source: 'translator',
            isPhrase: !isSingleWord(cleanedWord)
          });
        }
      } else {
        setError('未找到翻译结果');
        setCurrentTranslation(null);
      }
    } catch (err) {
      console.error('翻译失败:', err);
      setError('翻译失败，请稍后重试');
      setCurrentTranslation(null);
    } finally {
      setLoading(false);
    }
  }, [onWordChange, autoSpeak]);

  // 初始化位置 - 右侧居中
  useEffect(() => {
    if (visible && position.x === null && popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      setPosition({
        x: window.innerWidth - rect.width - 20,
        y: (window.innerHeight - rect.height) / 2
      });
    }
  }, [visible]);

  // 当传入的word或translation变化时更新状态
  useEffect(() => {
    if (word && word !== currentWord) {
      setCurrentWord(word);
      if (translation && translation !== currentTranslation) {
        setCurrentTranslation(translation);
      } else if (word && !translation) {
        translateWord(word, false);
      }
    }
  }, [word, translation, currentWord, currentTranslation, translateWord]);

  // 鼠标按下开始拖动
  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  // 鼠标移动
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && position.x !== null) {
        let newX = e.clientX - dragStartPos.current.x;
        let newY = e.clientY - dragStartPos.current.y;

        if (popupRef.current) {
          const rect = popupRef.current.getBoundingClientRect();
          newX = Math.max(0, Math.min(window.innerWidth - rect.width, newX));
          newY = Math.max(0, Math.min(window.innerHeight - rect.height, newY));
        }

        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  // 重置位置到右侧居中
  const resetPosition = () => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      setPosition({
        x: window.innerWidth - rect.width - 20,
        y: (window.innerHeight - rect.height) / 2
      });
    }
  };

  // 切换显示模式
  const cycleDisplayMode = () => {
    const modes = ['english', 'both', 'chinese'];
    const currentIndex = modes.indexOf(displayMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    if (onModeChange) onModeChange(nextMode);
  };

  // 获取模式显示名称
  const getModeName = () => {
    switch (displayMode) {
      case 'english': return '英文';
      case 'chinese': return '中文';
      case 'both': return '中英对照';
      default: return '中英对照';
    }
  };

  // 获取模式图标
  const getModeIcon = () => {
    switch (displayMode) {
      case 'english': return '🔤';
      case 'chinese': return '🀄';
      case 'both': return '📖';
      default: return '📖';
    }
  };

  // 渲染英文内容 - 支持单词拆分和单独发音，每个句子后面有+号
  const renderEnglishContent = () => {
    if (isMultiSentence) {
      return (
        <div>
          {englishSentences.map((sentence, index) => (
            <div key={index} style={{
              marginBottom: index < englishSentences.length - 1 ? '16px' : '0',
              padding: '12px',
              backgroundColor: 'rgba(14, 99, 156, 0.1)',
              borderRadius: '8px',
              borderLeft: '3px solid #0e639c'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div
                  onClick={() => handleSpeakSentence(sentence)}
                  style={{
                    fontSize: '14px',
                    color: '#4ec9b0',
                    fontFamily: 'Consolas, monospace',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(14, 99, 156, 0.2)'
                  }}
                >
                  <span>🔊</span>
                  <span>播放整句</span>
                </div>

                {/* 添加句子按钮 */}
                <div
                  onClick={() => addSentenceToTranslator(sentence)}
                  style={{
                    fontSize: '14px',
                    color: '#ffab40',
                    fontFamily: 'Consolas, monospace',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 171, 64, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffcc00';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 171, 64, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ffab40';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 171, 64, 0.2)';
                  }}
                  title="添加到翻译器"
                >
                  <span>➕</span>
                  <span>添加句子</span>
                </div>
              </div>

              {/* 单词拆分显示 */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center'
              }}>
                {splitIntoWords(sentence).map((word, wordIndex) => {
                  const isPunctuation = /[.,!?;]/.test(word);
                  return (
                    <div
                      key={wordIndex}
                      onClick={() => !isPunctuation && addWordToTranslator(word)}
                      style={{
                        fontSize: '14px',
                        // color: isPunctuation ? '#858585' : '#9cdcfe',
                        fontFamily: 'Consolas, monospace',
                        cursor: isPunctuation ? 'default' : 'pointer',
                        padding: isPunctuation ? '0' : '4px 8px',
                        // borderRadius: isPunctuation ? '0' : '4px',
                        backgroundColor: isPunctuation ? 'transparent' : 'rgba(156, 220, 254, 0.1)',
                        // border: isPunctuation ? 'none' : '1px solid rgba(156, 220, 254, 0.3)',
                        lineHeight: '1.5',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isPunctuation) {
                          e.currentTarget.style.color = '#ffcc00';
                          e.currentTarget.style.backgroundColor = 'rgba(156, 220, 254, 0.2)';
                          e.currentTarget.style.borderColor = '#ffcc00';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isPunctuation) {
                          e.currentTarget.style.color = '#9cdcfe';
                          e.currentTarget.style.backgroundColor = 'rgba(156, 220, 254, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(156, 220, 254, 0.3)';
                        }
                      }}
                      title={isPunctuation ? '标点符号' : `点击添加到翻译器: ${word}`}
                    >
                      {word}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      const words = splitIntoWords(currentWord);
      const hasMultipleWords = words.length > 1;

      return (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(14, 99, 156, 0.1)',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div
              onClick={() => handleSpeakSentence(currentWord)}
              style={{
                fontSize: '14px',
                color: '#4ec9b0',
                fontFamily: 'Consolas, monospace',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(14, 99, 156, 0.2)'
              }}
            >
              <span>🔊</span>
              <span>播放整句</span>
            </div>

            {/* 添加句子按钮 */}
            {hasMultipleWords && (
              <div
                onClick={() => addSentenceToTranslator(currentWord)}
                style={{
                  fontSize: '14px',
                  color: '#ffab40',
                  fontFamily: 'Consolas, monospace',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 171, 64, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffcc00';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 171, 64, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#ffab40';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 171, 64, 0.2)';
                }}
                title="添加到翻译器"
              >
                <span>➕</span>
                <span>添加句子</span>
              </div>
            )}
          </div>

          {/* 单词显示 */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            justifyContent: hasMultipleWords ? 'flex-start' : 'center'
          }}>
            {words.map((word, index) => {
              const isPunctuation = /[.,!?;]/.test(word);
              return (
                <div
                  key={index}
                  onClick={() => !isPunctuation && addWordToTranslator(word)}
                  style={{
                    fontSize: hasMultipleWords ? '14px' : '16px',
                    fontWeight: hasMultipleWords ? 'normal' : 'bold',
                    color: isPunctuation ? '#858585' : (hasMultipleWords ? '#9cdcfe' : '#4ec9b0'),
                    fontFamily: 'Consolas, monospace',
                    cursor: isPunctuation ? 'default' : 'pointer',
                    padding: isPunctuation ? '0' : (hasMultipleWords ? '6px 10px' : '10px 16px'),
                    borderRadius: isPunctuation ? '0' : '6px',
                    backgroundColor: isPunctuation ? 'transparent' : (hasMultipleWords ? 'rgba(156, 220, 254, 0.1)' : 'rgba(78, 201, 176, 0.1)'),
                    border: isPunctuation ? 'none' : `1px solid ${hasMultipleWords ? 'rgba(156, 220, 254, 0.3)' : 'rgba(78, 201, 176, 0.3)'}`,
                    lineHeight: '1.5',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isPunctuation) {
                      e.currentTarget.style.color = '#ffcc00';
                      e.currentTarget.style.backgroundColor = hasMultipleWords ? 'rgba(156, 220, 254, 0.2)' : 'rgba(78, 201, 176, 0.2)';
                      e.currentTarget.style.borderColor = '#ffcc00';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPunctuation) {
                      e.currentTarget.style.color = hasMultipleWords ? '#9cdcfe' : '#4ec9b0';
                      e.currentTarget.style.backgroundColor = hasMultipleWords ? 'rgba(156, 220, 254, 0.1)' : 'rgba(78, 201, 176, 0.1)';
                      e.currentTarget.style.borderColor = hasMultipleWords ? 'rgba(156, 220, 254, 0.3)' : 'rgba(78, 201, 176, 0.3)';
                    }
                  }}
                  title={isPunctuation ? '标点符号' : `点击添加到翻译器: ${word}`}
                >
                  {word}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  // 渲染中文内容
  const renderChineseContent = () => {
    if (!currentTranslation) return null;

    if (isMultiSentence && chineseSentences.length > 0) {
      return (
        <div>
          {chineseSentences.map((sentence, index) => (
            <div key={index} style={{
              marginBottom: index < chineseSentences.length - 1 ? '16px' : '0',
              padding: '12px',
              backgroundColor: 'rgba(14, 99, 156, 0.1)',
              borderRadius: '8px',
              borderLeft: '3px solid #0e639c'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#d4d4d4',
                lineHeight: '1.6',
                fontFamily: 'Segoe UI, sans-serif'
              }}>
                {sentence}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div style={{
          fontSize: '15px',
          color: '#d4d4d4',
          fontFamily: 'Segoe UI, sans-serif',
          lineHeight: '1.5',
          padding: '12px',
          backgroundColor: 'rgba(14, 99, 156, 0.1)',
          borderRadius: '8px'
        }}>
          {currentTranslation}
        </div>
      );
    }
  };

  // 渲染中英对照内容
  const renderBothContent = () => {
    if (!currentTranslation) return renderEnglishContent();

    if (isMultiSentence) {
      return (
        <div>
          {englishSentences.map((sentence, index) => (
            <div key={index} style={{
              marginBottom: index < englishSentences.length - 1 ? '20px' : '0',
              padding: '12px',
              backgroundColor: 'rgba(14, 99, 156, 0.1)',
              borderRadius: '8px',
              borderLeft: '3px solid #0e639c'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div
                  onClick={() => handleSpeakSentence(sentence)}
                  style={{
                    fontSize: '14px',
                    color: '#4ec9b0',
                    fontFamily: 'Consolas, monospace',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(14, 99, 156, 0.2)'
                  }}
                >
                  <span>🔊</span>
                  <span>播放整句</span>
                </div>

                {/* 添加句子按钮 */}
                <div
                  onClick={() => addSentenceToTranslator(sentence)}
                  style={{
                    fontSize: '14px',
                    color: '#ffab40',
                    fontFamily: 'Consolas, monospace',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 171, 64, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffcc00';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 171, 64, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ffab40';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 171, 64, 0.2)';
                  }}
                  title="添加到翻译器"
                >
                  <span>➕</span>
                  <span>添加句子</span>
                </div>
              </div>

              {/* 单词拆分显示 */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                {splitIntoWords(sentence).map((word, wordIndex) => {
                  const isPunctuation = /[.,!?;]/.test(word);
                  return (
                    <div
                      key={wordIndex}
                      onClick={() => !isPunctuation && addWordToTranslator(word)}
                      style={{
                        fontSize: '14px',
                        color: isPunctuation ? '#858585' : '#9cdcfe',
                        fontFamily: 'Consolas, monospace',
                        cursor: isPunctuation ? 'default' : 'pointer',
                        padding: isPunctuation ? '0' : '4px 8px',
                        borderRadius: isPunctuation ? '0' : '4px',
                        backgroundColor: isPunctuation ? 'transparent' : 'rgba(156, 220, 254, 0.1)',
                        border: isPunctuation ? 'none' : '1px solid rgba(156, 220, 254, 0.3)',
                        lineHeight: '1.5',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isPunctuation) {
                          e.currentTarget.style.color = '#ffcc00';
                          e.currentTarget.style.backgroundColor = 'rgba(156, 220, 254, 0.2)';
                          e.currentTarget.style.borderColor = '#ffcc00';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isPunctuation) {
                          e.currentTarget.style.color = '#9cdcfe';
                          e.currentTarget.style.backgroundColor = 'rgba(156, 220, 254, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(156, 220, 254, 0.3)';
                        }
                      }}
                      title={isPunctuation ? '标点符号' : `点击添加到翻译器: ${word}`}
                    >
                      {word}
                    </div>
                  );
                })}
              </div>

              {/* 中文翻译 */}
              {chineseSentences[index] && (
                <div style={{
                  fontSize: '14px',
                  color: '#d4d4d4',
                  lineHeight: '1.6',
                  fontFamily: 'Segoe UI, sans-serif',
                  padding: '8px',
                  backgroundColor: 'rgba(14, 99, 156, 0.05)',
                  borderRadius: '6px',
                  borderTop: '1px dashed rgba(14, 99, 156, 0.3)'
                }}>
                  {chineseSentences[index]}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } else {
      const words = splitIntoWords(currentWord);
      const hasMultipleWords = words.length > 1;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(14, 99, 156, 0.1)',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div
                onClick={() => handleSpeakSentence(currentWord)}
                style={{
                  fontSize: '14px',
                  color: '#4ec9b0',
                  fontFamily: 'Consolas, monospace',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(14, 99, 156, 0.2)'
                }}
              >
                <span>🔊</span>
                <span>播放整句</span>
              </div>

              {/* 添加句子按钮 */}
              {hasMultipleWords && (
                <div
                  onClick={() => addSentenceToTranslator(currentWord)}
                  style={{
                    fontSize: '14px',
                    color: '#ffab40',
                    fontFamily: 'Consolas, monospace',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 171, 64, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffcc00';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 171, 64, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ffab40';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 171, 64, 0.2)';
                  }}
                  title="添加到翻译器"
                >
                  <span>➕</span>
                  <span>添加句子</span>
                </div>
              )}
            </div>

            {/* 单词显示 */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
              justifyContent: hasMultipleWords ? 'flex-start' : 'center'
            }}>
              {words.map((word, index) => {
                const isPunctuation = /[.,!?;]/.test(word);
                return (
                  <div
                    key={index}
                    onClick={() => !isPunctuation && addWordToTranslator(word)}
                    style={{
                      fontSize: hasMultipleWords ? '14px' : '16px',
                      fontWeight: hasMultipleWords ? 'normal' : 'bold',
                      color: isPunctuation ? '#858585' : (hasMultipleWords ? '#9cdcfe' : '#4ec9b0'),
                      fontFamily: 'Consolas, monospace',
                      cursor: isPunctuation ? 'default' : 'pointer',
                      padding: isPunctuation ? '0' : (hasMultipleWords ? '6px 10px' : '10px 16px'),
                      borderRadius: isPunctuation ? '0' : '6px',
                      backgroundColor: isPunctuation ? 'transparent' : (hasMultipleWords ? 'rgba(156, 220, 254, 0.1)' : 'rgba(78, 201, 176, 0.1)'),
                      border: isPunctuation ? 'none' : `1px solid ${hasMultipleWords ? 'rgba(156, 220, 254, 0.3)' : 'rgba(78, 201, 176, 0.3)'}`,
                      lineHeight: '1.5',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isPunctuation) {
                        e.currentTarget.style.color = '#ffcc00';
                        e.currentTarget.style.backgroundColor = hasMultipleWords ? 'rgba(156, 220, 254, 0.2)' : 'rgba(78, 201, 176, 0.2)';
                        e.currentTarget.style.borderColor = '#ffcc00';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isPunctuation) {
                        e.currentTarget.style.color = hasMultipleWords ? '#9cdcfe' : '#4ec9b0';
                        e.currentTarget.style.backgroundColor = hasMultipleWords ? 'rgba(156, 220, 254, 0.1)' : 'rgba(78, 201, 176, 0.1)';
                        e.currentTarget.style.borderColor = hasMultipleWords ? 'rgba(156, 220, 254, 0.3)' : 'rgba(78, 201, 176, 0.3)';
                      }
                    }}
                    title={isPunctuation ? '标点符号' : `点击添加到翻译器: ${word}`}
                  >
                    {word}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 中文翻译 */}
          <div style={{
            fontSize: '15px',
            color: '#d4d4d4',
            fontFamily: 'Segoe UI, sans-serif',
            lineHeight: '1.5',
            padding: '12px',
            backgroundColor: 'rgba(14, 99, 156, 0.05)',
            borderRadius: '8px'
          }}>
            {currentTranslation}
          </div>
        </div>
      );
    }
  };

  const renderContent = () => {
    switch (displayMode) {
      case 'english': return renderEnglishContent();
      case 'chinese': return renderChineseContent();
      default: return renderBothContent();
    }
  };

  const renderLoading = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '20px'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        border: '2px solid #0e639c',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ color: '#858585', fontSize: '14px' }}>正在查询翻译...</span>
    </div>
  );

  const renderError = () => {
    if (!error) return null;
    return (
      <div style={{
        padding: '12px',
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        border: '1px solid #ef5350',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '14px', color: '#ef5350', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  };

  if (!visible || !currentWord) return null;

  const popupStyle = position.x !== null && position.y !== null
    ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, transform: 'none' }
    : { position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)' };

  const popupContent = (
    <div
      ref={popupRef}
      style={{
        ...popupStyle,
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        border: '1px solid rgba(14, 99, 156, 0.6)',
        borderRadius: '12px',
        padding: '16px',
        zIndex: 1,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        width: '380px',
        maxHeight: '80vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 可拖动的标题栏 */}
      <div
        className="drag-handle"
        onMouseDown={handleMouseDown}
        style={{
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(14, 99, 156, 0.3)',
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#858585' }}>⋮⋮</span>
          <span style={{ fontSize: '14px', color: '#9cdcfe', fontFamily: 'Consolas, monospace' }}>
            {getModeIcon()} 翻译 & 发音
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleOpenTranslator}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4ec9b0',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'Consolas, monospace'
            }}
            title="打开完整翻译器"
          >
            🔍 完整翻译
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'Consolas, monospace'
            }}
            title="关闭"
          >
            ✕ 关闭
          </button>
        </div>
      </div>

      {renderError()}

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
        {loading ? renderLoading() : renderContent()}
      </div>

      {/* 底部控制栏 */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(14, 99, 156, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={cycleDisplayMode}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4ec9b0',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'Consolas, monospace'
          }}
          title={`切换显示模式 (当前: ${getModeName()})`}
        >
          {getModeIcon()} {getModeName()}
        </button>

        <button
          onClick={resetPosition}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#858585',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'Consolas, monospace'
          }}
          title="重置位置"
        >
          ↖ 重置位置
        </button>
      </div>
    </div>
  );

  const renderTranslator = () => {
    if (!showTranslator) return null;
    return (
      <WordTranslator
        ref={translatorRef}
        open={showTranslator}
        onClose={handleCloseTranslator}
        word={currentWord}
        onWordChange={onWordChange}
        defaultCompact={false}
      />
    );
  };

  return (
    <>
      {popupContent}
      {renderTranslator()}
    </>
  );
};

export default TranslationPopup;
