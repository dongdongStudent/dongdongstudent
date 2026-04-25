import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './scss/R_item_learn_book.scss';
import { G_config } from '../config.js';
import { F_translator } from '../Function/weisimin.js';
import WordTranslator from '../translator/index.js';

// 动态导入所有 word_frame 数据
const wordFrameModules = {
  // 外研版
  wy_4_d: () => import('../resources/book_word_frame/word_frame_english_wy_4_d.json'),
  // 人教版
  rjb_7_u: () => import('../resources/book_word_frame/word_frame_english_rjb_7_u.json'),
};

// VS Code 风格开关组件
const VSCodeSwitch = ({ checked, onChange, label }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer'
    }}
  >
    <div
      style={{
        width: '40px',
        height: '20px',
        backgroundColor: checked ? '#0e639c' : '#3e3e42',
        borderRadius: '10px',
        position: 'relative',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'all 0.2s ease'
        }}
      />
    </div>
    <span style={{ color: '#cccccc', fontSize: '13px' }}>{label}</span>
  </div>
);

// 添加动画样式
const animationStyle = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes fadeOut {
    0% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; visibility: hidden; }
  }
`;

// 悬浮翻页控件（左右两侧 + 底部页码）
const FloatingPageControls = ({ unit_page_range, select_page, onPageChange }) => {
  const startPage = unit_page_range?.[0] || 1;
  const endPage = unit_page_range?.[1] || 100;
  const totalPages = endPage - startPage + 1;
  
  return (
    <>
      <button
        onClick={() => onPageChange(select_page - 1)}
        disabled={select_page <= startPage}
        className="floating-nav-btn prev-page"
        style={{
          position: 'fixed',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '56px',
          height: '56px',
          backgroundColor: 'rgba(37, 37, 38, 0.85)',
          border: '1px solid #3e3e42',
          borderRadius: '28px',
          color: '#cccccc',
          cursor: 'pointer',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
          zIndex: 1000,
          opacity: 0.5
        }}
        onMouseEnter={(e) => {
          if (!e.target.disabled) {
            e.target.style.opacity = '1';
            e.target.style.backgroundColor = 'rgba(55, 55, 61, 0.95)';
            e.target.style.borderColor = '#007acc';
            e.target.style.transform = 'translateY(-50%) scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!e.target.disabled) {
            e.target.style.opacity = '0.5';
            e.target.style.backgroundColor = 'rgba(37, 37, 38, 0.85)';
            e.target.style.borderColor = '#3e3e42';
            e.target.style.transform = 'translateY(-50%) scale(1)';
          }
        }}
      >
        ←
      </button>

      <button
        onClick={() => onPageChange(select_page + 1)}
        disabled={select_page >= endPage}
        className="floating-nav-btn next-page"
        style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '56px',
          height: '56px',
          backgroundColor: 'rgba(37, 37, 38, 0.85)',
          border: '1px solid #3e3e42',
          borderRadius: '28px',
          color: '#cccccc',
          cursor: 'pointer',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
          zIndex: 1000,
          opacity: 0.5
        }}
        onMouseEnter={(e) => {
          if (!e.target.disabled) {
            e.target.style.opacity = '1';
            e.target.style.backgroundColor = 'rgba(55, 55, 61, 0.95)';
            e.target.style.borderColor = '#007acc';
            e.target.style.transform = 'translateY(-50%) scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!e.target.disabled) {
            e.target.style.opacity = '0.5';
            e.target.style.backgroundColor = 'rgba(37, 37, 38, 0.85)';
            e.target.style.borderColor = '#3e3e42';
            e.target.style.transform = 'translateY(-50%) scale(1)';
          }
        }}
      >
        →
      </button>

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(37, 37, 38, 0.95)',
          border: '1px solid #0e639c',
          borderRadius: '20px',
          padding: '8px 20px',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          fontSize: '13px',
          fontFamily: 'Consolas, monospace',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        <span style={{ color: '#858585' }}>📖 首页</span>
        <button
          onClick={() => onPageChange(startPage)}
          disabled={select_page === startPage}
          style={{
            background: 'transparent',
            border: 'none',
            color: select_page === startPage ? '#4ec9b0' : '#9cdcfe',
            cursor: select_page === startPage ? 'default' : 'pointer',
            fontSize: '13px',
            fontWeight: select_page === startPage ? 'bold' : 'normal',
            padding: '0 4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (select_page !== startPage) {
              e.target.style.color = '#ffffff';
              e.target.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (select_page !== startPage) {
              e.target.style.color = '#9cdcfe';
              e.target.style.transform = 'scale(1)';
            }
          }}
        >
          {startPage}
        </button>
        
        <span style={{ color: '#3e3e42' }}>|</span>
        
        <span style={{ color: '#4ec9b0', fontWeight: 'bold' }}>
          第 {select_page} 页
        </span>
        
        <span style={{ color: '#3e3e42' }}>|</span>
        
        <span style={{ color: '#858585' }}>末页</span>
        <button
          onClick={() => onPageChange(endPage)}
          disabled={select_page === endPage}
          style={{
            background: 'transparent',
            border: 'none',
            color: select_page === endPage ? '#4ec9b0' : '#9cdcfe',
            cursor: select_page === endPage ? 'default' : 'pointer',
            fontSize: '13px',
            fontWeight: select_page === endPage ? 'bold' : 'normal',
            padding: '0 4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (select_page !== endPage) {
              e.target.style.color = '#ffffff';
              e.target.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (select_page !== endPage) {
              e.target.style.color = '#9cdcfe';
              e.target.style.transform = 'scale(1)';
            }
          }}
        >
          {endPage}
        </button>
        
        <span style={{ color: '#858585', marginLeft: '8px' }}>
          (共 {totalPages} 页)
        </span>
      </div>
    </>
  );
};

const R_item_learn_book = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const imgContainerRef = useRef(null);

  const { state } = location;
  const {
    bookId = 'wy_3_u',
    bookName = '三年级上册',
    unitId = 'wy_3_u_1',
    unitName = 'Unit 1',
    pageRange = [1, 12],
    totalPages = 12,
    returnPath = null,
    returnState = null
  } = state || {};

  const [book_Current_page, setBook_Current_page] = useState(pageRange[0] || 1);
  const [book_word_frame, setBook_word_frame] = useState([]);
  const [clickedWords, setClickedWords] = useState(new Set());
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [isOn, setIsOn] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [wordStates, setWordStates] = useState({});
  const [click_all, setClick_all] = useState('0/0');
  const [isShowUnkown, setIsShowUnkown] = useState(true);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(-1);
  const [selectableFrames, setSelectableFrames] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [wordFrameData, setWordFrameData] = useState({});
  const [loadingWordFrame, setLoadingWordFrame] = useState(true);

  // 翻译相关状态
  const [showTranslator, setShowTranslator] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [currentTranslation, setCurrentTranslation] = useState('');

  // 从 bookId 解析版本、年级、学期（用于图片路径）
  const [currentVersion, currentGrade, currentVolume] = bookId.split('_');

  // 动态加载单词框数据 - 使用完整的 bookId 作为 key
  useEffect(() => {
    const loadWordFrameData = async () => {
      setLoadingWordFrame(true);
      try {
        const loadModule = wordFrameModules[bookId];
        
        if (loadModule) {
          const module = await loadModule();
          // 处理不同的导出格式（.json 和 .js）
          const data = module.default || module;
          setWordFrameData(data);
        } else {
          setWordFrameData({});
        }
      } catch (error) {
        console.error('加载单词框数据失败:', error);
        setWordFrameData({});
      } finally {
        setLoadingWordFrame(false);
      }
    };

    if (bookId) {
      loadWordFrameData();
    }
  }, [bookId]);

  // 获取当前页的单词框数据 - 注意嵌套结构
  const getWordFrameData = useCallback(() => {
    try {
      if (!wordFrameData || Object.keys(wordFrameData).length === 0) return [];
      
      // 数据格式：wordFrameData[bookId][页码]
      // 例如：wordFrameData["wy_4_d"]["2"]
      const bookData = wordFrameData[bookId];
      if (!bookData) {
        return [];
      }
      
      // 页码需要转换为字符串格式
      const pageData = bookData[String(book_Current_page)];
      if (!pageData) {
        return [];
      }
      
      return pageData;
    } catch (error) {
      console.error('获取单词框数据失败:', error);
      return [];
    }
  }, [wordFrameData, bookId, book_Current_page]);

  // 更新单词框数据
  useEffect(() => {
    if (loadingWordFrame) return;
    
    const frames = getWordFrameData();
    setBook_word_frame(frames);

    const selectable = frames.filter(frame => frame.text);
    setSelectableFrames(selectable);
    setSelectedFrameIndex(-1);

    const totalWords = selectable.length;
    const clickedCount = clickedWords.size;
    setClick_all(`${clickedCount}/${totalWords}`);
  }, [book_Current_page, getWordFrameData, clickedWords.size, loadingWordFrame]);

  const closeTranslator = useCallback(() => {
    setShowTranslator(false);
    setCurrentWord('');
    setCurrentTranslation('');
  }, []);

  const handleBack = useCallback(() => {
    if (returnPath) {
      navigate(returnPath, { state: returnState });
    } else {
      navigate('/english_book_pic_read');
    }
  }, [navigate, returnPath, returnState]);

  const handleSpeak = useCallback((text) => {
    if (text && isOn) {
      // F_speak(text);
    }
  }, [isOn]);

  // 计算图片最佳缩放和位置（兼容开发者工具打开时）
  const calculateImageLayout = useCallback((imgNaturalWidth, imgNaturalHeight) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 可用区域（减去左右按钮空间和上下边距）
    const availableWidth = viewportWidth - 140; // 左右各留70px给按钮
    const availableHeight = viewportHeight - 100; // 上下各留50px
    
    // 计算缩放比例，使图片完全适应可用区域
    const scaleX = availableWidth / imgNaturalWidth;
    const scaleY = availableHeight / imgNaturalHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    // 计算图片实际显示尺寸
    const displayWidth = imgNaturalWidth * scale;
    const displayHeight = imgNaturalHeight * scale;
    
    // 计算居中位置
    const posX = (viewportWidth - displayWidth) / 2;
    const posY = (viewportHeight - displayHeight) / 2;
    
    return { scale, x: posX, y: posY };
  }, []);

  // 更新图片布局
  const updateImageLayout = useCallback(() => {
    if (imgWidth > 0 && imgHeight > 0) {
      const { scale, x, y } = calculateImageLayout(imgWidth, imgHeight);
      setImageScale(scale);
      setImagePosition({ x, y });
    }
  }, [imgWidth, imgHeight, calculateImageLayout]);

  // 图片加载完成，计算最佳缩放比例
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    setImgWidth(naturalWidth);
    setImgHeight(naturalHeight);
    
    const { scale, x, y } = calculateImageLayout(naturalWidth, naturalHeight);
    setImageScale(scale);
    setImagePosition({ x, y });
  }, [calculateImageLayout]);

  // 监听窗口大小变化（包括开发者工具打开/关闭）
  useEffect(() => {
    const handleResize = () => {
      updateImageLayout();
    };

    // 使用 ResizeObserver 监听视口变化
    const resizeObserver = new ResizeObserver(() => {
      updateImageLayout();
    });
    
    resizeObserver.observe(document.body);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [updateImageLayout]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      const [minPage, maxPage] = pageRange;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (book_Current_page > minPage) {
          setBook_Current_page(book_Current_page - 1);
          setSelectedFrameIndex(-1);
          closeTranslator();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (book_Current_page < maxPage) {
          setBook_Current_page(book_Current_page + 1);
          setSelectedFrameIndex(-1);
          closeTranslator();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectableFrames.length > 0) {
          const newIndex = selectedFrameIndex <= 0 ? selectableFrames.length - 1 : selectedFrameIndex - 1;
          setSelectedFrameIndex(newIndex);
          if (selectableFrames[newIndex]) {
            handleFrameClick(selectableFrames[newIndex]);
          }
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectableFrames.length > 0) {
          const newIndex = (selectedFrameIndex + 1) % selectableFrames.length;
          setSelectedFrameIndex(newIndex);
          if (selectableFrames[newIndex]) {
            handleFrameClick(selectableFrames[newIndex]);
          }
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (showTranslator) {
          e.preventDefault();
          closeTranslator();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [book_Current_page, selectableFrames, selectedFrameIndex, pageRange, showTranslator, closeTranslator]);

  // 处理单词框点击
  const handleFrameClick = useCallback(async (item) => {
    if (!item.text) return;

    setClickedWords(prev => new Set(prev).add(item.text));

    setWordStates(prev => {
      const currentState = prev[item.text] || 0;
      const newState = (currentState + 1) % 3;
      return { ...prev, [item.text]: newState };
    });

    setCurrentWord(item.text);
    setShowTranslator(true);
    
    if (item.translator) {
      setCurrentTranslation(item.translator);
    } else {
      setCurrentTranslation('');
      try {
        const translation = await F_translator(item.text);
        if (translation) {
          setCurrentTranslation(translation);
        } else {
          setCurrentTranslation('暂无翻译');
        }
      } catch (error) {
        console.error('获取翻译失败:', error);
        setCurrentTranslation('翻译失败，请重试');
      }
    }
  }, [isOn]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= pageRange[0] && newPage <= pageRange[1]) {
      setBook_Current_page(newPage);
      setClickedWords(new Set());
      setWordStates({});
      closeTranslator();
    }
  }, [pageRange, closeTranslator]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        // 全屏后重新计算布局
        setTimeout(updateImageLayout, 100);
      }).catch(err => {
        console.error('全屏失败:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        // 退出全屏后重新计算布局
        setTimeout(updateImageLayout, 100);
      }).catch(err => {
        console.error('退出全屏失败:', err);
      });
    }
  }, [updateImageLayout]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // 全屏状态改变后重新计算布局
      setTimeout(updateImageLayout, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [updateImageLayout]);

  // 渲染单词框
  const renderWordFrame = useCallback((word, index) => {
    const isSelectable = !!word.text;
    const isSelected = isSelectable && selectableFrames.findIndex(f => f === word) === selectedFrameIndex;
    const isClicked = clickedWords.has(word.text);
    const wordState = wordStates[word.text] || 0;

    let backgroundColor = 'transparent';
    if (wordState === 1) {
      backgroundColor = 'rgba(78, 201, 176, 0.25)';
    } else if (wordState === 2) {
      backgroundColor = 'rgba(86, 156, 214, 0.2)';
    } else if (isClicked) {
      backgroundColor = 'rgba(78, 201, 176, 0.2)';
    }

    return (
      <div
        key={index}
        className="word-frame"
        style={{
          position: 'absolute',
          left: `${word.x}%`,
          top: `${word.y}%`,
          width: `${word.w}%`,
          height: `${word.h}%`,
          border: isSelected ? '2px solid #ffcc00' : '1px solid rgba(86, 156, 214, 0.3)',
          borderRadius: '3px',
          backgroundColor: backgroundColor,
          cursor: 'pointer',
          boxShadow: isSelected ? '0 0 0 1px rgba(255, 204, 0, 0.3)' : 'none',
          transition: 'all 0.15s ease',
          zIndex: 10,
          boxSizing: 'border-box'
        }}
        onClick={() => handleFrameClick(word)}
      >
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '-28px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#2d2d2d',
            border: '1px solid #ffcc00',
            color: '#ffcc00',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'Consolas, monospace',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none'
          }}>
            {word.text}
          </div>
        )}

        {(wordState === 1 || isClicked) && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '12px',
            color: '#4ec9b0',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            ✓
          </div>
        )}
      </div>
    );
  }, [selectableFrames, selectedFrameIndex, clickedWords, wordStates, handleFrameClick]);

  // 3秒后自动隐藏帮助提示
  useEffect(() => {
    if (book_Current_page === pageRange[0]) {
      const timer = setTimeout(() => {
        setShowHelp(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [book_Current_page, pageRange]);

  // 图片路径
  const path_img = `${G_config.G_server_address}/resource/book_picture/${currentVersion}/${currentGrade}_${currentVolume}/${book_Current_page}.png`;

  // 加载中状态
  if (loadingWordFrame) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#cccccc'
      }}>
        <div>加载单词数据中...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className='book'
      style={{
        padding: 0,
        margin: 0,
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        overflow: 'hidden'
      }}
    >
      <style>{animationStyle}</style>

      {/* 顶部悬浮栏 */}
      <div style={{
        position: 'fixed',
        top: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1001,
        pointerEvents: 'none'
      }}>
        <div style={{
          backgroundColor: 'rgba(37, 37, 38, 0.85)',
          border: '1px solid #3e3e42',
          borderRadius: '6px',
          padding: '6px 12px',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'auto',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={handleBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9cdcfe',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(86, 156, 214, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ← 返回
          </button>
          <span style={{ color: '#858585' }}>|</span>
          <button
            onClick={() => navigate('/english_book_pic_read')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffab40',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 171, 64, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            🏠 首页
          </button>
          <span style={{ color: '#858585' }}>|</span>
          <span style={{ color: '#9cdcfe' }}>{bookName}</span>
          <span style={{ color: '#858585', margin: '0 6px' }}>/</span>
          <span style={{ color: '#ffffff' }}>{unitName}</span>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          pointerEvents: 'auto'
        }}>
          <button
            onClick={toggleFullscreen}
            style={{
              backgroundColor: 'rgba(37, 37, 38, 0.85)',
              border: '1px solid #3e3e42',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Segoe UI, sans-serif',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(55, 55, 61, 0.95)';
              e.target.style.borderColor = '#007acc';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(37, 37, 38, 0.85)';
              e.target.style.borderColor = '#3e3e42';
              e.target.style.color = '#cccccc';
            }}
          >
            {isFullscreen ? '⛶ 退出' : '⛶ 全屏'} (F)
          </button>

          <button
            onClick={() => setIsMenuVisible(!isMenuVisible)}
            style={{
              backgroundColor: 'rgba(37, 37, 38, 0.85)',
              border: '1px solid #3e3e42',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Segoe UI, sans-serif',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(55, 55, 61, 0.95)';
              e.target.style.borderColor = '#007acc';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(37, 37, 38, 0.85)';
              e.target.style.borderColor = '#3e3e42';
              e.target.style.color = '#cccccc';
            }}
          >
            ☰ 设置
          </button>
        </div>
      </div>

      {/* 帮助提示 */}
      {showHelp && book_Current_page === pageRange[0] && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(14, 99, 156, 0.95)',
          border: '1px solid #007acc',
          borderRadius: '8px',
          padding: '8px 20px',
          zIndex: 1000,
          fontSize: '12px',
          fontFamily: 'Consolas, monospace',
          color: '#ffffff',
          backdropFilter: 'blur(8px)',
          animation: 'fadeOut 5s forwards',
          whiteSpace: 'nowrap'
        }}>
          ⬅️ ➡️ 翻页 | ⬆️ ⬇️ 选择单词 | 点击学习 | F 全屏 | ESC 关闭翻译
        </div>
      )}

      {/* 图片和单词框容器 - 使用绝对定位居中 */}
      <div
        className='img_and_frame'
        ref={imgContainerRef}
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          left: `${imagePosition.x}px`,
          top: `${imagePosition.y}px`,
          transform: `scale(${imageScale})`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease, left 0.2s ease, top 0.2s ease'
        }}>
          <img
            src={path_img}
            alt={unitName}
            onLoad={handleImageLoad}
            style={{
              display: 'block',
              width: imgWidth > 0 ? `${imgWidth}px` : 'auto',
              height: 'auto',
              borderRadius: '4px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
            onError={(e) => {
              console.error('图片加载失败:', path_img);
            }}
          />

          {/* 单词框覆盖层 */}
          {book_word_frame && book_word_frame.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'auto'
            }}>
              {book_word_frame.map((word, index) => renderWordFrame(word, index))}
            </div>
          )}
        </div>
      </div>

      {/* 翻译悬浮框 */}
      <WordTranslator
        open={showTranslator}
        onClose={closeTranslator}
        word={currentWord}
        onWordChange={(data) => {
          if (data?.translation) {
            setCurrentTranslation(data.translation);
          }
        }}
        autoSpeak={isOn}
        defaultCompact={true}
      />

      {/* 悬浮翻页控件 */}
      <FloatingPageControls
        unit_page_range={pageRange}
        select_page={book_Current_page}
        onPageChange={handlePageChange}
      />

      {/* 设置菜单面板 */}
      {isMenuVisible && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '20px',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(37, 37, 38, 0.95)',
          border: '1px solid #3e3e42',
          borderRadius: '12px',
          minWidth: '200px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 1001,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid #3e3e42',
            backgroundColor: '#0e639c'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>⚙️ 设置</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #3e3e42'
          }}>
            <span style={{ fontSize: '13px', color: '#cccccc' }}>🔊 语音朗读</span>
            <VSCodeSwitch checked={isOn} onChange={setIsOn} label="" />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #3e3e42'
          }}>
            <span style={{ fontSize: '13px', color: '#cccccc' }}>❓ 未知单词</span>
            <VSCodeSwitch checked={isShowUnkown} onChange={() => setIsShowUnkown(!isShowUnkown)} label="" />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px'
          }}>
            <span style={{ fontSize: '13px', color: '#cccccc' }}>📊 学习进度</span>
            <span style={{
              color: '#4ec9b0',
              fontWeight: 'bold',
              fontFamily: 'Consolas, monospace',
              fontSize: '13px'
            }}>
              {click_all}
            </span>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeOut {
            0% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; visibility: hidden; }
          }
        `}
      </style>
    </div>
  );
};

export default R_item_learn_book;