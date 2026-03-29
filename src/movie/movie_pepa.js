import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import "./scss/movie_pepa.scss";
import { F_translator, F_speak } from "../Function/weisimin.js";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { getToken } from "../config.js";
import VideoPlayer from './VideoPlayer.js';
import { playlist } from './data/vidioPlaylist.js';

import Work_2 from "../word/workStudy.js";
import PepaSentence from "./pepa_sentence_listen.js";
import WordBook from "../word/wordReviewBook.js";
import Notebook from '../notebook/notebook.js';

// ==================== 常量配置 ====================
const COLORS = [
  '#4ec9b0', '#569cd6', '#c586c0', '#dcdcaa', '#ce9178', 
  '#d7ba7d', '#9cdcfe', '#d16969', '#b5cea8', '#646695',
  '#ff6b6b', '#51cf66', '#ff922b', '#339af0', '#cc5de8',
  '#20c997', '#f06595', '#ffd43b', '#74c0fc', '#63e6be'
];

const ITEM_HEIGHT = 72;
const SCROLL_BUFFER = 3;
const CLICK_DELAY = 300;

let G_subtitles = [];

// ==================== 工具函数 ====================
const generateWordColor = (word) => {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = word.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const parseDualLanguageSRT = (content) => {
  const subs = [];
  const blocks = content.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n").filter(line => line.trim());
    if (lines.length < 3) continue;

    const id = parseInt(lines[0].trim());
    if (isNaN(id)) continue;

    const timeMatch = lines[1].match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/
    );
    if (!timeMatch) continue;

    const parseTime = (timeStr) => {
      const [hms, ms] = timeStr.split(",");
      const [h, m, s] = hms.split(":");
      return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
    };

    const textLines = lines.slice(2);
    let englishLines = [];

    for (const line of textLines) {
      const englishLine = line.replace(/<i>.*?<\/i>/g, "").trim();
      if (englishLine) englishLines.push(englishLine);
    }

    const sub = {
      id,
      english: englishLines.join(" "),
      start: parseTime(timeMatch[1]),
      end: parseTime(timeMatch[2]),
    };

    if (sub.english) subs.push(sub);
  }

  return subs;
};

