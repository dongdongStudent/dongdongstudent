import React, { useState, useEffect, useRef } from 'react';
import TestPuzzleFloating from './workSpell.js';
import TranslationPracticeCore from '../sentence/sentence.js';
import { F_speak, stopAllSpeak } from "../Function/weisimin.js"; // 导入语音函数和停止函数

function EnglishKnowledgeTest() {
  const [testData, setTestData] = useState({
    grades: [],
    wordForms: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState(null);
  const [testMode, setTestMode] = useState('select');
  const [showPuzzleTest, setShowPuzzleTest] = useState(false);
  const [showSentenceTest, setShowSentenceTest] = useState(false);
  const [currentPuzzleData, setCurrentPuzzleData] = useState([]);
  const [currentSentenceData, setCurrentSentenceData] = useState([]);
  
  // 语音相关状态
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakQueue, setSpeakQueue] = useState([]);
  const [currentSpeakingText, setCurrentSpeakingText] = useState('');
  const speakingRef = useRef(false); // 使用 ref 避免闭包问题

  // 从public文件夹加载JSON数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/english_test_data.json');
        const data = await response.json();
        setTestData({
          grades: data.grades || [],
          wordForms: data.wordForms || []
        });
        setLoading(false);
      } catch (error) {
        console.error('加载数据失败:', error);
        setTestData({
          grades: [],
          wordForms: []
        });
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 组件卸载时停止语音
  useEffect(() => {
    return () => {
      stopAllSpeak();
    };
  }, []);

  // 获取当前数据
  const getCurrentData = () => {
    if (!selectedKnowledge) return [];
    const grade = testData.grades.find(g => g.id === selectedGrade);
    if (!grade) return [];
    const unit = grade.units.find(u => u.id === selectedUnit);
    if (!unit) return [];
    const knowledge = unit.knowledgePoints.find(k => k.id === selectedKnowledge);
    return knowledge ? knowledge.data : [];
  };

  // 获取当前知识点类型
  const getCurrentKnowledgeType = () => {
    if (!selectedKnowledge) return '';
    const grade = testData.grades.find(g => g.id === selectedGrade);
    if (!grade) return '';
    const unit = grade.units.find(u => u.id === selectedUnit);
    if (!unit) return '';
    const knowledge = unit.knowledgePoints.find(k => k.id === selectedKnowledge);
    return knowledge ? knowledge.type : '';
  };

  // 获取当前年级
  const getCurrentGrade = () => testData.grades.find(g => g.id === selectedGrade);
  const getCurrentUnit = () => getCurrentGrade()?.units.find(u => u.id === selectedUnit);
  const getCurrentKnowledge = () => getCurrentUnit()?.knowledgePoints.find(k => k.id === selectedKnowledge);

  // 语音播放函数（带队列）
  const handleSpeak = async (text, addToQueue = true) => {
    // 文本处理：清理特殊字符
    const cleanText = text.replace(/[•·]/g, '.').trim();
    
    // 如果正在播放
    if (speakingRef.current) {
      if (addToQueue) {
        // 添加到队列
        setSpeakQueue(prev => [...prev, cleanText]);
        console.log(`📋 已添加到队列: ${cleanText.substring(0, 20)}...`);
      }
      return;
    }
    
    // 开始播放
    speakingRef.current = true;
    setIsSpeaking(true);
    setCurrentSpeakingText(cleanText);
    
    try {
      console.log('🔊 开始播放:', cleanText);
      const result = await F_speak(cleanText);
      
      if (result === 1) {
        console.log('✅ 播放完成');
        
        // 播放完成后，检查队列
        if (speakQueue.length > 0) {
          const nextText = speakQueue[0];
          setSpeakQueue(prev => prev.slice(1));
          
          // 延迟一点点播放下一个，避免冲突
          setTimeout(() => {
            speakingRef.current = false;
            setIsSpeaking(false);
            handleSpeak(nextText, false);
          }, 100);
          return;
        }
      } else if (result === 0) {
        console.log('⏹️ 播放被中断');
      }
    } catch (error) {
      console.error('❌ 播放失败:', error);
    } finally {
      // 如果没有队列中的下一个，重置状态
      if (speakQueue.length === 0) {
        speakingRef.current = false;
        setIsSpeaking(false);
        setCurrentSpeakingText('');
      }
    }
  };

  // 停止所有语音播放
  const handleStopSpeak = () => {
    stopAllSpeak(); // 调用已有的停止函数
    speakingRef.current = false;
    setIsSpeaking(false);
    setSpeakQueue([]); // 清空队列
    setCurrentSpeakingText('');
    console.log('⏹️ 语音已停止');
  };

  // 语音按钮组件 - 右上角圆形设计
  const SpeakButton = ({ text, showQueue = true }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isThisPlaying = isSpeaking && currentSpeakingText === text;
    
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isThisPlaying) {
              handleStopSpeak(); // 如果正在播放，点击停止
            } else {
              handleSpeak(text, true); // 否则开始播放
            }
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={isSpeaking && !isThisPlaying} // 只有正在播放的才能点击停止，其他禁用
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isThisPlaying 
              ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            fontSize: '1rem',
            cursor: isThisPlaying ? 'pointer' : (isSpeaking ? 'not-allowed' : 'pointer'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            opacity: isSpeaking && !isThisPlaying ? 0.5 : 1,
            zIndex: 10,
            boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
          title={isThisPlaying ? '点击停止播放' : (isSpeaking ? '正在播放其他语音' : '点击朗读')}
        >
          {isThisPlaying ? '⏹️' : '🔊'}
        </button>

        {/* 悬浮提示 - 显示详细信息 */}
        {isHovered && !isThisPlaying && speakQueue.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '45px',
            right: '10px',
            background: '#1e293b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            zIndex: 20,
            minWidth: '180px',
            maxWidth: '250px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              📋 播放队列 ({speakQueue.length})
            </div>
            {speakQueue.slice(0, 2).map((item, index) => (
              <div key={index} style={{
                padding: '2px 0',
                fontSize: '0.7rem',
                color: '#cbd5e1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {index + 1}. {item.length > 25 ? item.substring(0, 25) + '...' : item}
              </div>
            ))}
            {speakQueue.length > 2 && (
              <div style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.7rem' }}>
                等 {speakQueue.length} 个待播放
              </div>
            )}
          </div>
        )}

        {/* 正在播放提示 */}
        {isHovered && isThisPlaying && (
          <div style={{
            position: 'absolute',
            top: '45px',
            right: '10px',
            background: '#1e293b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              backgroundColor: '#f97316',
              borderRadius: '50%',
              animation: 'pulse 1s infinite',
            }} />
            正在播放，点击停止
          </div>
        )}
      </div>
    );
  };

  // 全局语音控制栏
  const GlobalSpeakControl = () => {
    if (!isSpeaking && speakQueue.length === 0) return null;
    
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'white',
        borderRadius: '12px',
        padding: '12px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        zIndex: 9999,
        border: isSpeaking ? '2px solid #f97316' : '2px solid #3b82f6',
        animation: 'slideIn 0.3s ease-out',
      }}>
        <style>
          {`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes pulse {
              0% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.2);
                opacity: 0.7;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}
        </style>
        
        <div>
          {isSpeaking ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#f97316',
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite',
                }} />
                <span style={{ color: '#f97316', fontWeight: 'bold' }}>正在播放</span>
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#64748b', 
                maxWidth: '250px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                marginTop: '4px',
                padding: '4px 8px',
                background: '#f1f5f9',
                borderRadius: '4px',
              }}>
                {currentSpeakingText}
              </div>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                }} />
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                  队列: {speakQueue.length} 个待播放
                </span>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleStopSpeak}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span>⏹️</span> 停止全部
        </button>
      </div>
    );
  };

  // 准备测试数据（处理空格为特殊字符）
  const prepareTestData = () => {
    const data = getCurrentData();
    const knowledgeType = getCurrentKnowledgeType();

    if (knowledgeType === 'phrases') {
      // 处理短语，将空格替换为特殊符号以便拼图
      return data.map(phrase => ({
        ...phrase,
        // 用于拼图测试的格式：将空格替换为特殊符号
        puzzleEnglish: phrase.english.toLowerCase().replace(/\s+/g, '_'),
        // 保存原始短语用于显示和检查
        originalEnglish: phrase.english
      }));
    }

    return data;
  };

  // 开始拼图测试
  const startPuzzleTest = () => {
    const preparedData = prepareTestData();
    setCurrentPuzzleData(preparedData);
    setShowPuzzleTest(true);
  };

  // 开始句子测试
  const startSentenceTest = () => {
    const data = getCurrentData();
    
    if (data.length === 0) {
      alert('没有句子数据');
      return;
    }

    console.log('📚 句子列表:');
    data.forEach((item, i) => {
      console.log(`${i + 1}. ${item.chinese} → ${item.english}`);
    });
    console.log(`总计: ${data.length} 个句子`);

    setCurrentSentenceData(data);
    setShowSentenceTest(true);
  };

  // 样式
  const styles = {
    app: {
      fontFamily: "'Microsoft YaHei', sans-serif",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
    header: {
      textAlign: "center",
      marginBottom: "30px",
      paddingBottom: "20px",
      borderBottom: "3px solid #e2e8f0",
    },
    title: {
      fontSize: "2.2rem",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "10px",
    },
    layout: {
      display: "flex",
      gap: "20px",
    },
    sidebar: {
      flex: "0 0 250px",
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    },
    mainContent: {
      flex: "1",
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "25px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    },
    sectionTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "15px",
    },
    card: {
      backgroundColor: "#f8fafc",
      borderRadius: "12px",
      padding: "20px",
      margin: "10px 0",
      border: "2px solid #e2e8f0",
      cursor: "pointer",
      transition: "all 0.3s",
    },
    button: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#64748b",
      color: "white",
      cursor: "pointer",
      marginBottom: "20px",
    },
    wordItem: {
      backgroundColor: "#f8fafc",
      padding: "15px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      position: "relative",
    },
    phraseItem: {
      backgroundColor: "#f0f9ff",
      padding: "15px",
      marginBottom: "8px",
      borderRadius: "6px",
      color: "#0369a1",
      border: "1px solid #bae6fd",
      position: "relative",
    },
    transformationItem: {
      backgroundColor: "#fef3c7",
      padding: "15px",
      marginBottom: "8px",
      borderRadius: "6px",
      color: "#92400e",
      border: "1px solid #f59e0b",
      position: "relative",
    },
    formItem: {
      backgroundColor: "#fef3c7",
      padding: "10px 15px",
      marginBottom: "8px",
      borderRadius: "6px",
      color: "#92400e",
    },
    sentenceCard: {
      backgroundColor: "#f0f9ff",
      borderRadius: "12px",
      padding: "20px",
      margin: "10px 0",
      border: "2px solid #0ea5e9",
      cursor: "pointer",
      transition: "all 0.3s",
    }
  };

  if (loading) {
    return (
      <div style={styles.app}>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
          <h2>正在加载数据...</h2>
        </div>
      </div>
    );
  }

  const currentKnowledgeType = getCurrentKnowledgeType();

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>初中英语知识点测试系统</h1>
        <p style={{ color: "#64748b" }}>七年级 - 英语知识点测试</p>
      </header>

      <div style={styles.layout}>
        {/* 左侧目录栏 */}
        <div style={styles.sidebar}>
          <h3 style={styles.sectionTitle}>📚 知识点目录</h3>

          {/* 年级选择 */}
          <div>
            <h4 style={{ marginBottom: "10px", color: "#475569" }}>选择年级</h4>
            {testData.grades.map(grade => (
              <div
                key={grade.id}
                style={{
                  padding: "10px 15px",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: selectedGrade === grade.id ? "#4f46e5" : "#f8fafc",
                  color: selectedGrade === grade.id ? "white" : "inherit",
                  border: "1px solid #e2e8f0",
                }}
                onClick={() => {
                  setSelectedGrade(grade.id);
                  setSelectedUnit(null);
                  setSelectedKnowledge(null);
                  setTestMode('select');
                }}
              >
                📘 {grade.name}
              </div>
            ))}
          </div>

          {/* 单元选择 */}
          {selectedGrade && getCurrentGrade()?.units.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ marginBottom: "10px", color: "#475569" }}>选择单元</h4>
              {getCurrentGrade()?.units.map(unit => (
                <div
                  key={unit.id}
                  style={{
                    padding: "10px 15px",
                    marginBottom: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: selectedUnit === unit.id ? "#7c3aed" : "#f8fafc",
                    color: selectedUnit === unit.id ? "white" : "inherit",
                    border: "1px solid #e2e8f0",
                  }}
                  onClick={() => {
                    setSelectedUnit(unit.id);
                    setSelectedKnowledge(null);
                    setTestMode('select');
                  }}
                >
                  👋 {unit.name}
                </div>
              ))}
            </div>
          )}

          {/* 知识点选择 */}
          {selectedUnit && getCurrentUnit()?.knowledgePoints.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ marginBottom: "10px", color: "#475569" }}>选择知识点</h4>
              {getCurrentUnit()?.knowledgePoints.map(knowledge => (
                <div
                  key={knowledge.id}
                  style={{
                    padding: "10px 15px",
                    marginBottom: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: selectedKnowledge === knowledge.id ? "#10b981" : "#f8fafc",
                    color: selectedKnowledge === knowledge.id ? "white" : "inherit",
                    border: "1px solid #e2e8f0",
                  }}
                  onClick={() => {
                    setSelectedKnowledge(knowledge.id);
                    setTestMode('select');
                  }}
                >
                  {knowledge.type === 'words' ? '🔤' :
                    knowledge.type === 'vocabulary_transformation' ? '📖' :
                      knowledge.type === 'phrases' ? '📖' :
                        knowledge.type === 'sentences' ? '💬' : '📝'} {knowledge.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 主内容区 */}
        <div style={styles.mainContent}>
          {!selectedKnowledge ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📖</div>
              <h2>欢迎使用英语知识点测试系统</h2>
              <p>请从左侧目录选择年级、单元和知识点开始学习</p>
            </div>
          ) : testMode === 'select' ? (
            <div>
              <h2 style={styles.sectionTitle}>选择学习模式</h2>
              <p style={{ color: "#64748b", marginBottom: "20px" }}>
                当前选择: {getCurrentGrade()?.name} &gt; {getCurrentUnit()?.name} &gt; {getCurrentKnowledge()?.name}
              </p>

              {/* 拼图测试模式 - 用于单词、短语和词形变化 */}
              {(currentKnowledgeType === 'words' || currentKnowledgeType === 'phrases' || currentKnowledgeType === 'vocabulary_transformation') && (
                <div
                  style={styles.card}
                  onClick={startPuzzleTest}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor =
                      currentKnowledgeType === 'words' ? "#4f46e5" :
                        currentKnowledgeType === 'phrases' ? "#10b981" :
                          "#f59e0b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <h3 style={{
                    color: currentKnowledgeType === 'words' ? "#4f46e5" :
                      currentKnowledgeType === 'phrases' ? "#10b981" :
                        "#f59e0b",
                    marginBottom: "10px"
                  }}>
                    {currentKnowledgeType === 'words' ? '🧩 单词拼图测试' :
                      currentKnowledgeType === 'phrases' ? '🧩 短语拼图测试' :
                        '🧩 词形变化测试'}
                  </h3>
                  <p style={{ color: "#64748b" }}>
                    {currentKnowledgeType === 'words'
                      ? '通过字母拼图的方式学习单词，点击字母进行拼写，适合记忆单词拼写'
                      : currentKnowledgeType === 'phrases'
                        ? '通过字母拼图的方式学习短语，空格用"_"表示，适合记忆短语拼写'
                        : '通过字母拼图的方式学习词形变化，根据中文提示拼写对应的英文形式'}
                  </p>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    marginTop: "10px",
                    padding: "8px",
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: "6px"
                  }}>
                    {currentKnowledgeType === 'phrases' && (
                      <div>
                        <strong>注意：</strong>短语中的空格会用"_"表示
                        <div style={{ marginTop: "5px" }}>
                          例如: "take care of" → "take_care_of"
                        </div>
                      </div>
                    )}
                    {currentKnowledgeType === 'vocabulary_transformation' && (
                      <div>
                        <strong>提示：</strong>根据中文提示拼写正确的英文词形
                        <div style={{ marginTop: "5px" }}>
                          例如: "fox—(复数)" → 拼写 "foxes"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 句子测试模式 */}
              {currentKnowledgeType === 'sentences' && (
                <div
                  style={styles.sentenceCard}
                  onClick={startSentenceTest}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = "#0ea5e9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#0ea5e9";
                  }}
                >
                  <h3 style={{
                    color: "#0ea5e9",
                    marginBottom: "10px"
                  }}>
                    💬 句子测试
                  </h3>
                  <p style={{ color: "#64748b" }}>
                    测试句子翻译和语法，根据中文提示写出对应的英文句子
                  </p>
                </div>
              )}

              {/* 复习模式 */}
              <div
                style={styles.card}
                onClick={() => setTestMode('review')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = "#f59e0b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <h3 style={{ color: "#f59e0b", marginBottom: "10px" }}>📚 复习模式</h3>
                <p style={{ color: "#64748b" }}>
                  查看所有内容，适合预习和复习
                </p>
              </div>
            </div>
          ) : testMode === 'review' ? (
            <div>
              <h2 style={styles.sectionTitle}>📚 复习模式</h2>
              <button
                style={styles.button}
                onClick={() => setTestMode('select')}
              >
                ← 返回选择模式
              </button>

              {/* 单词或短语列表 - 添加语音按钮 */}
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{
                  color: currentKnowledgeType === 'words' ? "#4f46e5" :
                    currentKnowledgeType === 'phrases' ? "#10b981" :
                      currentKnowledgeType === 'vocabulary_transformation' ? "#f59e0b" :
                        currentKnowledgeType === 'sentences' ? "#0ea5e9" : "#475569",
                  marginBottom: "15px"
                }}>
                  {currentKnowledgeType === 'words' ? '🔤 单词列表' :
                    currentKnowledgeType === 'phrases' ? '📖 短语列表' :
                      currentKnowledgeType === 'vocabulary_transformation' ? '🔄 词形变化列表' :
                        currentKnowledgeType === 'sentences' ? '💬 句子列表' : '📝 内容列表'}
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "10px"
                }}>
                  {getCurrentData().map(item => (
                    <div
                      key={item.id}
                      style={{
                        ...(currentKnowledgeType === 'words' ? styles.wordItem :
                          currentKnowledgeType === 'phrases' ? styles.phraseItem :
                            currentKnowledgeType === 'vocabulary_transformation' ? styles.transformationItem :
                              styles.wordItem),
                        position: "relative",
                        minHeight: "80px",
                        paddingRight: "70px"
                      }}
                    >
                      <div style={{ fontWeight: "600", fontSize: "1.1rem", color: "#1e293b" }}>
                        {item.english}
                      </div>
                      <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                        {item.chinese}
                      </div>
                      {item.phonetic && (
                        <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>
                          {item.phonetic}
                        </div>
                      )}
                      {currentKnowledgeType === 'phrases' && (
                        <div style={{
                          fontSize: "0.8rem",
                          color: "#dc2626",
                          marginTop: "5px",
                          padding: "3px 6px",
                          backgroundColor: "#fee2e2",
                          borderRadius: "4px"
                        }}>
                          拼图模式: {item.english.toLowerCase().replace(/\s+/g, '_')}
                        </div>
                      )}
                      
                      {/* 语音按钮 */}
                      <SpeakButton text={item.english} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 全局词形变化 - 也添加语音按钮 */}
              {currentKnowledgeType === 'words' && testData.wordForms.length > 0 && (
                <div>
                  <h3 style={{ color: "#f59e0b", marginBottom: "15px" }}>🔄 词形变化</h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "10px"
                  }}>
                    {testData.wordForms.map((form, index) => {
                      // 提取单词部分（例如从 "go—went—gone" 中提取 "go"）
                      const words = form.split(/[—\-]/);
                      const mainWord = words[0];
                      
                      return (
                        <div key={index} style={{
                          ...styles.formItem,
                          position: "relative",
                          paddingRight: "50px",
                          minHeight: "50px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}>
                          <span>{form}</span>
                          <SpeakButton text={mainWord} showQueue={false} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* 拼图测试组件 - 用于单词、短语和词形变化测试 */}
      {showPuzzleTest && currentPuzzleData.length > 0 && (
        <TestPuzzleFloating
          testData={currentPuzzleData.map(item => {
            const knowledgeType = getCurrentKnowledgeType();

            // 处理不同知识点的数据显示
            let processedItem = {
              ...item,
              chinese: item.chinese,
            };

            if (knowledgeType === 'phrases') {
              // 短语：空格替换为_
              processedItem.english = item.puzzleEnglish || item.english.toLowerCase().replace(/\s+/g, '_');
              processedItem.originalEnglish = item.english;
              processedItem.spaceSymbol = '_';
            } else if (knowledgeType === 'vocabulary_transformation') {
              // 词形变化：保持原样
              processedItem.english = item.english.toLowerCase();
              processedItem.isTransformation = true;
            } else {
              // 单词：转为小写
              processedItem.english = item.english.toLowerCase();
            }

            return processedItem;
          })}
          floatingMode={true}
          onClose={() => setShowPuzzleTest(false)}
        />
      )}

      {/* 句子测试组件 */}
      {showSentenceTest && currentSentenceData.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          width: '800px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 2000,
        }}>
          <div style={{ textAlign: 'right', marginBottom: '10px' }}>
            <button
              onClick={() => setShowSentenceTest(false)}
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <TranslationPracticeCore
            questions={currentSentenceData}
            title={getCurrentKnowledge()?.name || "句子练习"}
            subtitle={`${getCurrentGrade()?.name} · ${getCurrentUnit()?.name}`}
            onComplete={(results) => {
              console.log('句子练习完成！', results);
              alert(`练习完成！得分: ${results.score}`);
              setShowSentenceTest(false);
            }}
            onExit={() => setShowSentenceTest(false)}
            autoStart={true}
            minHeight="500px"
            maxHeight="800px"
          />
        </div>
      )}

      {/* 全局语音控制栏 */}
      <GlobalSpeakControl />
    </div>
  );
}

export default EnglishKnowledgeTest;