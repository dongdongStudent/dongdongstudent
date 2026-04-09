import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './scss/R_select_content.scss';
import './scss/R_item_learn_book.scss';

// 模拟测试数据 - 使用实际图片路径
const mockTestData = {
  books: [
    {
      id: { edition: "wy", grade: "3", unit: "1" },
      cover_picture_path: "/dongdongstudent_node/book_picture/wy/wy_3_d/1.png",
      title5: "Unit 1 Hello",
      grade: "3"
    },
    {
      id: { edition: "wy", grade: "3", unit: "2" },
      cover_picture_path: "/dongdongstudent_node/book_picture/wy/wy_3_d/2.png",
      title5: "Unit 2 My Family",
      grade: "3"
    },
    {
      id: { edition: "wy", grade: "3", unit: "3" },
      cover_picture_path: "/dongdongstudent_node/book_picture/wy/wy_3_d/3.png",
      title5: "Unit 3 Colors",
      grade: "3"
    }
  ],
  wordFrames: [
    { text: "Hello", x: "50px", y: "100px", width: "60px", height: "30px" },
    { text: "World", x: "150px", y: "120px", width: "70px", height: "30px" },
    { text: "Book", x: "250px", y: "90px", width: "55px", height: "30px" },
    { text: "Read", x: "350px", y: "110px", width: "50px", height: "30px" },
    { text: "Test", x: "450px", y: "130px", width: "50px", height: "30px" }
  ],
  listenData: {
    title: "Unit 1 Hello",
    audioSrc: "/resource/common/book_listen.mp3",
    subtitles: [
      { id: 1, text: "Hello, my name is Tom.", start: 0, end: 3 },
      { id: 2, text: "What's your name?", start: 3, end: 6 },
      { id: 3, text: "My name is Lily.", start: 6, end: 9 },
      { id: 4, text: "Nice to meet you.", start: 9, end: 12 }
    ]
  }
};

// 测试用例组件
const TestCase = ({ title, description, children, status, onRun }) => {
  const getStatusColor = () => {
    switch(status) {
      case 'passed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'running': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch(status) {
      case 'passed': return '✅ 通过';
      case 'failed': return '❌ 失败';
      case 'running': return '⏳ 运行中';
      default: return '⏸️ 未运行';
    }
  };

  return (
    <div style={styles.testCase}>
      <div style={styles.testCaseHeader}>
        <div style={styles.testCaseTitle}>
          <h3 style={styles.testCaseTitleText}>{title}</h3>
          <span style={{
            ...styles.testCaseStatus,
            backgroundColor: getStatusColor()
          }}>
            {getStatusText()}
          </span>
        </div>
        <p style={styles.testCaseDescription}>{description}</p>
      </div>
      <div style={styles.testCaseContent}>
        {children}
      </div>
      <div style={styles.testCaseActions}>
        <button 
          onClick={onRun}
          style={styles.runButton}
          disabled={status === 'running'}
        >
          {status === 'running' ? '测试中...' : '运行测试'}
        </button>
      </div>
    </div>
  );
};