// ==================== 主组件 ====================
const App = () => {
  const navigate = useNavigate();
  const videoPlayerRef = useRef(null);
  const lastClickTime = useRef(0);
  const playlistContainerRef = useRef(null);
  const scrollThrottleTimer = useRef(null);
  
  // 视频相关状态
  const [videoSrc, setVideoSrc] = useState("https://www.ddstudent.xyz/server/resource/common/book/chinese/课内/video/南禅七日/1//output.m3u8");
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [currentSubIndex, setCurrentSubIndex] = useState(-1);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  
  // UI状态
  const [showFloatingSubtitle, setShowFloatingSubtitle] = useState(true); // 字幕显示状态
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(true);
  const [isClicking, setIsClicking] = useState(false);
  
  // 单词相关状态
  const [translate, setTranslate] = useState("");
  const [clickedWord, setClickedWord] = useState("");
  const [clickWork, setClickWork] = useState('');
  const [highlightedWords, setHighlightedWords] = useState(new Map());
  const [highlightedWord, setHighlightedWord] = useState("");
  
  // 模态框状态
  const [showWork, setShowWork] = useState(false);
  const [showPePaSentence, setShowPePaSentence] = useState(false);
  const [showWordBook, setShowWordBook] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  
  // 播放列表状态
  const [videoPlaylist, setVideoPlaylist] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // 笔记本上下文
  const [notebookContext, setNotebookContext] = useState({
    initialText: '',
    videoContext: null,
  });

  // 虚拟滚动状态
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  // ==================== 视频控制函数 ====================
  const updateCurrentSubtitle = (index) => {
    if (index < 0 || index >= subtitles.length) return;
    setCurrentSubIndex(index);
    setCurrentSubtitle(subtitles[index]);
  };

  const jumpToSubtitle = (index) => {
    if (index < 0 || index >= G_subtitles.length) return;
    setCurrentSubIndex(index);
    setCurrentSubtitle(G_subtitles[index]);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.setCurrentTime(G_subtitles[index].start);
    }
  };

  const jumpToPrevSubtitle = () => {
    if (currentSubIndex > 0) jumpToSubtitle(currentSubIndex - 1);
  };

  const jumpToNextSubtitle = () => {
    if (currentSubIndex < subtitles.length - 1) jumpToSubtitle(currentSubIndex + 1);
  };

  const handlePlayPause = () => {
    if (videoPlayerRef.current) {
      const videoElement = videoPlayerRef.current.getVideoElement();
      if (videoElement) {
        videoElement.paused ? videoPlayerRef.current.play() : videoPlayerRef.current.pause();
      }
    }
  };

  // ==================== 字幕显示切换 ====================
  const toggleSubtitles = () => {
    setShowFloatingSubtitle(!showFloatingSubtitle);
    message.info(!showFloatingSubtitle ? '字幕已显示' : '字幕已隐藏');
  };

  // ==================== 同步PepaSentence的隐藏状态 ====================
  const handlePepaSentenceHideChange = useCallback((isHidden) => {
    // 当PepaSentence隐藏时，同步隐藏主App的字幕
    setShowFloatingSubtitle(!isHidden);
    if (isHidden) {
      message.info('PepaSentence隐藏，字幕同步隐藏');
    } else {
      message.info('PepaSentence显示，字幕同步显示');
    }
  }, []);

  // ==================== 清除高亮 ====================
  const clearHighlights = () => {
    setHighlightedWords(new Map());
    setHighlightedWord("");
    message.success('已清除所有高亮');
  };

  // ==================== 修改后的单词查找功能 ====================
  const handleWordClick = async (word) => {
    const now = Date.now();
    if (isClicking || now - lastClickTime.current < CLICK_DELAY) return;

    try {
      setIsClicking(true);
      lastClickTime.current = now;
      
      const cleanedWord = word.replace(/[.,!?;:'"()\[\]{}]/g, "").toLowerCase().trim();
      if (!cleanedWord) return;

      const isPhrase = cleanedWord.includes(' ');
      const wordPhrases = isPhrase ? cleanedWord.split(/\s+/) : [];
      
      const foundIndices = [];

      // 首先收集所有匹配的索引
      G_subtitles.forEach((subtitle, index) => {
        if (!subtitle.english) return;
        const text = subtitle.english.toLowerCase().replace(/[.,!?;:'"()\[\]{}]/g, "");
        
        if (isPhrase) {
          if (text.includes(cleanedWord)) foundIndices.push(index);
        } else {
          if (text.split(/\s+/).includes(cleanedWord)) foundIndices.push(index);
        }
      });

      if (foundIndices.length > 0) {
        // 找到当前字幕之后的下一个匹配
        let targetIndex = foundIndices[0]; // 默认跳转到第一个
        
        // 如果当前有字幕且当前索引有效，尝试找到下一个匹配
        if (currentSubIndex >= 0) {
          // 在当前索引之后查找
          const nextMatch = foundIndices.find(index => index > currentSubIndex);
          if (nextMatch !== undefined) {
            targetIndex = nextMatch;
          } else {
            // 如果没有找到之后的，就回到第一个
            targetIndex = foundIndices[0];
            message.info('已到达最后一个匹配，回到开头');
          }
        }
        
        // 跳转到目标字幕
        jumpToSubtitle(targetIndex);
        
        const color = generateWordColor(cleanedWord);
        setHighlightedWords(prev => {
          const newMap = new Map(prev);
          newMap.set(cleanedWord, { color, indices: foundIndices, timestamp: Date.now() });
          return newMap;
        });
        
        setHighlightedWord(cleanedWord);
        message.success(`找到 ${foundIndices.length} 处匹配，跳转到第 ${targetIndex + 1} 句`);
      } else {
        // 尝试更宽松的搜索
        const relaxedIndices = [];
        
        G_subtitles.forEach((subtitle, index) => {
          if (!subtitle.english) return;
          
          const subtitleLower = subtitle.english.toLowerCase();
          
          if (isPhrase) {
            const hasAnyWord = wordPhrases.some(phraseWord => 
              subtitleLower.includes(phraseWord)
            );
            if (hasAnyWord) {
              relaxedIndices.push(index);
            }
          } else {
            if (subtitleLower.includes(cleanedWord)) {
              relaxedIndices.push(index);
            }
          }
        });

        if (relaxedIndices.length > 0) {
          // 同样应用"当前之后"的逻辑
          let targetIndex = relaxedIndices[0];
          if (currentSubIndex >= 0) {
            const nextMatch = relaxedIndices.find(index => index > currentSubIndex);
            if (nextMatch !== undefined) {
              targetIndex = nextMatch;
            } else {
              targetIndex = relaxedIndices[0];
              message.info('已到达最后一个匹配，回到开头');
            }
          }
          
          jumpToSubtitle(targetIndex);
          
          const color = generateWordColor(cleanedWord);
          setHighlightedWords(prev => {
            const newMap = new Map(prev);
            newMap.set(cleanedWord, {
              color,
              indices: relaxedIndices,
              timestamp: Date.now(),
              isRelaxedMatch: true,
              originalWord: word
            });
            return newMap;
          });
          
          setHighlightedWord(cleanedWord);
          message.info(`找到 ${relaxedIndices.length} 处相关字幕（模糊匹配），跳转到第 ${targetIndex + 1} 句`);
        } else {
          message.warning(`未找到包含 "${word}" 的字幕`);
        }
      }
    } catch (error) {
      console.error("处理单词点击时出错:", error);
      message.error("查找失败，请重试");
    } finally {
      setTimeout(() => {
        setIsClicking(false);
      }, 300);
    }
  };

  // ==================== 单词点击处理 ====================
  const F_word_click = (word) => {
    const cleanedWord = word.replace(/[.,!?;:'"()\[\]{}]/g, "").trim();
    if (!cleanedWord) return;
    
    setClickWork(cleanedWord);
    setNotebookContext(prev => ({
      ...prev,
      initialText: cleanedWord,
      videoContext: {
        ...prev.videoContext,
        word: cleanedWord,
        subtitle: currentSubtitle?.english,
        videoTitle: videoPlaylist[currentVideoIndex]?.title,
        currentTime: videoPlayerRef.current?.getCurrentTime(),
      }
    }));

    F_translator(cleanedWord).then(setTranslate);
    F_speak(cleanedWord);
    setClickedWord(cleanedWord);
    handleWordClick(cleanedWord);
  };

  // ==================== 渲染字幕单词 ====================
  const renderSubtitleWords = (englishText, subtitleIndex) => {
    if (!englishText) return null;
    
    // 检查这个字幕是否包含高亮的单词
    const highlightedInThisSubtitle = [];
    highlightedWords.forEach((data, word) => {
      if (data.indices.includes(subtitleIndex)) {
        highlightedInThisSubtitle.push({
          word,
          color: data.color,
          isPhrase: word.includes(' '),
          originalWord: data.originalWord || word
        });
      }
    });

    // 如果没有高亮单词，直接渲染
    if (highlightedInThisSubtitle.length === 0) {
      const wordsArray = englishText.split(/\s+/);
      return wordsArray.map((word, index) => (
        <React.Fragment key={index}>
          <span
            className="word-span"
            onClick={() => F_word_click(word)}
            style={{
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "inherit",
              padding: "2px 2px",
              borderRadius: "3px",
              fontWeight: "normal",
              transition: "all 0.2s ease",
              display: "inline-block"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(78, 201, 176, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {word}
          </span>
          {" "}
        </React.Fragment>
      ));
    }

    // 有高亮单词，需要复杂渲染
    let renderedText = englishText;
    
    // 先按长度排序，避免短语被单词覆盖
    highlightedInThisSubtitle.sort((a, b) => b.word.length - a.word.length);

    // 为每个高亮单词添加标记
    highlightedInThisSubtitle.forEach(({ word, color, isPhrase, originalWord }) => {
      // 对于短语，使用正则表达式查找完整短语
      if (isPhrase) {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        renderedText = renderedText.replace(regex, (match) => {
          return `||${match}||`;
        });
      } else {
        // 对于单个单词，使用单词边界
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        renderedText = renderedText.replace(regex, (match) => {
          return `||${match}||`;
        });
      }
    });

    // 分割并渲染
    const parts = renderedText.split(/\|\|/);
    
    return parts.map((part, index) => {
      const highlightData = highlightedInThisSubtitle.find(data => {
        // 忽略大小写比较
        const partClean = part.replace(/[.,!?;:'"()\[\]{}]/g, "").toLowerCase();
        const wordClean = data.word.toLowerCase();
        return partClean === wordClean;
      });
      
      if (highlightData) {
        // 渲染高亮单词/短语
        return (
          <span
            key={index}
            className="word-span highlighted"
            onClick={() => F_word_click(part)}
            style={{
              cursor: "pointer",
              backgroundColor: highlightData.color + '40', // 添加透明度
              color: highlightData.color,
              padding: "2px 4px",
              borderRadius: "4px",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              display: "inline-block",
              margin: "0 1px",
              border: `1px solid ${highlightData.color}`,
              boxShadow: `0 0 3px ${highlightData.color}40`
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = highlightData.color + '60';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = highlightData.color + '40';
              e.target.style.transform = 'translateY(0)';
            }}
            title={`点击查找 "${highlightData.originalWord}" 的其他出现位置`}
          >
            {part}
          </span>
        );
      } else {
        // 渲染普通文本，但保持单词可点击
        const words = part.split(/\s+/);
        return (
          <React.Fragment key={index}>
            {words.map((word, wordIndex) => (
              <React.Fragment key={wordIndex}>
                {word && (
                  <span
                    className="word-span"
                    onClick={() => F_word_click(word)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "transparent",
                      color: "inherit",
                      padding: "2px 2px",
                      borderRadius: "3px",
                      transition: "all 0.2s ease",
                      display: "inline-block"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(78, 201, 176, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {word}
                  </span>
                )}
                {wordIndex < words.length - 1 && " "}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      }
    });
  };

  // ==================== 视频切换 ====================
  const switchVideo = async (videoIndex) => {
    if (videoIndex < 0 || videoIndex >= videoPlaylist.length) return;

    const video = videoPlaylist[videoIndex];

    try {
      setVideoSrc(video.src);
      setCurrentVideoIndex(videoIndex);

      const response = await fetch(video.subtitleUrl);
      if (!response.ok) throw new Error(`获取字幕失败: ${response.status}`);

      const subtitleContent = await response.text();
      const parsedSubtitles = parseDualLanguageSRT(subtitleContent);

      const sortedSubtitles = [...parsedSubtitles].sort((a, b) => a.start - b.start);
      const cleanedSubtitles = sortedSubtitles.map((sub, index) => ({
        ...sub,
        id: index + 1,
        english: sub.english
          .replace(/\s+/g, ' ')
          .replace(/^\s+|\s+$/g, '')
          .replace(/<[^>]*>/g, '')
          .trim()
      })).filter(sub => sub.english.length > 0);
      
      G_subtitles = cleanedSubtitles;
      setSubtitles(cleanedSubtitles);
      setCurrentSubIndex(-1);
      setCurrentSubtitle(null);
      clearHighlights();
      setIsVideoLoaded(true);
      message.success(`已切换到: ${video.title}`);
    } catch (error) {
      console.error("切换视频失败:", error);
      message.error(`切换失败: ${error.message}`);
    }
  };

  // ==================== 设置字幕监听 ====================
  const setupSubtitleListener = () => {
    if (!videoPlayerRef.current) return null;

    const videoElement = videoPlayerRef.current.getVideoElement();
    if (!videoElement || typeof videoElement.addEventListener !== 'function') return null;

    const updateSubtitle = () => {
      if (!videoPlayerRef.current) return;
      const currentTime = videoPlayerRef.current.getCurrentTime();

      const activeIndex = G_subtitles.findIndex(
        (sub) => currentTime >= sub.start && currentTime < sub.end
      );

      if (activeIndex !== -1 && activeIndex !== currentSubIndex) {
        updateCurrentSubtitle(activeIndex);
      }
    };

    videoElement.addEventListener("timeupdate", updateSubtitle);
    return () => videoElement.removeEventListener("timeupdate", updateSubtitle);
  };

  // ==================== 键盘事件 ====================
  const handleKeyDown = (e) => {
    const activeElement = document.activeElement;
    const isInputFocused = 
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.closest?.('[contenteditable="true"], .notebook-container, .work-study-container, .wordbook-container');

    if (isInputFocused && e.key === ' ') return;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        jumpToPrevSubtitle();
        break;
      case "ArrowRight":
        e.preventDefault();
        jumpToNextSubtitle();
        break;
      case " ":
        e.preventDefault();
        handlePlayPause();
        break;
      case "Escape":
        clearHighlights();
        break;
      default:
        break;
    }
  };

  // ==================== 虚拟滚动 ====================
  const handlePlaylistScroll = useCallback(() => {
    if (!playlistContainerRef.current || isPlaylistCollapsed) return;
    if (scrollThrottleTimer.current) return;

    scrollThrottleTimer.current = setTimeout(() => {
      const container = playlistContainerRef.current;
      if (!container) return;

      const { scrollTop, clientHeight } = container;
      const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - SCROLL_BUFFER);
      const end = Math.min(videoPlaylist.length, Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + SCROLL_BUFFER);
      
      setVisibleRange({ start, end });
      scrollThrottleTimer.current = null;
    }, 50);
  }, [videoPlaylist.length, isPlaylistCollapsed]);

  // ==================== 可见视频项 ====================
  const visibleVideoItems = useMemo(() => {
    if (isPlaylistCollapsed || videoPlaylist.length === 0) return [];
    
    const { start, end } = visibleRange;
    const safeEnd = Math.min(end, videoPlaylist.length);
    
    return videoPlaylist.slice(start, safeEnd).map((video, i) => ({
      ...video,
      globalIndex: start + i,
      offset: (start + i) * ITEM_HEIGHT,
    }));
  }, [videoPlaylist, visibleRange, isPlaylistCollapsed]);

  // ==================== Effects ====================
  useEffect(() => {
    setVideoPlaylist(playlist);
  }, []);

  useEffect(() => {
    if (videoPlaylist.length > 0) {
      switchVideo(0);
    }
  }, [videoPlaylist]);

  useEffect(() => {
    if (!isVideoLoaded || subtitles.length === 0) return;

    const timer = setTimeout(() => {
      const cleanup = setupSubtitleListener();
      return cleanup;
    }, 1000);

    return () => clearTimeout(timer);
  }, [isVideoLoaded, subtitles, currentSubIndex]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSubIndex, subtitles]);

  useEffect(() => {
    const container = playlistContainerRef.current;
    if (!container || isPlaylistCollapsed) return;

    container.addEventListener('scroll', handlePlaylistScroll);
    handlePlaylistScroll();

    return () => {
      container.removeEventListener('scroll', handlePlaylistScroll);
      clearTimeout(scrollThrottleTimer.current);
    };
  }, [handlePlaylistScroll, isPlaylistCollapsed]);

  // ==================== 子组件回调 ====================
  const handleWordChange_2 = ({ activeWord }) => {
    if (activeWord) handleWordClick(activeWord.word);
  };

  const handleWordChange_3 = ({ sentenceId }) => {
    jumpToSubtitle(sentenceId);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().replace(/\s+/g, ' ').trim();
    if (selectedText) {
      setClickedWord(selectedText);
      setClickWork(selectedText);
      setNotebookContext(prev => ({
        ...prev,
        initialText: selectedText,
        videoContext: {
          ...prev.videoContext,
          word: selectedText,
          subtitle: currentSubtitle?.english,
          videoTitle: videoPlaylist[currentVideoIndex]?.title,
          currentTime: videoPlayerRef.current?.getCurrentTime(),
        }
      }));
      handleWordClick(selectedText);
    }
  };

  const togglePlaylist = () => {
    setIsPlaylistCollapsed(!isPlaylistCollapsed);
  };

  // ==================== 渲染 ====================
  return (
    <div className="english_tran_china"
      style={{
        backgroundColor: '#1e1e1e',
        minHeight: '100vh',
        color: '#d4d4d4'
      }}>
      
      {/* 左上角区域 - 一行显示所有按钮 */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap", // 允许换行，但尽量保持在一行
        maxWidth: "90vw" // 最大宽度为视窗宽度的90%
      }}>
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: "rgba(30, 30, 30, 0.9)",
            color: "#d4d4d4",
            border: "1px solid #3c3c3c",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#0e639c";
            e.target.style.borderColor = "#4ec9b0";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(30, 30, 30, 0.9)";
            e.target.style.borderColor = "#3c3c3c";
          }}
        >
          ← 返回
        </button>

        {/* 字幕显示状态反馈 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(37, 37, 38, 0.7)',
          padding: '4px 12px',
          borderRadius: '20px',
          border: `1px solid ${showFloatingSubtitle ? '#4ec9b0' : '#ef4444'}`,
          whiteSpace: "nowrap"
        }}>
          <span style={{ color: showFloatingSubtitle ? '#4ec9b0' : '#ef4444' }}>
            {showFloatingSubtitle ? '📝' : '🔇'}
          </span>
          <span style={{ fontSize: '12px', color: '#d4d4d4' }}>
            {showFloatingSubtitle ? '字幕显示' : '字幕隐藏'}
          </span>
          <button
            onClick={toggleSubtitles}
            style={{
              background: showFloatingSubtitle ? '#4ec9b0' : '#ef4444',
              border: 'none',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold',
              whiteSpace: "nowrap",
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.8';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {showFloatingSubtitle ? '隐藏' : '显示'}
          </button>
        </div>

        {/* 菜单按钮 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdownMenu(!showDropdownMenu)}
            style={{
              backgroundColor: "rgba(20, 20, 20, 0.7)",
              color: "#d4d4d4",
              border: "1px solid #3c3c3c",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#0e639c";
              e.target.style.borderColor = "#4ec9b0";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(20, 20, 20, 0.7)";
              e.target.style.borderColor = "#3c3c3c";
            }}
          >
            <span>📁 菜单</span>
            <span>{showDropdownMenu ? '▲' : '▼'}</span>
          </button>

          {showDropdownMenu && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              backgroundColor: "rgba(30, 30, 30, 0.98)",
              border: "1px solid #3c3c3c",
              borderRadius: "6px",
              padding: "8px 0",
              minWidth: "200px",
              zIndex: 1001,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              marginTop: "5px"
            }}>
              <div style={{ padding: "8px 12px", display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setShowWork(!showWork)}
                  style={{
                    backgroundColor: showWork ? "#4caf50" : "#0e639c",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!showWork) e.target.style.backgroundColor = "#1177bb";
                  }}
                  onMouseLeave={(e) => {
                    if (!showWork) e.target.style.backgroundColor = "#0e639c";
                  }}
                >
                  {showWork ? '关闭单词' : '单词'}
                </button>
                <button
                  onClick={() => setShowPePaSentence(!showPePaSentence)}
                  style={{
                    backgroundColor: showPePaSentence ? "#4caf50" : "#0e639c",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!showPePaSentence) e.target.style.backgroundColor = "#1177bb";
                  }}
                  onMouseLeave={(e) => {
                    if (!showPePaSentence) e.target.style.backgroundColor = "#0e639c";
                  }}
                >
                  {showPePaSentence ? '关闭句子' : '句子'}
                </button>
                <button
                  onClick={() => setShowWordBook(!showWordBook)}
                  style={{
                    backgroundColor: showWordBook ? "#4caf50" : "#0e639c",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!showWordBook) e.target.style.backgroundColor = "#1177bb";
                  }}
                  onMouseLeave={(e) => {
                    if (!showWordBook) e.target.style.backgroundColor = "#0e639c";
                  }}
                >
                  {showWordBook ? '关闭复习' : '复习单词'}
                </button>
                <button
                  onClick={() => {
                    setShowNotebook(!showNotebook);
                    setNotebookContext({
                      initialText: clickedWord || currentSubtitle?.english || '',
                      videoContext: {
                        videoTitle: videoPlaylist[currentVideoIndex]?.title,
                        currentTime: videoPlayerRef.current?.getCurrentTime(),
                        subtitle: currentSubtitle?.english,
                        word: clickedWord,
                      }
                    });
                  }}
                  style={{
                    backgroundColor: showNotebook ? "#9c27b0" : "#0e639c",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!showNotebook) e.target.style.backgroundColor = "#1177bb";
                  }}
                  onMouseLeave={(e) => {
                    if (!showNotebook) e.target.style.backgroundColor = "#0e639c";
                  }}
                >
                  {showNotebook ? '📓 关闭笔记本' : '📓 打开笔记本'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 清除高亮按钮 - 当有高亮时显示 */}
        {highlightedWords.size > 0 && (
          <button
            onClick={clearHighlights}
            style={{
              backgroundColor: "rgba(220, 53, 69, 0.2)",
              color: "#dc3545",
              border: "1px solid #dc3545",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(220, 53, 69, 0.3)";
              e.target.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(220, 53, 69, 0.2)";
              e.target.style.transform = "scale(1)";
            }}
          >
            <span>🗑️</span>
            <span>清除高亮 ({highlightedWords.size})</span>
          </button>
        )}
      </div>

      {/* 主内容区域 - 视频播放器 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '7fr 3fr',
        gap: '5px',
        height: 'calc(100vh - 40px)',
        padding: '20px',
        boxSizing: 'border-box',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* 左侧：视频区域 */}
        <div style={{
          position: 'relative',
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          height: '100%'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <VideoPlayer
              src={videoSrc}
              ref={videoPlayerRef}
              isVisible={true}
            />
          </div>

          {/* 悬浮字幕 - 根据 showFloatingSubtitle 控制显示 */}
          {showFloatingSubtitle && currentSubtitle?.english && (
            <div className="floating-subtitle" style={{
              position: 'absolute',
              bottom: '2px',
              left: '20px',
              right: '20px',
              zIndex: 10
            }}>
              <div className="english-subtitle"
                translate="no"
                onMouseUp={handleMouseUp}
                style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  lineHeight: '1.4',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '8px'
                }}>
                <div style={{
                  fontSize: '16px',
                  color: '#fff',
                  fontWeight: 'bold',
                  backgroundColor: '#0e639c',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  minWidth: '35px',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {currentSubIndex + 1}
                </div>
                <button
                  onClick={() => F_speak(currentSubtitle.english)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#d4d4d4',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(78, 201, 176, 0.2)';
                    e.target.style.color = '#4ec9b0';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#d4d4d4';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  🔊
                </button>
                <div style={{ flex: 1, paddingLeft: '5px' }}>
                  {renderSubtitleWords(currentSubtitle.english, currentSubIndex)}
                </div>
              </div>
            </div>
          )}

          {/* 悬浮目录 */}
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: isPlaylistCollapsed ? '40px' : '380px',
            height: isPlaylistCollapsed ? '40px' : 'calc(100% - 4px)',
            backgroundColor: 'rgba(37, 37, 38, 0.95)',
            borderRadius: '8px',
            border: '1px solid #3c3c3c',
            padding: isPlaylistCollapsed ? '10px 5px' : '15px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 20
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isPlaylistCollapsed ? '0' : '12px',
              paddingBottom: isPlaylistCollapsed ? '0' : '8px',
              borderBottom: isPlaylistCollapsed ? 'none' : '1px solid #3c3c3c',
            }}>
              {!isPlaylistCollapsed && (
                <h3 style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#d4d4d4',
                  fontWeight: '600',
                }}>
                  视频目录 ({videoPlaylist.length})
                </h3>
              )}
              <button
                onClick={togglePlaylist}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#858585',
                  padding: '4px',
                  borderRadius: '4px',
                  marginLeft: isPlaylistCollapsed ? '0' : '8px'
                }}
              >
                {isPlaylistCollapsed ? '▶' : '◀'}
              </button>
            </div>

            {/* 视频列表 - 虚拟滚动 */}
            {!isPlaylistCollapsed && (
              <div
                ref={playlistContainerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  position: 'relative',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#3c3c3c transparent',
                }}
              >
                <div style={{
                  height: `${videoPlaylist.length * ITEM_HEIGHT}px`,
                  position: 'relative',
                }}>
                  {visibleVideoItems.map((video) => (
                    <div
                      key={video.globalIndex}
                      onClick={() => switchVideo(video.globalIndex)}
                      style={{
                        position: 'absolute',
                        top: `${video.offset}px`,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        backgroundColor: currentVideoIndex === video.globalIndex
                          ? 'rgba(14, 99, 156, 0.25)'
                          : 'transparent',
                        borderLeft: currentVideoIndex === video.globalIndex
                          ? '3px solid #4ec9b0'
                          : '3px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        height: `${ITEM_HEIGHT - 4}px`,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{
                        width: '24px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#858585',
                        marginRight: '8px',
                      }}>
                        {video.globalIndex + 1}
                      </div>
                      <div style={{
                        width: '60px',
                        height: '34px',
                        borderRadius: '4px',
                        marginRight: '12px',
                        backgroundColor: 'rgba(60, 60, 60, 0.5)',
                        overflow: 'hidden',
                      }}>
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        )}
                      </div>
                      <div style={{
                        flex: 1,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: currentVideoIndex === video.globalIndex ? '600' : '500',
                          color: currentVideoIndex === video.globalIndex ? '#4ec9b0' : '#d4d4d4',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {video.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPlaylistCollapsed && (
              <div style={{
                textAlign: 'center',
                color: '#858585',
                fontSize: '12px',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }} onClick={togglePlaylist}>
                视频目录
              </div>
            )}
          </div>

          {/* 导航按钮 - 根据字幕显示状态调整透明度 */}
          {currentSubtitle && (
            <div className="floating-navigation"
              style={{
                position: 'absolute',
                bottom: '10vh',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '5px',
                backgroundColor: 'rgba(37, 37, 38, 0.1)',
                padding: '10px 16px',
                borderRadius: '8px',
                zIndex: 100,
                opacity: showFloatingSubtitle ? 1 : 0.5,
                transition: 'opacity 0.3s ease'
              }}
            >
              <button
                onClick={jumpToPrevSubtitle}
                style={{
                  backgroundColor: 'rgba(14, 99, 156, 0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                ←
              </button>
              <button
                onClick={handlePlayPause}
                style={{
                  backgroundColor: 'rgba(56, 138, 52, 0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                ⏯
              </button>
              <button
                onClick={jumpToNextSubtitle}
                style={{
                  backgroundColor: 'rgba(14, 99, 156, 0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* 右侧空白区域 */}
        <div></div>
      </div>

      {/* 字幕计数 - 调整位置到左下角，避免与左上角区域重叠 */}
      <div
        className="subtitle-counter"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 999,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          border: `2px solid ${showFloatingSubtitle ? '#4ec9b0' : '#ef4444'}`,
        }}
      >
        当前字幕 ({currentSubIndex + 1}/{subtitles.length})
        <span style={{ marginLeft: '10px', color: showFloatingSubtitle ? '#4ec9b0' : '#ef4444' }}>
          {showFloatingSubtitle ? '📝' : '🔇'}
        </span>
      </div>

      {/* 模态框组件 */}
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

      {showWork && (
        <Work_2
          onClose={() => setShowWork(false)}
          getToken={getToken()}
          clickWork={clickWork}
          onWordChange={handleWordChange_2}
          translate={translate}
          net={1}
          G_word_name={'word_pepa_study'}
        />
      )}

      {showPePaSentence && (
        <PepaSentence
          onClose={() => setShowPePaSentence(false)}
          onWordChange={handleWordChange_3}
          getToken={getToken()}
          F_addSentence={currentSubtitle}
          onHideListsChange={handlePepaSentenceHideChange}
        />
      )}

      {showWordBook && (
        <WordBook
          G_json={'word_pepa_review'}
          onClose={() => setShowWordBook(false)}
        />
      )}
    </div>
  );
};

export default App;