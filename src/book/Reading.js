import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { getToken, clearToken } from "../config.js";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { F_speak } from "../Function/weisimin.js";
import VocabularyMaster from '../word/workStudy.js';
import WordBook from "../word/wordReviewBook.js";
import lessonsData from './data/lessons.json';

// ==================== 1. 优化后的外部组件 ====================

// --- 文章内容组件 (修复版) ---
const ContentView = memo(({
  selectedArticle,
  onWordClick,
  onBack,
  highlightWords = [],
  activeWord = null,
  userClickedWord = null,
  markAsRead,
  isArticleRead
}) => {
  const articleRef = useRef(null);

  // 使用 ref 缓存高亮单词
  const highlightSetRef = useRef(new Set());

  // 只在相关依赖变化时更新缓存
  useEffect(() => {
    highlightSetRef.current = new Set(
      highlightWords.map(w => w.toLowerCase())
    );
  }, [highlightWords]);

  // 获取文章段落
  const articleParagraphs = useMemo(() => {
    if (!selectedArticle?.content) return [];

    // 按换行符分割，过滤空段落
    const paragraphs = selectedArticle.content
      .split('\n')
      .filter(p => p.trim() !== '')
      .map(p => p.trim());

    return paragraphs;
  }, [selectedArticle?.content]);

  // 预编译短语正则表达式
  const phraseRegex = useMemo(() => {
    if (!highlightWords.length) return null;

    try {
      // 只处理有效的短语
      const validPhrases = highlightWords
        .filter(phrase => phrase && phrase.trim())
        .map(phrase => phrase.trim());

      if (validPhrases.length === 0) return null;

      // 创建正则表达式
      const pattern = validPhrases
        .map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
        .join('|');

      return new RegExp(`\\b(${pattern})\\b`, 'gi');
    } catch (error) {
      console.warn('正则表达式编译失败:', error);
      return null;
    }
  }, [highlightWords]);

  // 渲染单词元素
  const renderWordElement = useCallback((pureWord, punctuation, paraIndex, wordIndex) => {
    if (!pureWord) return null;

    const pureWordLower = pureWord.toLowerCase();
    const isHighlighted = highlightSetRef.current.has(pureWordLower);

    let wordState = 'normal';
    if (activeWord && pureWordLower === activeWord.toLowerCase()) {
      wordState = 'active';
    }
    if (userClickedWord && pureWordLower === userClickedWord.toLowerCase()) {
      wordState = 'clicked';
    }

    return (
      <React.Fragment key={`p${paraIndex}-w${wordIndex}`}>
        <span
          className={`word-element ${isHighlighted ? 'highlighted-word' : ''} 
            ${wordState === 'active' ? 'active-word' : wordState === 'clicked' ? 'clicked-word' : ''}`}
          onClick={() => onWordClick(pureWord)}
          title={wordState === 'active' ? '词库激活中' : wordState === 'clicked' ? '用户选中' : ''}
        >
          {pureWord}
        </span>
        {punctuation || ''}
      </React.Fragment>
    );
  }, [activeWord, userClickedWord, onWordClick]);

  // 渲染短语元素
  const renderPhraseElement = useCallback((phraseText, originalPhrase, paraIndex, phraseIndex) => {
    if (!phraseText) return null;

    const phraseLower = phraseText.toLowerCase();

    let phraseState = 'normal';
    if (activeWord && phraseLower === activeWord.toLowerCase()) {
      phraseState = 'active';
    }
    if (userClickedWord && phraseLower === userClickedWord.toLowerCase()) {
      phraseState = 'clicked';
    }

    return (
      <span
        key={`p${paraIndex}-phrase${phraseIndex}`}
        className={`phrase-element highlighted-phrase 
          ${phraseState === 'active' ? 'active-phrase' : phraseState === 'clicked' ? 'clicked-phrase' : ''}`}
        onClick={() => onWordClick(originalPhrase)}
        title={`短语: ${originalPhrase}`}
      >
        {phraseText}
      </span>
    );
  }, [activeWord, userClickedWord, onWordClick]);

  // 渲染段落 - 简化版
  const renderParagraph = useCallback((paragraph, paraIndex) => {
    if (!paragraph) return null;

    // 如果没有短语匹配，直接渲染单词
    if (!phraseRegex) {
      const words = paragraph.match(/([a-zA-Z'’-]+|[^a-zA-Z\s]+|\s+)/g) || [];
      let wordIndex = 0;

      return words.map((segment, segIndex) => {
        if (segment.match(/^\s+$/)) {
          return <span key={`p${paraIndex}-s${segIndex}`}>{segment}</span>;
        }

        const wordMatch = segment.match(/^([a-zA-Z'’-]+)(.*)$/);
        if (wordMatch) {
          const [_, pureWord, punctuation] = wordMatch;
          return renderWordElement(pureWord, punctuation, paraIndex, wordIndex++);
        }

        return <span key={`p${paraIndex}-s${segIndex}`}>{segment}</span>;
      });
    }

    // 如果有短语，先匹配短语
    const parts = [];
    let lastIndex = 0;
    phraseRegex.lastIndex = 0; // 重置正则索引

    let match;
    while ((match = phraseRegex.exec(paragraph)) !== null) {
      // 添加短语前的文本
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: paragraph.slice(lastIndex, match.index)
        });
      }

      // 添加短语
      parts.push({
        type: 'phrase',
        content: match[0],
        original: match[0]
      });

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < paragraph.length) {
      parts.push({
        type: 'text',
        content: paragraph.slice(lastIndex)
      });
    }

    // 如果没有匹配到短语，直接添加整个段落
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: paragraph
      });
    }

    // 渲染所有部分
    const renderedParts = [];
    let wordIndex = 0;
    let phraseIndex = 0;

    parts.forEach((part, partIndex) => {
      if (part.type === 'text') {
        // 处理文本部分
        const textParts = part.content.match(/([a-zA-Z'’-]+|[^a-zA-Z\s]+|\s+)/g) || [];

        textParts.forEach((segment, segIndex) => {
          if (segment.match(/^\s+$/)) {
            renderedParts.push(
              <span key={`p${paraIndex}-part${partIndex}-seg${segIndex}`}>
                {segment}
              </span>
            );
          } else {
            const wordMatch = segment.match(/^([a-zA-Z'’-]+)(.*)$/);
            if (wordMatch) {
              const [_, pureWord, punctuation] = wordMatch;
              renderedParts.push(
                renderWordElement(pureWord, punctuation, paraIndex, wordIndex++)
              );
            } else {
              renderedParts.push(
                <span key={`p${paraIndex}-part${partIndex}-seg${segIndex}`}>
                  {segment}
                </span>
              );
            }
          }
        });
      } else if (part.type === 'phrase') {
        // 渲染短语
        renderedParts.push(
          renderPhraseElement(part.content, part.original, paraIndex, phraseIndex++)
        );
      }
    });

    return renderedParts;
  }, [phraseRegex, renderWordElement, renderPhraseElement]);

  // 计算单词数量
  const articleWordCount = useMemo(() => {
    if (!selectedArticle?.content) return 0;
    const words = selectedArticle.content.match(/[a-zA-Z'’-]+/g);
    return words ? words.length : 0;
  }, [selectedArticle?.content]);

  const isRead = isArticleRead(selectedArticle?.id);

  return (
    <div className="content-container" ref={articleRef}>
      <div className="content-header">
        <div className="article-info-bar">
          <div className="reading-stats">
            <div className="stat-badge">
              <span className="stat-icon">📖</span>
              <span className="stat-value">{articleWordCount} 单词</span>
            </div>
          </div>

          <div className="article-actions">
            {!isRead ? (
              <button
                className="mark-read-button"
                onClick={() => markAsRead(selectedArticle.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                标记为已读
              </button>
            ) : (
              <div className="read-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981" stroke="#10b981" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                已读
              </div>
            )}
          </div>

          <button className="back-button" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回目录
          </button>
        </div>
      </div>

      <div className="article-container">
        <div className="article-header-section">
          <h1 className="article-title">{selectedArticle.title}</h1>
        </div>

        <div className="reading-content">
          {articleParagraphs.length === 0 ? (
            <div className="no-content-message">
              文章内容为空
            </div>
          ) : (
            articleParagraphs.map((paragraph, index) => (
              <div key={`para-${index}`} className="paragraph">
                <div className="paragraph-content">
                  {renderParagraph(paragraph, index)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

ContentView.displayName = 'ContentView';

// --- 年级选择组件 (优化版) ---
const GradeSelector = memo(({ onSelect, readStats, totalArticlesByGrade }) => {
  const getGradeProgress = useCallback((grade) => {
    if (!readStats[grade] || !totalArticlesByGrade[grade]) return 0;
    const totalArticles = totalArticlesByGrade[grade];
    const readArticles = Object.values(readStats[grade]).filter(status => status.read).length;
    return totalArticles > 0 ? Math.round((readArticles / totalArticles) * 100) : 0;
  }, [readStats, totalArticlesByGrade]);

  const getGradeDisplayName = useCallback((grade) => {
    const grades = {
      '7A': '七年级上册',
      '7B': '七年级下册',
      '8A': '八年级上册',
      '8B': '八年级下册',
      '9A': '九年级上册',
      '9B': '九年级下册'
    };
    return grades[grade] || grade;
  }, []);

  const getGradeIcon = useCallback((grade) => {
    const icons = {
      '7A': '📘', '7B': '📗',
      '8A': '📙', '8B': '📕',
      '9A': '📓', '9B': '📒'
    };
    return icons[grade] || '📚';
  }, []);

  return (
    <div className="grade-grid">
      {['7A', '7B', '8A', '8B', '9A', '9B'].map(grade => {
        const progress = getGradeProgress(grade);
        const totalArticles = totalArticlesByGrade[grade] || 0;
        const readArticles = Math.round((progress * totalArticles) / 100);

        return (
          <div key={grade} className="grade-card" onClick={() => onSelect(grade)}>
            <div className="grade-card-header">
              <div className="grade-icon">{getGradeIcon(grade)}</div>
              <div className="grade-info">
                <div className="grade-name">{getGradeDisplayName(grade)}</div>
                <div className="grade-code">{grade}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

GradeSelector.displayName = 'GradeSelector';

// --- 单元列表组件 (优化版) ---
const UnitList = memo(({ units, onBack, onSelectArticle, readArticles = [], grade }) => {
  const [expandedUnits, setExpandedUnits] = useState([]);

  const toggleUnit = useCallback((unit) => {
    setExpandedUnits(prev =>
      prev.includes(unit)
        ? prev.filter(u => u !== unit)
        : [...prev, unit]
    );
  }, []);

  const isArticleRead = useCallback((articleId) => {
    return readArticles.includes(articleId);
  }, [readArticles]);

  const getUnitProgress = useCallback((unitArticles) => {
    if (!unitArticles || !Array.isArray(unitArticles)) return 0;
    const readCount = unitArticles.filter(art => isArticleRead(art.id)).length;
    return Math.round((readCount / unitArticles.length) * 100);
  }, [isArticleRead]);

  const getUnitDisplayName = useCallback((unit) => {

    const unitsMap = {
      'weisimin': 'weisimin 1',
      'SU2': 'Unit 2',
      'SU3': 'Unit 3',

      '7AU1': 'Unit 1',
      '7AU2': 'Unit 2',
      'U3': 'Unit 3',
      'U4': 'Unit 4',
      'U5': 'Unit 5',
      'U6': 'Unit 6',
      'U7': 'Unit 7',
      'U8': 'Unit 8'
    };
    let a = unitsMap[unit];
    // console.log('111111111111111',unit, a,units)
    return a
  }, []);

  // 获取排序后的单元列表
  const sortedUnits = useMemo(() => {
    if (!units) return [];
    return Object.keys(units).sort();
  }, [units]);

  return (
    <div className="list-container">
      <div className="list-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回年级选择
        </button>
        <h2 className="list-title">
          <span className="grade-badge">{grade}</span>
          <span>单元列表</span>
        </h2>
        <div className="unit-count">
          共 {sortedUnits.length} 个单元
        </div>
      </div>

      <div className="unit-list">
        {sortedUnits.map(u => {
          // console.log('2222222222222',u,units[u],units)
          if (!units[u] || units[u].length === 0) return null;

          const isExpanded = expandedUnits.includes(u);
          const unitProgress = getUnitProgress(units[u]);
          const unitArticles = units[u];
          const readCount = unitArticles.filter(art => isArticleRead(art.id)).length;

          return (
            <div key={u} className={`unit-card ${isExpanded ? 'expanded' : ''}`}>
              <div
                className="unit-header"
                onClick={() => toggleUnit(u)}
              >
                <div className="unit-header-left">
                  <div className="unit-icon">📑</div>
                  <div className="unit-info">
                    <div className="unit-title">{getUnitDisplayName(u)}</div>
                    <div className="unit-meta">
                      <span className="unit-code">{u}</span>
                      <span className="article-count">{unitArticles.length} 篇文章</span>
                    </div>
                  </div>
                </div>

                <div className="unit-header-right">
                  <div className="unit-progress">
                    <div className="progress-circle" style={{
                      background: `conic-gradient(#4f46e5 ${unitProgress * 3.6}deg, #e5e7eb 0deg)`
                    }}>
                      <span>{unitProgress}%</span>
                    </div>
                  </div>
                  <div className="expand-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={`unit-content ${isExpanded ? 'show' : ''}`}>
                <div className="articles-list">
                  {unitArticles.map(art => {
                    const isRead = isArticleRead(art.id);
                    return (
                      <div
                        key={art.id}
                        className={`article-card ${isRead ? 'read' : ''}`}
                        onClick={() => onSelectArticle(art)}
                      >
                        <div className="article-card-left">
                          <div className="article-status">
                            <div className={`status-dot ${isRead ? 'read' : 'unread'}`}></div>
                          </div>
                          <div className="article-content">
                            <h3 className="article-title">{art.title}</h3>
                            <div className="article-id">{art.id}</div>
                          </div>
                        </div>

                        <div className="article-card-right">
                          <div className={`read-badge ${isRead ? 'read' : 'unread'}`}>
                            {isRead ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                                已读
                              </>
                            ) : '未读'}
                          </div>
                          <div className="select-hint">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

UnitList.displayName = 'UnitList';

// ==================== 2. 修复后的主应用组件 ====================

const IntegratedEnglishApp = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [R_name, setR_name] = useState("");
  const [stage, setStage] = useState('grade');
  const [allData, setAllData] = useState(null);
  const [selectedCat, setSelectedCat] = useState('7A');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [word, setWord] = useState("");
  const [targetWords, setTargetWords] = useState([]);
  const [ShowWordBook_1, setShowWordBook_1] = useState(false);

  const [readStatus, setReadStatus] = useState({});
  const [activeWord, setActiveWord] = useState(null);
  const [userClickedWord, setUserClickedWord] = useState(null);

  const API_BASE_URL = 'https://www.ddstudent.xyz/server/english/';

  // 缓存计时器
  const scrollTimerRef = useRef(null);

  const loadReadingProgressFromServer = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        const saved = localStorage.getItem('english_reading_progress');
        return saved ? JSON.parse(saved) : {};
      }

      const response = await fetch(`${API_BASE_URL}/progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      }

      const saved = localStorage.getItem('english_reading_progress');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('加载阅读进度失败:', error);
      const saved = localStorage.getItem('english_reading_progress');
      return saved ? JSON.parse(saved) : {};
    }
  }, [API_BASE_URL]);

  const saveReadingProgressToServer = useCallback(async (articleId, grade, unit) => {
    try {
      const token = getToken();
      if (!token) {
        // 本地存储逻辑
        const saved = localStorage.getItem('english_reading_progress');
        let localData = saved ? JSON.parse(saved) : {};

        if (!localData[grade]) localData[grade] = {};
        if (!localData[grade][unit]) localData[grade][unit] = {};

        localData[grade][unit][articleId] = {
          read: true,
          readAt: new Date().toISOString(),
          lastRead: new Date().toLocaleString('zh-CN')
        };

        localStorage.setItem('english_reading_progress', JSON.stringify(localData));
        return true;
      }

      const response = await fetch(`${API_BASE_URL}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleId,
          grade,
          unit,
          readStatus: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return true;
        }
      }

      // 服务器失败时降级到本地存储
      const saved = localStorage.getItem('english_reading_progress');
      let localData = saved ? JSON.parse(saved) : {};

      if (!localData[grade]) localData[grade] = {};
      if (!localData[grade][unit]) localData[grade][unit] = {};

      localData[grade][unit][articleId] = {
        read: true,
        readAt: new Date().toISOString(),
        lastRead: new Date().toLocaleString('zh-CN')
      };

      localStorage.setItem('english_reading_progress', JSON.stringify(localData));
      return true;
    } catch (error) {
      console.error('保存阅读进度失败:', error);

      // 异常时也降级到本地存储
      const saved = localStorage.getItem('english_reading_progress');
      let localData = saved ? JSON.parse(saved) : {};

      if (!localData[grade]) localData[grade] = {};
      if (!localData[grade][unit]) localData[grade][unit] = {};

      localData[grade][unit][articleId] = {
        read: true,
        readAt: new Date().toISOString(),
        lastRead: new Date().toLocaleString('zh-CN')
      };

      localStorage.setItem('english_reading_progress', JSON.stringify(localData));
      return false;
    }
  }, [API_BASE_URL]);

  // 初始化阅读进度
  useEffect(() => {
    const initReadingProgress = async () => {
      const progress = await loadReadingProgressFromServer();
      setReadStatus(progress);
    };

    initReadingProgress();
  }, [loadReadingProgressFromServer]);

  // 处理文章数据
  useEffect(() => {
    const processData = () => {
      try {
        const formattedData = {};
        const dataToProcess = lessonsData.default || lessonsData;

        // 检查数据结构
        if (dataToProcess['7A'] && dataToProcess['7A']['U1']) {
          console.log('使用标准数据结构');
          setAllData(dataToProcess);
        } else {
          console.log('使用兼容数据结构');
          // 处理兼容数据结构
          const grades = ['7A', '7B', '8A', '8B', '9A', '9B'];

          grades.forEach(grade => {
            if (dataToProcess[grade]) {
              formattedData[grade] = {};

              if (typeof dataToProcess[grade] === 'object') {
                Object.keys(dataToProcess[grade]).forEach(unitKey => {
                  if (unitKey.startsWith('U')) {
                    const unitData = dataToProcess[grade][unitKey];

                    if (Array.isArray(unitData)) {
                      formattedData[grade][unitKey] = unitData.map(article => ({
                        id: article.id || `${grade}_${unitKey}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        title: article.title || `文章 ${grade} ${unitKey}`,
                        content: article.content || article.text || '文章内容为空'
                      }));
                    }
                  }
                });
              }
            }
          });

          console.log('格式化后的数据:', dataToProcess);
          setAllData(dataToProcess);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to process lessons data:', error);
        message.error('处理文章数据失败');
        setLoading(false);
      }
    };

    processData();
  }, []);

  // 计算总文章数（缓存版）
  const totalArticlesByGrade = useMemo(() => {
    if (!allData) return {};

    const counts = {};
    Object.keys(allData).forEach(grade => {
      let total = 0;
      Object.values(allData[grade]).forEach(unit => {
        if (Array.isArray(unit)) {
          total += unit.length;
        }
      });
      counts[grade] = total;
    });

    return counts;
  }, [allData]);

  const markAsRead = useCallback(async (articleId) => {
    if (!articleId) return;

    const gradeMatch = articleId.match(/^(7A|7B|8A|8B|9A|9B)/);
    const unitMatch = articleId.match(/U[1-8]/);

    let grade = gradeMatch ? gradeMatch[0] : selectedCat;
    let unit = unitMatch ? unitMatch[0] : 'other';

    if (!grade) return;

    // 批量更新状态
    const newReadStatus = { ...readStatus };
    if (!newReadStatus[grade]) newReadStatus[grade] = {};
    if (!newReadStatus[grade][unit]) newReadStatus[grade][unit] = {};

    newReadStatus[grade][unit][articleId] = {
      read: true,
      readAt: new Date().toISOString(),
      lastRead: new Date().toLocaleString('zh-CN')
    };

    setReadStatus(newReadStatus);

    // 异步保存，不阻塞UI
    saveReadingProgressToServer(articleId, grade, unit)
      .then(() => {
        message.success('已标记为已读', 1);
      })
      .catch(() => {
        message.warning('进度已保存到本地');
      });
  }, [selectedCat, readStatus, saveReadingProgressToServer]);

  const isArticleRead = useCallback((articleId) => {
    if (!articleId) return false;

    const gradeMatch = articleId.match(/^(7A|7B|8A|8B|9A|9B)/);
    const unitMatch = articleId.match(/U[1-8]/);

    let grade = gradeMatch ? gradeMatch[0] : selectedCat;
    let unit = unitMatch ? unitMatch[0] : 'other';

    return readStatus[grade]?.[unit]?.[articleId]?.read || false;
  }, [readStatus, selectedCat]);

  // 获取已读文章ID列表
  const getReadArticleIds = useMemo(() => {
    const ids = [];
    Object.entries(readStatus).forEach(([grade, units]) => {
      Object.entries(units).forEach(([unit, articles]) => {
        Object.entries(articles).forEach(([articleId, status]) => {
          if (status.read) {
            ids.push(articleId);
          }
        });
      });
    });

    return ids;
  }, [readStatus]);

  // 获取年级阅读统计
  const getGradeReadStats = useMemo(() => {
    if (!allData) return {};

    const stats = {};
    Object.keys(allData).forEach(grade => {
      stats[grade] = {};
      Object.entries(allData[grade]).forEach(([unit, articles]) => {
        if (Array.isArray(articles)) {
          articles.forEach(article => {
            const gradeMatch = article.id?.match(/^(7A|7B|8A|8B|9A|9B)/);
            const unitMatch = article.id?.match(/U[1-8]/);

            let gradeKey = gradeMatch ? gradeMatch[0] : grade;
            let unitKey = unitMatch ? unitMatch[0] : unit;

            const isRead = readStatus[gradeKey]?.[unitKey]?.[article.id]?.read || false;
            stats[grade][article.id] = { read: isRead };
          });
        }
      });
    });

    return stats;
  }, [allData, readStatus]);

  const getCurrentUnitData = useMemo(() => {
    console.log('3333333333333',allData,selectedCat)
    return allData?.[selectedCat] || {};
  }, [allData, selectedCat]);

  // 优化单词点击处理
  const handleWordClick = useCallback((clickedWord) => {

    setWord(clickedWord);
    return
    if (!clickedWord) return;

    const clickedWordLower = clickedWord.toLowerCase();
    const isPhrase = targetWords.some(tw => tw.toLowerCase() === clickedWordLower);

    // 使用防抖，避免快速点击
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }

    if (isPhrase) {
      const originalPhrase = targetWords.find(tw => tw.toLowerCase() === clickedWordLower);
      F_speak(originalPhrase);
      setWord(originalPhrase);
      setUserClickedWord(originalPhrase);
    } else {
      F_speak(clickedWord);
      setWord(clickedWord);
      setUserClickedWord(clickedWord);
    }
  }, [targetWords]);

  // 优化单词变化处理
  const handleWordChange_2 = useCallback(({ newWords, currentMode, activeWord: vocabActiveWord }) => {
    console.log('1111反馈', newWords, vocabActiveWord, activeWord)
    if (newWords && Array.isArray(newWords)) {
      setTargetWords(newWords);
    }

    if (vocabActiveWord && currentMode === 'reading') {
      const word = vocabActiveWord.word;
      setActiveWord(word);
      F_speak(word);

      // 延迟滚动，避免阻塞
      scrollTimerRef.current = setTimeout(() => {
        const wordElements = document.querySelectorAll('.word-element, .phrase-element');
        let found = false;

        for (let i = 0; i < wordElements.length; i++) {
          const el = wordElements[i];
          if (el.textContent.toLowerCase() === word.toLowerCase()) {
            el.classList.add('temp-highlight');

            // 使用 requestAnimationFrame 实现平滑滚动
            requestAnimationFrame(() => {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });

            // 延迟移除高亮
            setTimeout(() => {
              el.classList.remove('temp-highlight');
            }, 2000);

            found = true;
            break;
          }
        }

        if (!found && wordElements.length > 0) {
          wordElements[0].scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  const handleLogout = () => {
    clearToken();
    message.success("已退出登录");
    navigate("/O_Is_login");
  };

  // 清理计时器
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">加载英语阅读资源...</div>
        <div className="loading-subtext">正在准备您的学习内容</div>
      </div>
    </div>
  );

  if (!allData || Object.keys(allData).length === 0) {
    return (
      <div className="error-screen">
        <div className="error-icon">📚</div>
        <div className="error-title">未找到文章数据</div>
        <div className="error-message">请检查 data/lessons.json 文件是否存在且格式正确</div>
      </div>
    );
  }

  return (
    <div className="english-app">
      <header className="app-header">
        <div className="header-center">
          <div className="stats-panel">
            {/* 统计数据可以根据需要添加 */}
          </div>
        </div>

        <div className="header-right">
          <div className="action-buttons">
            <button
              className={`action-button ${ShowWordBook_1 ? 'active' : ''}`}
              onClick={() => setShowWordBook_1(!ShowWordBook_1)}
            >
              <span className="button-text">复习</span>
            </button>

            <button
              className={`action-button ${isVocabOpen ? 'active' : ''}`}
              onClick={() => setIsVocabOpen(!isVocabOpen)}
            >
              <span className="button-text">我的词库</span>
            </button>

            <button
              className="action-button secondary"
              onClick={() => navigate("/")}
            >
              <span className="button-icon">🏠</span>
            </button>
          </div>

          {isLoggedIn && (
            <div className="user-profile">
              <div className="user-avatar">{R_name.charAt(0)}</div>
              <div className="user-info">
                <div className="user-name">{R_name}</div>
                <button className="logout-button" onClick={handleLogout}>退出</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className={`content-area ${isVocabOpen ? 'with-sidebar' : ''}`}>
          <div className="content-wrapper">
            {stage === 'grade' && (
              <div className="grade-selector-container">
                <div className="page-header">
                  <h1 className="page-title">选择年级</h1>
                  <p className="page-description">请选择您要学习的年级和课本</p>
                </div>
                <GradeSelector
                  onSelect={(grade) => {
                    setSelectedCat(grade);
                    setStage('list');
                  }}
                  readStats={getGradeReadStats}
                  totalArticlesByGrade={totalArticlesByGrade}
                />
              </div>
            )}

            {stage === 'list' && (
              <div className="unit-list-container">
                <UnitList
                  units={getCurrentUnitData}
                  onBack={() => setStage('grade')}
                  onSelectArticle={(art) => {
                    setSelectedArticle(art);
                    setStage('content');
                  }}
                  readArticles={getReadArticleIds}
                  grade={selectedCat}
                />
              </div>
            )}

            {stage === 'content' && selectedArticle && (
              <ContentView
                selectedArticle={selectedArticle}
                onWordClick={handleWordClick}
                onBack={() => setStage('list')}
                highlightWords={targetWords}
                activeWord={activeWord}
                userClickedWord={userClickedWord}
                markAsRead={markAsRead}
                isArticleRead={isArticleRead}
              />
            )}
          </div>
        </div>

        {isVocabOpen && (
          <div className="vocab-sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">我的词库</h3>
              <button
                className="sidebar-close"
                onClick={() => setIsVocabOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="sidebar-content" style={{
              position: 'fixed', // 或 'absolute', 'relative', 'sticky'
              zIndex: 999
            }}>
              <VocabularyMaster
                getToken={getToken()}
                clickWork={word}
                onClose={() => setIsVocabOpen(false)}
                onWordChange={handleWordChange_2}
                G_word_name={'word_reading_study'}
              />
            </div>
          </div>
        )}

        {ShowWordBook_1 && (
          <div className="wordbook-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>单词复习本</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowWordBook_1(false)}
                >
                  ×
                </button>
              </div>
              <WordBook
                G_json={'word_reading_review'}
                onClose={() => setShowWordBook_1(false)}
              />
            </div>
          </div>
        )}
      </main>

      <style>{`
        /* 重置和基础样式 */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
        }

        .english-app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* 加载和错误页面 */
        .loading-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-content {
          text-align: center;
          color: white;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin: 0 auto 20px;
        }

        .loading-text {
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .loading-subtext {
          font-size: 14px;
          opacity: 0.8;
        }

        .error-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 40px;
        }

        .error-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .error-title {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .error-message {
          font-size: 16px;
          color: #64748b;
          text-align: center;
        }

        /* 头部样式 */
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 80px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-center {
          flex: 2;
          display: flex;
          justify-content: center;
        }

        .stats-panel {
          display: flex;
          gap: 24px;
        }

        .header-right {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1.5px solid #2563eb;
          background: white;
          color: #2563eb;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-size: 14px;
        }

        .action-button:hover {
          background: #2563eb;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .action-button.active {
          background: #2563eb;
          color: white;
        }

        .action-button.secondary {
          border-color: #d1d5db;
          color: #374151;
        }

        .action-button.secondary:hover {
          background: #f9fafb;
          color: #1f2937;
        }

        .button-icon {
          font-size: 16px;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .logout-button {
          font-size: 12px;
          color: #ef4444;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .logout-button:hover {
          background: #fee2e2;
        }

        /* 主要内容区域 */
        .app-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .content-area {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .content-area.with-sidebar {
          flex: 3;
        }

        .content-wrapper {
          max-width: 1000px;
          margin: 0 auto;
          padding: 32px;
        }

        /* 年级选择页面 */
        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .page-description {
          font-size: 16px;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto;
        }

        .grade-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }

        .grade-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .grade-card:hover {
          transform: translateY(-4px);
          border-color: #2563eb;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.1);
        }

        .grade-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .grade-card:hover::before {
          opacity: 1;
        }

        .grade-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .grade-icon {
          font-size: 32px;
        }

        .grade-info {
          flex: 1;
        }

        .grade-name {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .grade-code {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .progress-section {
          margin-bottom: 16px;
        }

        .progress-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          border-radius: 4px;
          transition: width 1s ease;
        }

        .progress-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-percent {
          font-size: 20px;
          font-weight: 700;
          color: #2563eb;
        }

        .progress-count {
          font-size: 14px;
          color: #64748b;
        }

        /* 单元列表页面 */
        .list-header {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .list-title {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 28px;
          color: #1e293b;
          margin: 20px 0;
        }

        .grade-badge {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 20px;
          font-weight: 600;
        }

        .unit-count {
          font-size: 14px;
          color: #64748b;
          background: #f8fafc;
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
        }

        .unit-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .unit-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .unit-card.expanded {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .unit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .unit-header:hover {
          background: #f8fafc;
        }

        .unit-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .unit-icon {
          font-size: 24px;
        }

        .unit-info {
          flex: 1;
        }

        .unit-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .unit-meta {
          display: flex;
          gap: 12px;
          font-size: 14px;
          color: #64748b;
        }

        .unit-header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .progress-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .progress-circle::before {
          content: '';
          position: absolute;
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
        }

        .progress-circle span {
          position: relative;
          z-index: 1;
          font-size: 12px;
          font-weight: 600;
          color: #2563eb;
        }

        .unit-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .unit-content.show {
          max-height: 1000px;
        }

        .articles-list {
          padding: 0 24px 24px;
        }

        .article-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .article-card:hover {
          transform: translateX(4px);
          border-color: #2563eb;
          background: #f0f9ff;
        }

        .article-card.read {
          background: #f0f9ff;
          border-color: #dbeafe;
        }

        .article-card-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .article-status {
          position: relative;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-dot.read {
          background: #10b981;
        }

        .status-dot.unread {
          background: #d1d5db;
        }

        .article-content {
          flex: 1;
        }

        .article-card .article-title {
          font-size: 16px;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .article-id {
          font-size: 12px;
          color: #94a3b8;
          font-family: 'SF Mono', Monaco, 'Cascadia Mono', monospace;
        }

        .article-card-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .read-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .read-badge.read {
          background: #d1fae5;
          color: #065f46;
        }

        .read-badge.unread {
          background: #f3f4f6;
          color: #6b7280;
        }

        /* 阅读页面 */
        .content-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .content-header {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          color: #475569;
          transition: all 0.2s;
        }

        .back-button:hover {
          border-color: #2563eb;
          color: #2563eb;
          background: #f0f9ff;
        }

        .article-info-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
        }

        .reading-stats {
          display: flex;
          gap: 16px;
        }

        .stat-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f8fafc;
          border-radius: 20px;
          font-size: 14px;
        }

        .stat-icon {
          font-size: 16px;
        }

        .stat-value {
          font-weight: 600;
          color: #1e293b;
        }

        .article-actions {
          display: flex;
          gap: 12px;
        }

        .mark-read-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .mark-read-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .read-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #d1fae5;
          color: #065f46;
          border-radius: 8px;
          font-weight: 600;
        }

        .article-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          margin-bottom: 32px;
        }

        .article-header-section {
          padding: 48px 48px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }

        .article-title {
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 20px;
          line-height: 1.3;
          text-align: center;
        }

        .reading-content {
          padding: 40px 48px;
          background: #fefefe;
        }

        .no-content-message {
          text-align: center;
          padding: 40px;
          color: #64748b;
          font-size: 18px;
        }

        .paragraph {
          display: flex;
          margin-bottom: 32px;
        }

        .paragraph-content {
          flex: 1;
          font-size: 25px;
          line-height: 1.8;
          color: #334155;
          font-family: 'Georgia', 'Times New Roman', serif;
          text-align: justify;
          text-indent: 2em;
        }

        /* 单词和短语样式 */
        .word-element, .phrase-element {
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          padding: 0 2px;
          border-radius: 3px;
          display: inline;
        }

        .word-element:hover, .phrase-element:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .word-element.highlighted-word {
          background: #fef08a;
          color: #92400e;
          font-weight: 600;
        }

        .word-element.active-word {
          background: #3b82f6 !important;
          color: white !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
          animation: pulse-blue 2s infinite;
        }

        .word-element.clicked-word {
          background: #ec4899 !important;
          color: white !important;
          box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.3);
        }

        .phrase-element.highlighted-phrase {
          background: #fbbf24;
          color: #78350f;
          // padding: 2px 6px;
          margin: 0 1px;
          // border-radius: 4px;
          // font-weight: 600;
        }

        .phrase-element.active-phrase {
          background: #dc2626 !important;
          color: white !important;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.3);
          animation: pulse-red 2s infinite;
        }

        .phrase-element.clicked-phrase {
          background: #db2777 !important;
          color: white !important;
          box-shadow: 0 0 0 2px rgba(219, 39, 119, 0.3);
        }

        .word-element.temp-highlight,
        .phrase-element.temp-highlight {
          animation: flash-highlight 0.5s ease-in-out 3;
        }

        /* 侧边栏 */
        .vocab-sidebar {
          width: 450px;
          background: #1e293b;
          color: white;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #334155;
        }

        .sidebar-title {
          font-size: 20px;
          font-weight: 600;
        }

        .sidebar-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .sidebar-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        /* 模态框 */
        .wordbook-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .modal-close:hover {
          background: #f1f5f9;
        }

        /* 动画 */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-blue {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
          }
        }

        @keyframes pulse-red {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(220, 38, 38, 0);
          }
        }

        @keyframes flash-highlight {
          0%, 100% {
            background-color: #3b82f6;
            color: white;
          }
          50% {
            background-color: #60a5fa;
            color: white;
          }
        }

        /* 响应式设计 */
        @media (max-width: 1200px) {
          .grade-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .app-header {
            flex-direction: column;
            height: auto;
            padding: 20px;
            gap: 20px;
          }

          .stats-panel {
            flex-wrap: wrap;
            justify-content: center;
          }

          .action-buttons {
            flex-wrap: wrap;
            justify-content: center;
          }

          .grade-grid {
            grid-template-columns: 1fr;
          }

          .article-title {
            font-size: 28px;
          }

          .reading-content {
            padding: 24px;
          }

          .paragraph-content {
            font-size: 20px;
          }

          .vocab-sidebar {
            width: 100%;
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
          }
        }

        @media (max-width: 480px) {
          .content-wrapper {
            padding: 16px;
          }

          .article-header-section {
            padding: 32px 24px;
          }

          .article-title {
            font-size: 24px;
            text-align: center;
          }

          .stat-badge {
            padding: 6px 12px;
            font-size: 12px;
          }
          
          .paragraph-content {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default IntegratedEnglishApp;