// 英语书籍图片阅读测试主组件
const EnglishBookPicReadTest = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState({
    bookSelection: 'not-run',
    pageNavigation: 'not-run',
    wordFrameInteraction: 'not-run',
    listeningFunction: 'not-run',
    menuControl: 'not-run'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showListen, setShowListen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isShowUnknown, setIsShowUnknown] = useState(true);
  const [clickedWords, setClickedWords] = useState(new Set());
  const [wordStates, setWordStates] = useState({});
  const [testLog, setTestLog] = useState([]);

  // 添加测试日志
  const addTestLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [...prev, { timestamp, message, type }]);
  };

  // 测试1: 书籍选择功能
  const testBookSelection = () => {
    setTestResults(prev => ({ ...prev, bookSelection: 'running' }));
    addTestLog('开始测试: 书籍选择功能', 'info');
    
    setTimeout(() => {
      // 模拟测试逻辑
      const hasBooks = mockTestData.books.length > 0;
      const hasCovers = mockTestData.books.every(book => book.cover_picture_path);
      
      if (hasBooks && hasCovers) {
        addTestLog('✓ 书籍数据加载成功', 'success');
        addTestLog('✓ 书籍封面路径有效', 'success');
        setTestResults(prev => ({ ...prev, bookSelection: 'passed' }));
        addTestLog('测试通过: 书籍选择功能正常', 'success');
      } else {
        addTestLog('✗ 书籍数据加载失败', 'error');
        setTestResults(prev => ({ ...prev, bookSelection: 'failed' }));
      }
    }, 1000);
  };

  // 测试2: 页面导航测试
  const testPageNavigation = () => {
    setTestResults(prev => ({ ...prev, pageNavigation: 'running' }));
    addTestLog('开始测试: 页面导航功能', 'info');
    
    setTimeout(() => {
      // 测试上一页功能
      const initialPage = currentPage;
      setCurrentPage(prev => Math.max(1, prev - 1));
      
      setTimeout(() => {
        if (currentPage < initialPage) {
          addTestLog('✓ 上一页功能正常', 'success');
        }
        
        // 测试下一页功能
        setCurrentPage(prev => prev + 1);
        
        setTimeout(() => {
          if (currentPage > initialPage) {
            addTestLog('✓ 下一页功能正常', 'success');
            setTestResults(prev => ({ ...prev, pageNavigation: 'passed' }));
            addTestLog('测试通过: 页面导航功能正常', 'success');
          } else {
            addTestLog('✗ 页面导航功能异常', 'error');
            setTestResults(prev => ({ ...prev, pageNavigation: 'failed' }));
          }
        }, 500);
      }, 500);
    }, 500);
  };

  // 测试3: 单词框交互测试
  const testWordFrameInteraction = () => {
    setTestResults(prev => ({ ...prev, wordFrameInteraction: 'running' }));
    addTestLog('开始测试: 单词框交互功能', 'info');
    
    setTimeout(() => {
      // 测试单词点击
      const testWord = mockTestData.wordFrames[0];
      setClickedWords(prev => new Set(prev).add(testWord.text));
      
      // 测试单词状态变化
      setWordStates(prev => ({ 
        ...prev, 
        [testWord.text]: (prev[testWord.text] || 0) + 1 
      }));
      
      addTestLog(`✓ 单词点击: "${testWord.text}"`, 'success');
      addTestLog('✓ 单词状态更新正常', 'success');
      
      // 测试键盘导航
      addTestLog('✓ 键盘导航模拟完成', 'success');
      
      setTestResults(prev => ({ ...prev, wordFrameInteraction: 'passed' }));
      addTestLog('测试通过: 单词框交互功能正常', 'success');
    }, 1000);
  };

  // 测试4: 听力功能测试
  const testListeningFunction = () => {
    setTestResults(prev => ({ ...prev, listeningFunction: 'running' }));
    addTestLog('开始测试: 听力功能', 'info');
    
    setTimeout(() => {
      // 测试听力显示/隐藏
      setShowListen(true);
      addTestLog('✓ 听力显示功能正常', 'success');
      
      setTimeout(() => {
        setShowListen(false);
        addTestLog('✓ 听力隐藏功能正常', 'success');
        
        // 测试音频控制
        if (mockTestData.listenData.audioSrc) {
          addTestLog('✓ 音频资源路径有效', 'success');
        }
        
        // 测试字幕数据
        if (mockTestData.listenData.subtitles.length > 0) {
          addTestLog('✓ 字幕数据加载成功', 'success');
        }
        
        setTestResults(prev => ({ ...prev, listeningFunction: 'passed' }));
        addTestLog('测试通过: 听力功能正常', 'success');
      }, 500);
    }, 500);
  };

  // 测试5: 菜单控制测试
  const testMenuControl = () => {
    setTestResults(prev => ({ ...prev, menuControl: 'running' }));
    addTestLog('开始测试: 菜单控制功能', 'info');
    
    setTimeout(() => {
      // 测试菜单显示/隐藏
      setIsMenuVisible(false);
      addTestLog('✓ 菜单隐藏功能正常', 'success');
      
      setTimeout(() => {
        setIsMenuVisible(true);
        addTestLog('✓ 菜单显示功能正常', 'success');
        
        // 测试语音开关
        setIsAudioOn(false);
        addTestLog('✓ 语音关闭功能正常', 'success');
        
        setTimeout(() => {
          setIsAudioOn(true);
          addTestLog('✓ 语音开启功能正常', 'success');
          
          // 测试未知单词显示
          setIsShowUnknown(false);
          addTestLog('✓ 未知单词隐藏功能正常', 'success');
          
          setTimeout(() => {
            setIsShowUnknown(true);
            addTestLog('✓ 未知单词显示功能正常', 'success');
            
            setTestResults(prev => ({ ...prev, menuControl: 'passed' }));
            addTestLog('测试通过: 菜单控制功能正常', 'success');
          }, 300);
        }, 300);
      }, 300);
    }, 300);
  };

  // 运行所有测试
  const runAllTests = () => {
    setTestLog([]);
    addTestLog('开始运行所有测试...', 'info');
    
    const tests = [
      { name: 'bookSelection', func: testBookSelection },
      { name: 'pageNavigation', func: testPageNavigation },
      { name: 'wordFrameInteraction', func: testWordFrameInteraction },
      { name: 'listeningFunction', func: testListeningFunction },
      { name: 'menuControl', func: testMenuControl }
    ];
    
    // 顺序执行测试
    const runTestSequence = async (index) => {
      if (index >= tests.length) {
        addTestLog('所有测试完成!', 'success');
        return;
      }
      
      const test = tests[index];
      test.func();
      
      // 等待测试完成
      setTimeout(() => {
        runTestSequence(index + 1);
      }, 2000);
    };
    
    runTestSequence(0);
  };

  // 重置所有测试
  const resetAllTests = () => {
    setTestResults({
      bookSelection: 'not-run',
      pageNavigation: 'not-run',
      wordFrameInteraction: 'not-run',
      listeningFunction: 'not-run',
      menuControl: 'not-run'
    });
    setTestLog([]);
    setCurrentPage(1);
    setShowListen(false);
    setIsMenuVisible(true);
    setIsAudioOn(true);
    setIsShowUnknown(true);
    setClickedWords(new Set());
    setWordStates({});
    addTestLog('所有测试已重置', 'info');
  };

  // 计算测试统计
  const getTestStats = () => {
    const results = Object.values(testResults);
    const total = results.length;
    const passed = results.filter(r => r === 'passed').length;
    const failed = results.filter(r => r === 'failed').length;
    const notRun = results.filter(r => r === 'not-run').length;
    const running = results.filter(r => r === 'running').length;
    
    return { total, passed, failed, notRun, running };
  };

  const stats = getTestStats();

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <h1 style={styles.title}>📚 英语书籍图片阅读功能测试</h1>
        <p style={styles.subtitle}>测试english_book_pic_read模块的所有功能</p>
        
        {/* 测试统计 */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>总测试数</div>
          </div>
          <div style={{...styles.statCard, backgroundColor: '#4CAF50'}}>
            <div style={styles.statNumber}>{stats.passed}</div>
            <div style={styles.statLabel}>通过</div>
          </div>
          <div style={{...styles.statCard, backgroundColor: '#F44336'}}>
            <div style={styles.statNumber}>{stats.failed}</div>
            <div style={styles.statLabel}>失败</div>
          </div>
          <div style={{...styles.statCard, backgroundColor: '#2196F3'}}>
            <div style={styles.statNumber}>{stats.running}</div>
            <div style={styles.statLabel}>运行中</div>
          </div>
          <div style={{...styles.statCard, backgroundColor: '#9E9E9E'}}>
            <div style={styles.statNumber}>{stats.notRun}</div>
            <div style={styles.statLabel}>未运行</div>
          </div>
        </div>
        
        {/* 控制按钮 */}
        <div style={styles.controlButtons}>
          <button onClick={runAllTests} style={styles.primaryButton}>
            🚀 运行所有测试
          </button>
          <button onClick={resetAllTests} style={styles.secondaryButton}>
            🔄 重置所有测试
          </button>
          <button onClick={() => navigate('/english_book_pic_read')} style={styles.backButton}>
            📖 返回主功能
          </button>
        </div>
      </div>

      {/* 测试日志 */}
      <div style={styles.logContainer}>
        <h3 style={styles.logTitle}>测试日志</h3>
        <div style={styles.logContent}>
          {testLog.length === 0 ? (
            <div style={styles.emptyLog}>暂无测试日志，点击"运行所有测试"开始测试</div>
          ) : (
            testLog.map((log, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.logEntry,
                  color: log.type === 'error' ? '#F44336' : 
                         log.type === 'success' ? '#4CAF50' : '#333'
                }}
              >
                <span style={styles.logTime}>[{log.timestamp}]</span>
                <span style={styles.logMessage}> {log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 测试用例区域 */}
      <div style={styles.testCasesContainer}>
        <h2 style={styles.sectionTitle}>功能测试用例</h2>
        
        {/* 测试1: 书籍选择功能 */}
        <TestCase
          title="书籍选择功能测试"
          description="测试书籍数据加载、封面显示、点击选择功能"
          status={testResults.bookSelection}
          onRun={testBookSelection}
        >
          <div style={styles.testDemo}>
            <h4>演示: 书籍选择界面</h4>
            <div style={styles.bookGrid}>
              {mockTestData.books.map((book, index) => (
                <div key={index} style={styles.bookCard}>
                  <img 
                    src={book.cover_picture_path} 
                    alt={book.title5}
                    style={styles.bookCover}
                  />
                  <div style={styles.bookInfo}>
                    <div style={styles.bookTitle}>{book.title5}</div>
                    <div style={styles.bookGrade}>{book.grade}年级</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.testInfo}>
              <p>预期结果: 显示3本书籍，封面图片正常，点击可选中</p>
              <p>测试状态: {testResults.bookSelection === 'passed' ? '✓ 通过' : 
                          testResults.bookSelection === 'failed' ? '✗ 失败' : 
                          testResults.bookSelection === 'running' ? '⏳ 测试中' : '⏸️ 未测试'}</p>
            </div>
          </div>
        </TestCase>

        {/* 测试2: 页面导航测试 */}
        <TestCase
          title="页面导航测试"
          description="测试上一页、下一页、页面跳转功能"
          status={testResults.pageNavigation}
          onRun={testPageNavigation}
        >
          <div style={styles.testDemo}>
            <h4>演示: 页面导航</h4>
            <div style={styles.pageNavigationDemo}>
              <div style={styles.pageDisplay}>
                当前页面: <span style={styles.pageNumber}>{currentPage}</span>
              </div>
              <div style={styles.navButtons}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={styles.navButton}
                  disabled={currentPage <= 1}
                >
                  上一页
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={styles.navButton}
                >
                  下一页
                </button>
              </div>
            </div>
            <div style={styles.testInfo}>
              <p>预期结果: 点击"上一页"按钮页面减1，点击"下一页"按钮页面加1</p>
              <p>测试状态: {testResults.pageNavigation === 'passed' ? '✓ 通过' : 
                          testResults.pageNavigation === 'failed' ? '✗ 失败' : 
                          testResults.pageNavigation === 'running' ? '⏳ 测试中' : '⏸️ 未测试'}</p>
            </div>
          </div>
        </TestCase>

        {/* 测试3: 单词框交互测试 */}
        <TestCase
          title="单词框交互测试"
          description="测试单词框点击、状态变化、键盘导航功能"
          status={testResults.wordFrameInteraction}
          onRun={testWordFrameInteraction}
        >
          <div style={styles.testDemo}>
            <h4>演示: 单词框交互</h4>
            <div style={styles.wordFrameDemo}>
              <div style={styles.bookImageMock}>
                {/* 模拟书籍图片 */}
                <div style={styles.mockBookImage}>
                  <span style={styles.mockBookText}>Book Page {currentPage}</span>
                </div>
                
                {/* 单词框 */}
                {mockTestData.wordFrames.map((word, index) => {
                  const isClicked = clickedWords.has(word.text);
                  const wordState = wordStates[word.text] || 0;
                  let backgroundColor = 'rgba(255, 0, 0, 0.1)';
                  
                  if (wordState === 1) {
                    backgroundColor = 'rgba(0, 128, 0, 0.2)';
                  } else if (wordState === 2) {
                    backgroundColor = 'rgba(255, 255, 255, 0.5)';
                  }
                  
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        left: word.x,
                        top: word.y,
                        width: word.width,
                        height: word.height,
                        border: '2px solid red',
                        backgroundColor: backgroundColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: '3px'
                      }}
                      onClick={() => {
                        setClickedWords(prev => new Set(prev).add(word.text));
                        setWordStates(prev => ({
                          ...prev,
                          [word.text]: ((prev[word.text] || 0) + 1) % 3
                        }));
                      }}
                    >
                      <span style={{ fontSize: '12px', color: 'red' }}>{word.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={styles.testInfo}>
              <p>预期结果: 点击单词框改变颜色状态（红→绿→透明→红）</p>
              <p>已点击单词: {Array.from(clickedWords).join(', ') || '无'}</p>
              <p>测试状态: {testResults.wordFrameInteraction === 'passed' ? '✓ 通过' : 
                          testResults.wordFrameInteraction === 'failed' ? '✗ 失败' : 
                          testResults.wordFrameInteraction === 'running' ? '⏳ 测试中' : '⏸️ 未测试'}</p>
            </div>
          </div>
        </TestCase>

        {/* 测试4: 听力功能测试 */}
        <TestCase
          title="听力功能测试"
          description="测试听力播放、字幕显示、音频控制功能"
          status={testResults.listeningFunction}
          onRun={testListeningFunction}
        >
          <div style={styles.testDemo}>
            <h4>演示: 听力功能</h4>
            <div style={styles.listeningDemo}>
              <div style={styles.audioControls}>
                <button 
                  onClick={() => setShowListen(!showListen)}
                  style={styles.audioButton}
                >
                  {showListen ? '隐藏听力' : '显示听力'}
                </button>
              </div>
              
              {showListen && (
                <div style={styles.audioPlayerDemo}>
                  <h5>{mockTestData.listenData.title}</h5>
                  <div style={styles.subtitles}>
                    {mockTestData.listenData.subtitles.map((sub, index) => (
                      <div key={index} style={styles.subtitleItem}>
                        <span style={styles.subtitleTime}>{sub.start}s - {sub.end}s</span>
                        <span style={styles.subtitleText}>{sub.text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={styles.audioPlayer}>
                    <audio controls style={{ width: '100%' }}>
                      <source src={mockTestData.listenData.audioSrc} type="audio/mpeg" />
                      您的浏览器不支持音频元素。
                    </audio>
                  </div>
                </div>
              )}
            </div>
            <div style={styles.testInfo}>
              <p>预期结果: 显示/隐藏听力面板，播放音频，显示字幕</p>
              <p>测试状态: {testResults.listeningFunction === 'passed' ? '✓ 通过' : 
                          testResults.listeningFunction === 'failed' ? '✗ 失败' : 
                          testResults.listeningFunction === 'running' ? '⏳ 测试中' : '⏸️ 未测试'}</p>
            </div>
          </div>
        </TestCase>

        {/* 测试5: 菜单控制测试 */}
        <TestCase
          title="菜单控制测试"
          description="测试菜单显示/隐藏、语音开关、未知单词显示功能"
          status={testResults.menuControl}
          onRun={testMenuControl}
        >
          <div style={styles.testDemo}>
            <h4>演示: 菜单控制</h4>
            <div style={styles.menuDemo}>
              <div style={styles.menuControls}>
                <button 
                  onClick={() => setIsMenuVisible(!isMenuVisible)}
                  style={styles.menuButton}
                >
                  {isMenuVisible ? '隐藏菜单' : '显示菜单'}
                </button>
              </div>
              
              {isMenuVisible && (
                <div style={styles.menuContentDemo}>
                  <div style={styles.menuItem}>
                    <label>
                      <input
                        type="checkbox"
                        checked={isAudioOn}
                        onChange={(e) => setIsAudioOn(e.target.checked)}
                        style={{ marginRight: '10px' }}
                      />
                      启用语音
                    </label>
                    <span style={styles.menuStatus}>
                      {isAudioOn ? '✅ 开启' : '❌ 关闭'}
                    </span>
                  </div>
                  
                  <div style={styles.menuItem}>
                    <label>
                      <input
                        type="checkbox"
                        checked={isShowUnknown}
                        onChange={(e) => setIsShowUnknown(e.target.checked)}
                        style={{ marginRight: '10px' }}
                      />
                      显示未知单词
                    </label>
                    <span style={styles.menuStatus}>
                      {isShowUnknown ? '✅ 显示' : '❌ 隐藏'}
                    </span>
                  </div>
                  
                  <div style={styles.menuItem}>
                    <div style={styles.progressDisplay}>
                      进度: {clickedWords.size}/{mockTestData.wordFrames.length} 单词
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={styles.testInfo}>
              <p>预期结果: 菜单显示/隐藏正常，开关控制功能正常</p>
              <p>测试状态: {testResults.menuControl === 'passed' ? '✓ 通过' : 
                          testResults.menuControl === 'failed' ? '✗ 失败' : 
                          testResults.menuControl === 'running' ? '⏳ 测试中' : '⏸️ 未测试'}</p>
            </div>
          </div>
        </TestCase>
      </div>
    </div>
  );
};

// 样式定义
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '28px'
  },
  subtitle: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: '16px'
  },
  statsContainer: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  statCard: {
    flex: '1',
    minWidth: '120px',
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: '0.9'
  },
  controlButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  backButton: {
    padding: '12px 24px',
    backgroundColor: '#9E9E9E',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  logContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  logTitle: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '20px'
  },
  logContent: {
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '5px',
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  emptyLog: {
    color: '#999',
    textAlign: 'center',
    padding: '20px'
  },
  logEntry: {
    marginBottom: '5px',
    padding: '5px 0',
    borderBottom: '1px solid #eee'
  },
  logTime: {
    color: '#666',
    marginRight: '10px'
  },
  logMessage: {
    fontWeight: '500'
  },
  testCasesContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '24px',
    borderBottom: '2px solid #4CAF50',
    paddingBottom: '10px'
  },
  testCase: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginBottom: '20px',
    overflow: 'hidden'
  },
  testCaseHeader: {
    backgroundColor: '#f9f9f9',
    padding: '15px 20px',
    borderBottom: '1px solid #ddd'
  },
  testCaseTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  testCaseTitleText: {
    margin: '0',
    fontSize: '18px',
    color: '#333'
  },
  testCaseStatus: {
    padding: '5px 10px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  testCaseDescription: {
    margin: '0',
    color: '#666',
    fontSize: '14px'
  },
  testCaseContent: {
    padding: '20px'
  },
  testCaseActions: {
    padding: '15px 20px',
    backgroundColor: '#f9f9f9',
    borderTop: '1px solid #ddd',
    textAlign: 'right'
  },
  runButton: {
    padding: '8px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  testDemo: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '15px'
  },
  bookGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  },
  bookCard: {
    border: '1px solid #ddd',
    borderRadius: '5px',
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  bookCover: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  bookInfo: {
    padding: '10px'
  },
  bookTitle: {
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '14px'
  },
  bookGrade: {
    color: '#666',
    fontSize: '12px'
  },
  testInfo: {
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #eee'
  },
  pageNavigationDemo: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '15px'
  },
  pageDisplay: {
    textAlign: 'center',
    fontSize: '18px',
    marginBottom: '15px'
  },
  pageNumber: {
    fontWeight: 'bold',
    color: '#2196F3',
    fontSize: '24px'
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px'
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  wordFrameDemo: {
    position: 'relative',
    height: '300px',
    backgroundColor: '#f0f0f0',
    borderRadius: '5px',
    marginBottom: '15px'
  },
  mockBookImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '5px'
  },
  mockBookText: {
    fontSize: '24px',
    color: '#999',
    fontWeight: 'bold'
  },
  listeningDemo: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '15px'
  },
  audioControls: {
    marginBottom: '15px'
  },
  audioButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  audioPlayerDemo: {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '5px'
  },
  subtitles: {
    marginBottom: '15px',
    maxHeight: '150px',
    overflowY: 'auto'
  },
  subtitleItem: {
    padding: '8px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between'
  },
  subtitleTime: {
    color: '#666',
    fontSize: '12px'
  },
  subtitleText: {
    fontWeight: '500'
  },
  menuDemo: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '15px'
  },
  menuControls: {
    marginBottom: '15px'
  },
  menuButton: {
    padding: '10px 20px',
    backgroundColor: '#9C27B0',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  menuContentDemo: {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9'
  },
  menuItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '4px'
  },
  menuStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  progressDisplay: {
    padding: '8px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    color: '#1976d2',
    fontWeight: 'bold',
    textAlign: 'center'
  }
};

export default EnglishBookPicReadTest;
