import React, { useState, useEffect } from 'react';
import { F_speak } from "../Function/weisimin.js";

const TestPuzzleFloating = ({ 
  testData = [],
  floatingMode = true,
  onClose
}) => {
  const [wordList, setWordList] = useState(testData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [testResults, setTestResults] = useState([]);
  const [testStartTime, setTestStartTime] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const currentWord = wordList[currentIndex] || {};

  useEffect(() => {
    if (wordList.length > 0 && testStarted && !testCompleted) {
      const word = currentWord.english.toLowerCase();
      const letters = word.split('');
      
      const shuffledLetters = [...letters];
      for (let i = shuffledLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledLetters[i], shuffledLetters[j]] = [shuffledLetters[j], shuffledLetters[i]];
      }
      
      setAvailableLetters(shuffledLetters.map((letter, index) => ({
        letter,
        index,
        used: false
      })));
      
      setUserAnswer(Array(word.length).fill(null));
      setIsCorrect(null);
      setShowAnswer(false);
    }
  }, [currentIndex, wordList, testStarted]);

  // 语音播放函数 - 只朗读整个单词
  const handleSpeakWord = (word) => {
    if (isSpeaking) return;
    
    setIsSpeaking(true);
    F_speak(word);
    
    // 估计播放时间（假设每秒10个字符）
    const estimatedTime = Math.max(1000, word.length * 100);
    setTimeout(() => {
      setIsSpeaking(false);
    }, estimatedTime);
  };

  const handleLetterClick = (letterIndex) => {
    if (!testStarted || testCompleted || isCorrect !== null || showAnswer) return;
    
    const letterObj = availableLetters[letterIndex];
    if (!letterObj || letterObj.used) return;
    
    const emptySlotIndex = userAnswer.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) return;
    
    const newUserAnswer = [...userAnswer];
    newUserAnswer[emptySlotIndex] = { letter: letterObj.letter, originalIndex: letterIndex };
    setUserAnswer(newUserAnswer);
    
    const newAvailableLetters = [...availableLetters];
    newAvailableLetters[letterIndex] = { ...letterObj, used: true };
    setAvailableLetters(newAvailableLetters);
    
    if (newUserAnswer.every(slot => slot !== null)) {
      const userAnswerString = newUserAnswer.map(slot => slot?.letter || '').join('');
      const isAnswerCorrect = userAnswerString.toLowerCase() === currentWord.english.toLowerCase();
      
      setIsCorrect(isAnswerCorrect);
      
      // 记录结果
      const newTestResults = [...testResults];
      newTestResults[currentIndex] = {
        word: currentWord.english,
        chinese: currentWord.chinese,
        userAnswer: userAnswerString,
        isCorrect: isAnswerCorrect,
        score: isAnswerCorrect ? (100 / wordList.length) : 0
      };
      setTestResults(newTestResults);
      
      if (isAnswerCorrect) setCorrectCount(c => c + 1);
      else setIncorrectCount(c => c + 1);
    }
  };

  const showAnswerHandler = () => {
    if (!testStarted || testCompleted || isCorrect !== null || showAnswer) return;
    
    setShowAnswer(true);
    const correctAnswer = currentWord.english.toLowerCase();
    const letters = correctAnswer.split('');
    
    setUserAnswer(letters.map((letter, index) => ({
      letter,
      originalIndex: index
    })));
    
    setAvailableLetters(availableLetters.map(letterObj => ({
      ...letterObj,
      used: true
    })));
    
    setIsCorrect(false);
    setIncorrectCount(c => c + 1);
    
    const newTestResults = [...testResults];
    newTestResults[currentIndex] = {
      word: currentWord.english,
      chinese: currentWord.chinese,
      userAnswer: correctAnswer,
      isCorrect: false,
      score: 0,
      showedAnswer: true
    };
    setTestResults(newTestResults);
  };

  const handleAnswerSlotClick = (index) => {
    if (!testStarted || testCompleted || isCorrect !== null || showAnswer) return;
    
    const letterObj = userAnswer[index];
    if (!letterObj) return;
    
    const newUserAnswer = [...userAnswer];
    newUserAnswer[index] = null;
    setUserAnswer(newUserAnswer);
    
    const newAvailableLetters = [...availableLetters];
    newAvailableLetters[letterObj.originalIndex] = {
      ...newAvailableLetters[letterObj.originalIndex],
      used: false
    };
    setAvailableLetters(newAvailableLetters);
  };

  const nextWord = () => {
    if (!testStarted) return;
    
    if (currentIndex < wordList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      endTest();
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setTestCompleted(false);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowAnswer(false);
    setTestResults([]);
    setTestStartTime(new Date());
  };

  const endTest = () => {
    setTestCompleted(true);
    setTestStarted(false);
  };

  const calculateTotalScore = () => {
    const wordScore = 100 / wordList.length;
    let totalScore = 0;
    
    testResults.forEach(result => {
      if (result && result.isCorrect) {
        totalScore += wordScore;
      }
    });
    
    return Math.round(totalScore * 100) / 100;
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (floatingMode && !isVisible) {
    return (
      <button onClick={() => setIsVisible(true)} style={styles.floatingButton}>
        🧩
      </button>
    );
  }

  if (testCompleted) {
    const totalScore = calculateTotalScore();
    const currentTime = new Date();

    return (
      <div style={styles.container(floatingMode)}>
        {floatingMode && (
          <div style={styles.closeButton}>
            <button onClick={() => { setIsVisible(false); onClose && onClose(); }} style={styles.closeBtn}>×</button>
          </div>
        )}
        
        <div style={styles.timeDisplay}>
          <div style={styles.currentTime}>
            <span style={styles.timeIcon}>🕐</span>
            {formatTime(currentTime)}
          </div>
          <div style={styles.testDate}>{formatDate(currentTime)}</div>
        </div>
        
        <h2 style={styles.title}>测试完成</h2>
        
        <div style={styles.scoreDisplay}>
          <div style={styles.scoreCircle}>
            <div style={styles.scoreValue}>{totalScore}</div>
            <div style={styles.scoreLabel}>得分</div>
          </div>
          <div style={styles.scoreDetails}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>正确:</span>
              <span style={{color: '#2ecc71'}}>{correctCount}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>错误:</span>
              <span style={{color: '#e74c3c'}}>{incorrectCount}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>总数:</span>
              <span style={{color: '#667eea'}}>{wordList.length}</span>
            </div>
          </div>
        </div>
        
        <div style={styles.resultsTable}>
          <h3 style={styles.resultsTitle}>详细结果</h3>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>单词/短语</th>
                  <th style={styles.tableHeader}>得分</th>
                  <th style={styles.tableHeader}>状态</th>
                  <th style={styles.tableHeader}>发音</th>
                </tr>
              </thead>
              <tbody>
                {wordList.map((word, index) => {
                  const result = testResults[index];
                  const wordScore = 100 / wordList.length;
                  return (
                    <tr key={index} style={styles.tableRow(index)}>
                      <td style={styles.tableCell}>{word.english}</td>
                      <td style={styles.tableCell}>
                        {result ? (result.isCorrect ? wordScore.toFixed(1) : '0.0') : '0.0'}
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: result ? 
                            (result.isCorrect ? '#d4f8e8' : 
                             result.showedAnswer ? '#ffedd5' : '#f8d7da') : '#f1f5f9',
                          color: result ? 
                            (result.isCorrect ? '#065f46' : 
                             result.showedAnswer ? '#92400e' : '#991b1b') : '#64748b'
                        }}>
                          {result ? 
                            (result.isCorrect ? '正确' : 
                             result.showedAnswer ? '显示答案' : '错误') : 
                            '未答'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <button
                          onClick={() => handleSpeakWord(word.english)}
                          style={{
                            ...styles.speakButton,
                            opacity: isSpeaking ? 0.5 : 1,
                            cursor: isSpeaking ? 'not-allowed' : 'pointer'
                          }}
                          disabled={isSpeaking}
                        >
                          🔊
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style={styles.buttonGroup}>
          <button style={styles.primaryButton} onClick={startTest}>重新测试</button>
          <button style={styles.secondaryButton} onClick={() => { setIsVisible(false); onClose && onClose(); }}>关闭</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container(floatingMode)}>
      {floatingMode && (
        <div style={styles.closeButton}>
          <button onClick={() => { setIsVisible(false); onClose && onClose(); }} style={styles.closeBtn}>×</button>
        </div>
      )}
      
      <h2 style={styles.title}>英语拼图测试</h2>
      
      {!testStarted ? (
        <div style={styles.startScreen}>
          <button style={styles.startButton} onClick={startTest}>开始测试</button>
          <div style={styles.wordCount}>题目数量: {wordList.length}</div>
        </div>
      ) : (
        <>
          <div style={styles.wordInfo}>
            <div style={styles.chinese}>{currentWord.chinese}</div>
            {currentWord.phonetic && <div style={styles.phonetic}>{currentWord.phonetic}</div>}
            <div style={styles.progress}>进度: {currentIndex + 1} / {wordList.length}</div>
            
            {/* 整词发音按钮 */}
            <button
              onClick={() => handleSpeakWord(currentWord.english)}
              style={{
                ...styles.speakWordButton,
                opacity: isSpeaking ? 0.5 : 1,
                cursor: isSpeaking ? 'not-allowed' : 'pointer'
              }}
              disabled={isSpeaking}
            >
              🔊 朗读单词
            </button>
          </div>
          
          <div style={styles.answerArea}>
            <div style={styles.sectionTitle}>拼写区</div>
            <div style={styles.answerSlots}>
              {userAnswer.map((slot, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.slot,
                    background: slot ? (showAnswer ? "#ffedd5" : "#e3f2fd") : "#f8f9fa",
                    border: slot ? (showAnswer ? "2px solid #f59e0b" : "2px solid #2196f3") : "2px dashed #ced4da",
                    color: slot ? (showAnswer ? "#92400e" : "#1976d2") : "#adb5bd",
                    cursor: slot && !showAnswer ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (!showAnswer && slot) {
                      handleAnswerSlotClick(index);
                    }
                  }}
                >
                  {slot ? slot.letter : ''}
                </div>
              ))}
            </div>
          </div>
          
          <div style={styles.letterArea}>
            <div style={styles.sectionTitle}>字母区</div>
            <div style={styles.letterGrid}>
              {availableLetters.map((letterObj, index) => (
                letterObj && !letterObj.used ? (
                  <div
                    key={index}
                    style={{
                      ...styles.letter,
                      background: showAnswer ? "#cbd5e1" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      cursor: showAnswer ? "not-allowed" : "pointer",
                      opacity: showAnswer ? 0.5 : 1,
                    }}
                    onClick={() => !showAnswer && handleLetterClick(index)}
                  >
                    {letterObj.letter}
                  </div>
                ) : (
                  <div key={index} style={styles.usedLetter}>✓</div>
                )
              ))}
            </div>
          </div>
          
          <div style={styles.statsBar}>
            <div>
              正确: <span style={{color: '#2ecc71'}}>{correctCount}</span> | 
              错误: <span style={{color: '#e74c3c'}}>{incorrectCount}</span>
            </div>
            <button style={styles.endButton} onClick={endTest}>结束测试</button>
          </div>
          
          {isCorrect === null && !showAnswer && (
            <div style={styles.showAnswerButton}>
              <button style={styles.showAnswerBtn} onClick={showAnswerHandler}>
                🔍 显示答案
              </button>
            </div>
          )}
          
          {isCorrect !== null && (
            <div style={{
              ...styles.resultMessage,
              background: showAnswer ? "#fef3c7" : (isCorrect ? "#d4f8e8" : "#f8d7da"),
              color: showAnswer ? "#92400e" : (isCorrect ? "#155724" : "#721c24"),
              border: showAnswer ? "1px solid #f59e0b" : (isCorrect ? "1px solid #2ecc71" : "1px solid #e74c3c"),
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '5px' }}>
                {showAnswer ? '📖 已显示答案' : (isCorrect ? '🎉 正确！' : '❌ 错误！')}
                {/* 结果区的整词发音按钮 */}
                <button
                  onClick={() => handleSpeakWord(currentWord.english)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1rem',
                    cursor: isSpeaking ? 'not-allowed' : 'pointer',
                    opacity: isSpeaking ? 0.5 : 1
                  }}
                  disabled={isSpeaking}
                >
                  🔊
                </button>
              </div>
              <div>正确答案: <strong>{currentWord.english}</strong></div>
              <button style={styles.nextButton} onClick={nextWord}>
                {currentIndex < wordList.length - 1 ? '下一个' : '查看结果'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 精简的样式
const styles = {
  container: (floating) => ({
    position: floating ? 'fixed' : 'relative',
    left: floating ? '50%' : 'auto',
    top: floating ? '50%' : 'auto',
    transform: floating ? 'translate(-50%, -50%)' : 'none',
    backgroundColor: "#f5f7fa",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: floating ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
    width: floating ? '500px' : 'auto',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    zIndex: 2000,
  }),
  floatingButton: {
    position: 'fixed',
    right: '30px',
    bottom: '30px',
    zIndex: 9999,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
    fontSize: '1.5rem',
  },
  closeButton: { textAlign: 'right', marginBottom: '10px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' },
  timeDisplay: { textAlign: 'center', marginBottom: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '8px' },
  currentTime: { fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' },
  timeIcon: { marginRight: '8px' },
  testDate: { fontSize: '0.9rem', color: '#64748b' },
  title: { textAlign: 'center', marginBottom: '20px', color: '#1e293b' },
  scoreDisplay: { backgroundColor: "white", borderRadius: "8px", padding: "20px", marginBottom: '20px', textAlign: "center" },
  scoreCircle: { width: '100px', height: '100px', margin: '0 auto 15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontSize: '2rem', fontWeight: 'bold', color: 'white' },
  scoreLabel: { fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginTop: '5px' },
  scoreDetails: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  detailItem: { textAlign: 'center' },
  detailLabel: { display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' },
  resultsTable: { backgroundColor: "white", borderRadius: "8px", padding: "15px", marginBottom: '20px' },
  resultsTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px', textAlign: 'center' },
  tableContainer: { maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' },
  tableHeader: { backgroundColor: '#f8fafc', padding: '10px 6px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' },
  tableRow: (index) => ({ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }),
  tableCell: { padding: '8px 6px', color: '#475569' },
  statusBadge: { padding: '3px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600' },
  startScreen: { textAlign: 'center' },
  startButton: { background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)", color: "white", border: "none", padding: "12px 30px", borderRadius: "6px", fontSize: "1rem", cursor: "pointer", fontWeight: 'bold' },
  wordCount: { marginTop: '10px', color: '#7f8c8d', fontSize: '0.9rem' },
  wordInfo: { backgroundColor: "white", borderRadius: "8px", padding: "15px", marginBottom: "20px", textAlign: "center" },
  chinese: { fontSize: '1.3rem', marginBottom: '8px', color: '#1e293b', fontWeight: 'bold' },
  phonetic: { color: '#7f8c8d', marginBottom: '8px', fontStyle: 'italic', fontSize: '0.9rem' },
  progress: { fontSize: '0.9rem', color: '#667eea', backgroundColor: '#eef2ff', padding: '4px 10px', borderRadius: '12px', display: 'inline-block' },
  speakWordButton: {
    marginTop: '10px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 'bold'
  },
  answerArea: { backgroundColor: "white", borderRadius: "8px", padding: "15px", marginBottom: "15px" },
  letterArea: { backgroundColor: "white", borderRadius: "8px", padding: "15px", marginBottom: "20px" },
  sectionTitle: { textAlign: 'center', marginBottom: '10px', color: '#475569', fontWeight: '600' },
  answerSlots: { display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" },
  slot: { width: "38px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", fontSize: "1.2rem", fontWeight: "bold" },
  letterGrid: { display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" },
  letter: { width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", borderRadius: "6px", fontSize: "1rem", fontWeight: "bold" },
  usedLetter: { width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0", color: "#ccc", borderRadius: "6px", fontSize: "0.9rem" },
  statsBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px 15px', backgroundColor: 'white', borderRadius: '8px' },
  endButton: { background: "#e74c3c", color: "white", border: "none", padding: "6px 16px", borderRadius: "4px", cursor: "pointer", fontSize: '0.9rem' },
  showAnswerButton: { padding: "10px", borderRadius: "8px", backgroundColor: "#fef3c7", border: "1px solid #f59e0b", marginBottom: "15px", textAlign: "center" },
  showAnswerBtn: { background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" },
  resultMessage: { padding: "12px", borderRadius: "8px", marginBottom: "15px", textAlign: "center" },
  nextButton: { marginTop: '10px', background: "#667eea", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: '0.9rem' },
  buttonGroup: { display: 'flex', justifyContent: 'center', gap: '10px' },
  primaryButton: { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" },
  secondaryButton: { background: "#95a5a6", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" },
  speakButton: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#eef2ff',
    color: '#4f46e5'
  }
};

export default TestPuzzleFloating;