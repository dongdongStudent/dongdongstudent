import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Paper, Typography, Box, Button,
  Stack, Chip, Grid, LinearProgress, Zoom,
  CircularProgress, IconButton,
  Alert, useMediaQuery, useTheme, Card, CardActionArea, Avatar, Badge,
  CardContent, Breadcrumbs, Link
} from '@mui/material';
import {
  EmojiEvents, ArrowBack, Translate,
  AccessTime, Assignment, ChevronRight, MenuBook,
  School, LibraryBooks, Grade, Star, Home, Folder, Description
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";

const TranslationPractice = () => {
  // --- 状态控制 ---
  const [playlistData, setPlaylistData] = useState({}); // 整个数据结构
  const [grades, setGrades] = useState([]); // 年级列表
  const [currentGrade, setCurrentGrade] = useState(null); // 当前选择的年级
  const [currentUnit, setCurrentUnit] = useState(null); // 当前选择的单元
  const [currentSubUnit, setCurrentSubUnit] = useState(null); // 当前选择的子单元
  const [questions, setQuestions] = useState([]); // 当前题目
  const [view, setView] = useState('grades'); // grades, units, subunits, loading, quiz, result

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userWords, setUserWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [score, setScore] = useState(100);
  const [hasFailed, setHasFailed] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 添加开始时间记录
  const startTimeRef = useRef(null);

  // 1. 实时时间刷新
  useEffect(() => {
    if (view !== 'result') {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [view]);

  // 2. 加载目录结构 - 从 data 目录加载
  useEffect(() => {
    fetch('/SentenceSpell/content.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: 找不到 content.json 文件`);
        }
        return res.json();
      })
      .then(data => {
        console.log('加载的翻译练习结构:', data);
        setPlaylistData(data);

        // 提取年级列表
        const gradeList = Object.keys(data).map(gradeKey => {
          const gradeData = data[gradeKey];
          return {
            id: gradeKey,
            name: gradeData.name,
            icon: getGradeIcon(gradeKey),
            unitCount: Object.keys(gradeData.units || {}).length
          };
        });

        setGrades(gradeList);
      })
      .catch(err => {
        console.error("加载数据失败:", err);
        setPlaylistData({ error: true, message: err.message });
      });
  }, []);

  // 辅助函数：获取年级图标
  const getGradeIcon = (gradeKey) => {
    if (gradeKey === 'special') return <Star />;
    if (gradeKey.includes('7')) return <School />;
    if (gradeKey.includes('8')) return <LibraryBooks />;
    if (gradeKey.includes('9')) return <Grade />;
    return <School />;
  };

  // 辅助函数：获取子单元图标
  const getSubUnitIcon = (index) => {
    const icons = [
      <Description color="primary" />,
      <Description color="secondary" />,
      <Description color="success" />,
      <Description color="warning" />,
      <Description color="info" />,
      <Description color="error" />
    ];
    return icons[index % icons.length];
  };

  // 3. 初始化题目逻辑
  const initSentence = useCallback((idx, data) => {
    const item = data[idx];
    if (!item) return;

    const wordsArray = item.english.split(' ').filter(w => w.trim().length > 0);
    const wordsObjects = wordsArray.map((w, i) => ({
      uid: `${idx}-${i}-${Math.random()}`,
      val: w
    }));

    setAvailableWords([...wordsObjects].sort(() => 0.5 - Math.random()));
    setUserWords([]);
    setShowAnswer(false);
  }, []);

  // 4. 加载选定内容（可能是子单元或直接单元）
  const handleLoadContent = (contentData, forceReload = false) => {
    if (!contentData?.path) {
      alert("该内容暂无练习文件");
      return;
    }
    
    setView('loading');
    const cacheBuster = forceReload ? `?t=${new Date().getTime()}` : '';
    
    fetch(`/SentenceSpell/${contentData.path}${cacheBuster}`)
      .then(res => {
        if (!res.ok) throw new Error('练习文件不存在');
        return res.json();
      })
      .then(data => {
        setQuestions(data);
        setCurrentIndex(0);
        setScore(100);
        setShowAnswer(false);
        initSentence(0, data);
        startTimeRef.current = new Date();
        setView('quiz');
      })
      .catch(err => {
        alert("加载失败: " + err.message);
        // 根据当前状态返回到相应页面
        if (currentSubUnit) {
          setView('subunits');
        } else {
          setView('units');
        }
      });
  };

  // 5. 单词点击核验逻辑
  const handleWordClick = (wordObj) => {
    const targetWords = questions[currentIndex].english.split(' ').filter(w => w.trim().length > 0);

    if (wordObj.val === targetWords[userWords.length]) {
      const newWords = [...userWords, wordObj.val];
      setUserWords(newWords);
      setAvailableWords(prev => prev.filter(w => w.uid !== wordObj.uid));

      if (newWords.length === targetWords.length) {
        setTimeout(() => {
          if (currentIndex < questions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            initSentence(nextIdx, questions);
          } else {
            setView('result');
          }
        }, 800);
      }
    } else {
      const totalWords = questions.reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0);
      const deductionPerWord = 100 / totalWords;
      const newScore = Math.max(0, score - deductionPerWord);
      setScore(Math.round(newScore * 100) / 100);
      setHasFailed(true);
      setTimeout(() => setHasFailed(false), 300);
    }
  };

  // 6. 查看答案的扣分逻辑
  const handleShowAnswer = () => {
    if (!showAnswer) {
      const totalWords = questions.reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0);
      const deductionPerWord = 100 / totalWords;
      const targetWords = questions[currentIndex].english.split(' ').filter(w => w.trim().length > 0);
      const remainingWords = targetWords.length - userWords.length;
      const totalDeduction = deductionPerWord * remainingWords;
      const newScore = Math.max(0, score - totalDeduction);
      setScore(Math.round(newScore * 100) / 100);
      setShowAnswer(true);
    }
  };

  const formatTime = (date) => date.toLocaleTimeString('zh-CN', { hour12: false });

  // ==================== 导航组件 ====================
  const NavigationBreadcrumbs = ({ currentPage }) => {
    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          color="inherit"
          onClick={() => {
            setView('grades');
            setCurrentGrade(null);
            setCurrentUnit(null);
            setCurrentSubUnit(null);
          }}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="small" />
          年级
        </Link>
        
        {currentGrade && playlistData[currentGrade] && (
          <Link
            color="inherit"
            onClick={() => {
              setView('units');
              setCurrentUnit(null);
              setCurrentSubUnit(null);
            }}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <School sx={{ mr: 0.5 }} fontSize="small" />
            {playlistData[currentGrade].name}
          </Link>
        )}
        
        {currentUnit && playlistData[currentGrade]?.units?.[currentUnit] && (
          <Link
            color="inherit"
            onClick={() => {
              const unitData = playlistData[currentGrade].units[currentUnit];
              if (unitData.hasSubUnits) {
                setView('subunits');
              } else {
                setView('units');
              }
              setCurrentSubUnit(null);
            }}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <Folder sx={{ mr: 0.5 }} fontSize="small" />
            {playlistData[currentGrade].units[currentUnit].name}
          </Link>
        )}
        
        {currentSubUnit && playlistData[currentGrade]?.units?.[currentUnit]?.subUnits?.[currentSubUnit] && (
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <Description sx={{ mr: 0.5 }} fontSize="small" />
            {playlistData[currentGrade].units[currentUnit].subUnits[currentSubUnit].name}
          </Typography>
        )}
      </Breadcrumbs>
    );
  };

  // ==================== 年级选择页面 ====================
  if (view === 'grades') {
    // 检查是否有错误
    if (playlistData.error) {
      return (
        <Container maxWidth="md" sx={{ mt: 10, textAlign: 'center' }}>
          <Typography variant="h4" align="center" fontWeight="900" sx={{ color: '#d32f2f', mb: 3 }}>
            ⚠️ 数据加载失败
          </Typography>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, bgcolor: '#ffebee' }}>
            <Typography variant="h6" color="#b71c1c" sx={{ mb: 2 }}>
              无法加载翻译练习数据
            </Typography>
            <Typography variant="body1" color="#c62828" sx={{ mb: 3 }}>
              错误信息: {playlistData.message}
            </Typography>
            <Typography variant="body2" color="#795548" sx={{ mb: 3 }}>
              请检查以下内容：
            </Typography>
            <Box sx={{ textAlign: 'left', mb: 3, pl: 2 }}>
              <Typography variant="body2" color="#5d4037">
                1. 确保存在文件: <strong>/public/SentenceSpell/content.json</strong>
              </Typography>
              <Typography variant="body2" color="#5d4037">
                2. 检查文件格式是否正确（有效的 JSON）
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()} 
              sx={{ mr: 2 }}
            >
              重新加载
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate("/")}
            >
              返回主目录
            </Button>
          </Paper>
        </Container>
      );
    }

    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Typography variant="h4" align="center" fontWeight="900" sx={{ color: '#1a237e', mb: 1 }}>
          📝 翻译拼写挑战
        </Typography>
        <Button onClick={() => navigate("/")} sx={{ mb: 3 }}>
          返回主目录
        </Button>

        <Paper elevation={0} sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 2, mb: 4 }}>
          <Typography variant="body2" align="center" color="textSecondary">{formatTime(currentTime)}</Typography>
        </Paper>

        <Typography variant="h5" sx={{ mb: 3, color: '#424242', textAlign: 'center', fontWeight: 600 }}>
          请选择年级
        </Typography>

        {grades.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <CircularProgress size={60} sx={{ mb: 3, color: '#1a237e' }} />
            <Typography variant="h6" sx={{ color: '#666' }}>
              正在加载年级数据...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {grades.map((grade) => (
              <Grid item xs={12} sm={6} md={4} key={grade.id}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '2px solid #e0e0e0',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: grade.id === 'special' ? '#ff9800' : '#3f51b5',
                      boxShadow: grade.id === 'special' 
                        ? '0 12px 20px rgba(255, 152, 0, 0.2)' 
                        : '0 12px 20px rgba(63, 81, 181, 0.2)'
                    }
                  }}
                  onClick={() => {
                    setCurrentGrade(grade.id);
                    setView('units');
                  }}
                >
                  <CardActionArea sx={{ height: '100%', p: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: grade.id === 'special' ? '#ff9800' : '#3f51b5',
                          margin: '0 auto 16px',
                          fontSize: '2rem'
                        }}
                      >
                        {grade.icon}
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" color="#1a237e" gutterBottom>
                        {grade.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {grade.unitCount} 个单元
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Badge 
                          badgeContent={grade.unitCount} 
                          color={grade.id === 'special' ? "warning" : "primary"} 
                        />
                      </Box>
                      {grade.id === 'special' && (
                        <Typography variant="caption" sx={{ 
                          mt: 1, 
                          display: 'block', 
                          color: '#ff9800',
                          fontWeight: 'bold'
                        }}>
                          课后练习
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
          选择年级开始翻译练习
        </Typography>
      </Container>
    );
  }

  // ==================== 单元选择页面 ====================
  if (view === 'units' && currentGrade) {
    const gradeData = playlistData[currentGrade];
    if (!gradeData) return null;

    const units = gradeData.units || {};
    const unitKeys = Object.keys(units);

    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <IconButton onClick={() => setView('grades')} sx={{ color: 'primary.main' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="900" sx={{ color: '#1a237e' }}>
              {gradeData.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              请选择练习单元
            </Typography>
          </Box>
        </Box>

        <NavigationBreadcrumbs currentPage="units" />

        <Paper elevation={0} sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 2, mb: 4 }}>
          <Typography variant="body2" align="center" color="textSecondary">{formatTime(currentTime)}</Typography>
        </Paper>

        {unitKeys.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
              暂无单元内容
            </Typography>
            <Typography variant="body2" color="textSecondary">
              该年级下还没有添加翻译练习
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {unitKeys.map((unitKey, index) => {
              const unitData = units[unitKey];
              const hasSubUnits = unitData.hasSubUnits || false;
              const subunitCount = hasSubUnits ? Object.keys(unitData.subUnits || {}).length : 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={unitKey}>
                  <Card
                    elevation={2}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: currentGrade === 'special' ? '#ff9800' : '#2196f3',
                        boxShadow: currentGrade === 'special'
                          ? '0 8px 16px rgba(255, 152, 0, 0.15)'
                          : '0 8px 16px rgba(33, 150, 243, 0.15)'
                      }
                    }}
                    onClick={() => {
                      setCurrentUnit(unitKey);
                      if (hasSubUnits) {
                        setView('subunits');
                      } else {
                        // 直接加载该单元的练习
                        handleLoadContent(unitData);
                      }
                    }}
                  >
                    <CardActionArea sx={{ p: 2 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          width: 56,
                          height: 56,
                          bgcolor: currentGrade === 'special' ? '#fff3e0' : '#e3f2fd',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          color: currentGrade === 'special' ? '#ff9800' : '#2196f3'
                        }}>
                          <MenuBook />
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="#1565c0" gutterBottom>
                          {unitData.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {hasSubUnits ? `${subunitCount} 个子单元` : '直接练习'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                          {hasSubUnits ? (
                            <Chip 
                              label="多个练习" 
                              size="small" 
                              color="info" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ) : (
                            <Chip 
                              label="单一练习" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => setView('grades')}
          sx={{ width: '100%', py: 1.5, borderRadius: 2 }}
        >
          返回年级选择
        </Button>
      </Container>
    );
  }

  // ==================== 子单元选择页面 ====================
  if (view === 'subunits' && currentGrade && currentUnit) {
    const gradeData = playlistData[currentGrade];
    const unitData = gradeData?.units?.[currentUnit];
    
    if (!unitData || !unitData.hasSubUnits) {
      setView('units');
      return null;
    }

    const subUnits = unitData.subUnits || {};
    const subUnitKeys = Object.keys(subUnits);

    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <IconButton onClick={() => setView('units')} sx={{ color: 'primary.main' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="900" sx={{ color: '#1a237e' }}>
              {unitData.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              请选择具体练习内容
            </Typography>
          </Box>
        </Box>

        <NavigationBreadcrumbs currentPage="subunits" />

        <Paper elevation={0} sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 2, mb: 4 }}>
          <Typography variant="body2" align="center" color="textSecondary">{formatTime(currentTime)}</Typography>
        </Paper>

        {subUnitKeys.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
              暂无子单元内容
            </Typography>
            <Typography variant="body2" color="textSecondary">
              该单元下还没有添加具体练习
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setView('units')}
              sx={{ mt: 2 }}
            >
              返回单元选择
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {subUnitKeys.map((subUnitKey, index) => {
                const subUnitData = subUnits[subUnitKey];

                return (
                  <Grid item xs={12} sm={6} md={4} key={subUnitKey}>
                    <Card
                      elevation={2}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: '#4caf50',
                          boxShadow: '0 8px 16px rgba(76, 175, 80, 0.15)'
                        }
                      }}
                      onClick={() => {
                        setCurrentSubUnit(subUnitKey);
                        handleLoadContent(subUnitData);
                      }}
                    >
                      <CardActionArea sx={{ p: 2 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 56,
                            height: 56,
                            bgcolor: '#e8f5e9',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            color: '#4caf50'
                          }}>
                            {getSubUnitIcon(index)}
                          </Box>
                          <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32" gutterBottom>
                            {subUnitData.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            练习 {index + 1}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label="开始练习" 
                              size="small" 
                              color="success" 
                              variant="filled"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => setView('units')}
              sx={{ width: '100%', py: 1.5, borderRadius: 2 }}
            >
              返回单元选择
            </Button>
          </>
        )}
      </Container>
    );
  }

  // --- 视图渲染：加载中 ---
  if (view === 'loading') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 20 }}>
        <CircularProgress size={isMobile ? 40 : 60} thickness={4} sx={{ color: '#1a237e' }} />
        <Typography sx={{ mt: 2, fontWeight: 'bold', fontSize: isMobile ? '1rem' : '1.25rem' }}>
          正在加载翻译练习...
        </Typography>
      </Box>
    );
  }

  // ==================== 结算页面 ====================
  if (view === 'result') {
    const endTime = new Date();

    // 计算用时（固定值，不再变化）
    const timeSpent = startTimeRef.current ? Math.round((endTime - startTimeRef.current) / 1000) : 0;

    // 格式化时间（固定值）
    const formatTimeDisplay = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`;
    };

    // 固定显示时间（不实时更新）
    const displayTime = formatTimeDisplay(timeSpent);
    const completionTime = endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const completionDate = endTime.toLocaleDateString();

    // 计算总单词数和每个单词的价值
    const totalWords = questions.reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0);
    const deductionPerWord = 100 / totalWords;

    // 计算正确率（基于扣分情况）
    const totalPossiblePoints = 100;
    const actualPoints = score;
    const accuracy = Math.round((actualPoints / totalPossiblePoints) * 100);

    // 计算错误数量和答对数量
    const totalErrors = Math.round((100 - score) / deductionPerWord);
    const correctAnswers = Math.max(0, totalWords - totalErrors);
    const totalQuestions = questions.length;

    // 获取成绩评级
    const getGrade = (percent) => {
      if (percent >= 90) return { text: '优秀', color: '#4caf50', emoji: '🏆' };
      if (percent >= 80) return { text: '良好', color: '#2196f3', emoji: '🎯' };
      if (percent >= 60) return { text: '及格', color: '#ff9800', emoji: '✅' };
      return { text: '加油', color: '#f44336', emoji: '💪' };
    };

    const grade = getGrade(accuracy);

    // 获取当前内容信息
    let currentContentName = "未知内容";
    let gradeName = "未知年级";
    let unitName = "未知单元";
    
    const gradeData = playlistData[currentGrade];
    if (gradeData) {
      gradeName = gradeData.name;
      const unitData = gradeData.units?.[currentUnit];
      if (unitData) {
        unitName = unitData.name;
        if (currentSubUnit) {
          const subUnitData = unitData.subUnits?.[currentSubUnit];
          if (subUnitData) {
            currentContentName = subUnitData.name;
          }
        } else {
          currentContentName = unitData.name;
        }
      }
    }

    // 重新挑战函数
    const handleRestart = () => {
      if (currentSubUnit) {
        // 重新加载当前子单元
        const gradeData = playlistData[currentGrade];
        const unitData = gradeData?.units?.[currentUnit];
        const subUnitData = unitData?.subUnits?.[currentSubUnit];
        if (subUnitData) {
          handleLoadContent(subUnitData, true);
        }
      } else if (currentUnit) {
        // 重新加载当前单元（如果没有子单元）
        const gradeData = playlistData[currentGrade];
        const unitData = gradeData?.units?.[currentUnit];
        if (unitData && !unitData.hasSubUnits) {
          handleLoadContent(unitData, true);
        }
      }
    };

    return (
      <Container maxWidth="sm" sx={{
        mt: isMobile ? 1 : 5,
        py: 2,
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* 返回按钮 */}
        <IconButton
          onClick={() => {
            if (currentSubUnit) {
              setView('subunits');
            } else {
              setView('units');
            }
          }}
          sx={{ mb: 1, color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>

        <NavigationBreadcrumbs currentPage="result" />

        <Paper
          elevation={8}
          sx={{
            p: isMobile ? 2 : 3,
            borderRadius: 4,
            border: `4px solid ${grade.color}`,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          {/* 顶部标题 */}
          <Typography variant={isMobile ? "h5" : "h4"} sx={{
            fontWeight: '900',
            textAlign: 'center',
            color: '#1a237e',
            mb: 1,
            position: 'relative'
          }}>
            🎯4_翻译测试完成
          </Typography>
          <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{
            textAlign: 'center',
            color: 'text.secondary',
            mb: 3,
            fontWeight: 600,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}>
            {currentContentName} · {totalQuestions} 个句子 · {totalWords} 个单词
          </Typography>

          {/* 核心成绩区域 - 集中展示 */}
          <Box sx={{
            textAlign: 'center',
            mb: 3,
            position: 'relative',
            backgroundColor: '#f8f9fa',
            borderRadius: 3,
            p: 2,
            border: '2px solid #e0e0e0'
          }}>
            {/* 分数和评级 */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? 1 : 2,
              mb: 2,
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <Box sx={{
                width: isMobile ? 80 : 100,
                height: isMobile ? 80 : 100,
                borderRadius: '50%',
                backgroundColor: `${grade.color}15`,
                border: `4px solid ${grade.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                mb: isMobile ? 1 : 0
              }}>
                <Typography variant={isMobile ? "h3" : "h2"} sx={{
                  fontWeight: '900',
                  color: grade.color,
                  lineHeight: 1,
                  fontSize: isMobile ? '2.5rem' : '3rem'
                }}>
                  {accuracy}
                </Typography>
                <Typography variant="caption" sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}>
                  分
                </Typography>
              </Box>

              <Box sx={{ textAlign: isMobile ? 'center' : 'left', ml: isMobile ? 0 : 2 }}>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{
                  fontWeight: '900',
                  color: grade.color,
                  fontSize: isMobile ? '1.25rem' : '1.5rem'
                }}>
                  {grade.emoji} {grade.text}
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} sx={{
                  color: 'text.secondary',
                  mt: 0.5,
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}>
                  最终得分: {score.toFixed(1)}
                </Typography>
              </Box>
            </Box>

            {/* 核心数据网格 - 高度集中 */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {[
                { value: correctAnswers, label: '答对', color: '#4caf50', bgColor: '#e8f5e9' },
                { value: displayTime, label: '用时', color: '#ff9800', bgColor: '#fff3e0' },
                { value: totalErrors, label: '答错', color: '#f44336', bgColor: '#ffebee' },
                { value: totalWords, label: '总单词', color: '#2196f3', bgColor: '#e3f2fd' }
              ].map((item, index) => (
                <Grid item xs={6} key={index}>
                  <Paper sx={{
                    p: isMobile ? 0.75 : 1,
                    borderRadius: 2,
                    textAlign: 'center',
                    backgroundColor: item.bgColor,
                    border: `2px solid ${item.color}`
                  }}>
                    <Typography variant={isMobile ? "body1" : "h6"} sx={{
                      fontWeight: 'bold',
                      color: item.color,
                      fontSize: isMobile ? '1rem' : '1.25rem'
                    }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: item.color,
                      fontWeight: 600,
                      fontSize: isMobile ? '0.7rem' : '0.75rem'
                    }}>
                      {item.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* 详细信息表格 - 紧凑布局 */}
            <Paper sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.1)'
            }}>
              <Grid container spacing={0.5}>
                {[
                  { label: '测试类型:', value: '翻译拼写', xs: 6 },
                  { label: '年级:', value: gradeName, xs: 6 },
                  { label: '单元:', value: unitName, xs: 6 },
                  { label: '练习:', value: currentContentName, xs: 6 },
                  { label: '正确率:', value: `${accuracy}%`, xs: 6, color: grade.color },
                  { label: '平均用时:', value: `${(timeSpent / totalQuestions).toFixed(1)}秒/句`, xs: 6 },
                  { label: '完成时间:', value: completionTime, xs: 6 },
                  { label: '扣分次数:', value: `${totalErrors}次`, xs: 6, color: '#f44336' },
                  { label: '单词正确率:', value: `${Math.round((correctAnswers / totalWords) * 100)}%`, xs: 6, color: '#4caf50' },
                  { label: '每个单词价值:', value: `${deductionPerWord.toFixed(2)}分`, xs: 6 }
                ].map((item, index) => (
                  <Grid item xs={item.xs} key={index}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 0.5,
                      flexWrap: 'wrap'
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" fontWeight="bold"
                        sx={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: item.color || 'inherit',
                          textAlign: 'right'
                        }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>

          {/* 成绩评价 */}
          <Alert
            severity={
              accuracy >= 90 ? "success" :
                accuracy >= 80 ? "info" :
                  accuracy >= 60 ? "warning" : "error"
            }
            sx={{
              mb: 2,
              fontWeight: 'bold',
              borderRadius: 2,
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}
            icon={false}
          >
            {accuracy >= 90 ? '🎉 太棒了！你的翻译能力非常出色！' :
              accuracy >= 80 ? '👍 表现不错！继续努力可以更上一层楼！' :
                accuracy >= 60 ? '✅ 基础掌握良好，建议多练习！' :
                  '💪 需要加强练习，建议重新学习！'}
          </Alert>

          {/* 操作按钮 - 紧凑排列 */}
          <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ mb: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              startIcon={<ArrowBack />}
              onClick={() => {
                if (currentSubUnit) {
                  setView('subunits');
                } else {
                  setView('units');
                }
              }}
              sx={{
                borderRadius: 2,
                py: isMobile ? 0.75 : 1,
                fontWeight: 'bold',
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}
            >
              返回{currentSubUnit ? '子单元' : '单元'}
            </Button>

            <Button
              fullWidth
              variant="contained"
              size={isMobile ? "small" : "medium"}
              color="primary"
              startIcon={<Assignment />}
              onClick={handleRestart}
              sx={{
                borderRadius: 2,
                py: isMobile ? 0.75 : 1,
                fontWeight: 'bold',
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}
            >
              重新挑战
            </Button>
          </Stack>

          {/* 底部信息 - 非常紧凑 */}
          <Typography variant="caption" sx={{
            display: 'block',
            textAlign: 'center',
            mt: 2,
            color: 'text.secondary',
            fontStyle: 'italic',
            fontSize: isMobile ? '0.65rem' : '0.7rem'
          }}>
            Translation Master · 完成时间: {completionDate} {completionTime}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // ==================== 练习核心页 ====================
  // 计算统计信息
  const totalWords = questions.reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0);
  const deductionPerWord = 100 / totalWords;
  const currentSentenceWords = questions[currentIndex]?.english.split(' ').filter(w => w.trim().length > 0).length || 0;
  const remainingWords = currentSentenceWords - userWords.length;
  const hintDeduction = remainingWords * deductionPerWord;

  // 计算已答对单词数
  const totalAnsweredCorrectly = questions.slice(0, currentIndex).reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0) + userWords.length;

  // 计算错误次数
  const totalErrors = Math.round((100 - score) / deductionPerWord);

  // 获取当前内容信息
  let currentContentName = "未知内容";
  let gradeName = "未知年级";
  let unitName = "未知单元";
  
  const gradeData = playlistData[currentGrade];
  if (gradeData) {
    gradeName = gradeData.name;
    const unitData = gradeData.units?.[currentUnit];
    if (unitData) {
      unitName = unitData.name;
      if (currentSubUnit) {
        const subUnitData = unitData.subUnits?.[currentSubUnit];
        if (subUnitData) {
          currentContentName = subUnitData.name;
        }
      } else {
        currentContentName = unitData.name;
      }
    }
  }

  return (
    <Container maxWidth="md" sx={{
      p: isMobile ? 1 : 2,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // 禁止整体滚动
    }}>
      {/* 紧凑的头部信息栏 */}
      <Paper variant="outlined" sx={{
        mb: isMobile ? 0.5 : 1,
        p: isMobile ? 1 : 1.5,
        borderRadius: 2,
        border: '2px solid #1a237e',
        bgcolor: '#fafafa',
        flexShrink: 0
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'nowrap' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" fontWeight="bold" color="#666" sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
              <AccessTime sx={{ fontSize: isMobile ? 10 : 11, verticalAlign: 'middle', mr: 0.5 }} />
              {formatTime(currentTime)}
            </Typography>
            <Typography variant={isMobile ? "body2" : "subtitle1"} fontWeight="900" color="#1a237e" sx={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {gradeName} · {unitName} {currentSubUnit ? `· ${currentContentName}` : ''}
            </Typography>
          </Box>

          {/* 分数和查看答案按钮组合 */}
          <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1}>
            {/* 查看答案按钮 - 更紧凑 */}
            <Chip
              icon={<Translate fontSize="small" />}
              label={showAnswer ? "已提示" : `提示-${hintDeduction.toFixed(1)}分`}
              onClick={handleShowAnswer}
              disabled={showAnswer}
              color="warning"
              variant={showAnswer ? "outlined" : "filled"}
              size="small"
              sx={{
                fontWeight: 'bold',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                cursor: showAnswer ? 'default' : 'pointer',
                height: isMobile ? 28 : 32,
                '& .MuiChip-label': { px: 1 }
              }}
            />

            <Box sx={{
              textAlign: 'center',
              px: isMobile ? 1 : 1.5,
              py: isMobile ? 0.1 : 0.2,
              bgcolor: '#1a237e',
              borderRadius: 1.5,
              minWidth: isMobile ? 55 : 65,
              flexShrink: 0
            }}>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="900" color="#fff" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                {score.toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#cfd8dc', display: 'block', fontSize: isMobile ? '0.55rem' : '0.6rem' }}>
                SCORE
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* 紧凑的统计信息 */}
      <Box sx={{ mb: isMobile ? 0.5 : 1, flexShrink: 0 }}>
        <Grid container spacing={0.5}>
          <Grid item xs={3}>
            <Paper sx={{
              p: isMobile ? 0.5 : 0.75,
              textAlign: 'center',
              borderRadius: 1.5,
              backgroundColor: '#e8f5e9',
              border: '1px solid #4caf50',
              height: isMobile ? 45 : 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{
                color: '#2e7d32',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                mb: 0.25
              }}>
                已答对
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} sx={{
                color: '#2e7d32',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {totalAnsweredCorrectly}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: isMobile ? 0.5 : 0.75,
              textAlign: 'center',
              borderRadius: 1.5,
              backgroundColor: '#ffebee',
              border: '1px solid #f44336',
              height: isMobile ? 45 : 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{
                color: '#c62828',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                mb: 0.25
              }}>
                错误数
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} sx={{
                color: '#c62828',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {totalErrors}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: isMobile ? 0.5 : 0.75,
              textAlign: 'center',
              borderRadius: 1.5,
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              height: isMobile ? 45 : 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{
                color: '#1565c0',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                mb: 0.25
              }}>
                总单词
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} sx={{
                color: '#1565c0',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {totalWords}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: isMobile ? 0.5 : 0.75,
              textAlign: 'center',
              borderRadius: 1.5,
              backgroundColor: '#fff3e0',
              border: '1px solid #ff9800',
              height: isMobile ? 45 : 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{
                color: '#ef6c00',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                mb: 0.25
              }}>
                错一个扣
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} sx={{
                color: '#ef6c00',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {deductionPerWord.toFixed(2)}分
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* 进度控制 - 更紧凑 */}
      <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1} sx={{ mb: isMobile ? 0.5 : 1, flexShrink: 0 }}>
        <Button
          variant="contained"
          onClick={() => {
            if (currentSubUnit) {
              setView('subunits');
            } else {
              setView('units');
            }
          }}
          startIcon={<ArrowBack />}
          size="small"
          sx={{
            bgcolor: '#424242',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            px: isMobile ? 0.75 : 1,
            py: isMobile ? 0.25 : 0.5,
            minWidth: 'auto'
          }}
        >
          返回
        </Button>

        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(currentIndex / questions.length) * 100}
            sx={{
              height: isMobile ? 6 : 8,
              borderRadius: 4,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': { bgcolor: '#00bcd4' }
            }}
          />
        </Box>

        <Typography variant="caption" fontWeight="900" color="#424242" sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem', minWidth: '40px', textAlign: 'right' }}>
          {currentIndex + 1} / {questions.length}
        </Typography>
      </Stack>

      {/* 当前句子信息 - 更紧凑 */}
      <Box sx={{
        mb: isMobile ? 0.5 : 1,
        p: isMobile ? 0.75 : 1,
        bgcolor: '#f5f5f5',
        borderRadius: 1.5,
        border: '1px solid #bdbdbd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        fontWeight: 'bold',
        color: '#616161',
        flexShrink: 0
      }}>
        <span>📝 第 {currentIndex + 1} 句: {currentSentenceWords} 单词</span>
        <span>🎯 已答: {userWords.length}/{currentSentenceWords}</span>
      </Box>

      {/* 核心答题区域 - 占据大部分空间，无滚动 */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // 重要：允许内部滚动
        overflow: 'hidden'
      }}>
        <Paper elevation={4} sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          border: hasFailed ? '4px solid #d32f2f' : '4px solid #e0e0e0',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden', // 禁止卡片自身滚动
          borderRadius: 3,
          p: isMobile ? 1.5 : 2
        }}>
          {/* 中文展示区 - 更紧凑 */}
          <Box sx={{
            mb: isMobile ? 1.5 : 2,
            p: isMobile ? 1.5 : 2,
            bgcolor: '#e8eaf6',
            borderRadius: 2,
            border: '1px solid #c5cae9',
            flexShrink: 0
          }}>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="#1a237e" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              {questions[currentIndex]?.chinese}
            </Typography>
          </Box>

          {/* 英文待填区 - 更大更突出 */}
          <Box sx={{
            mb: isMobile ? 2 : 3,
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? 0.75 : 1,
            px: isMobile ? 0.5 : 1,
            minHeight: '100px'
          }}>
            {questions[currentIndex]?.english.split(' ').map((w, i) => (
              <Box key={i} sx={{
                borderBottom: '3px solid #cfd8dc',
                minWidth: isMobile ? 50 : 60,
                px: isMobile ? 0.75 : 1,
                py: isMobile ? 1 : 1.25,
                fontSize: isMobile ? '1.4rem' : '1.6rem',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                color: (i < userWords.length || showAnswer) ? (showAnswer && i >= userWords.length ? '#d32f2f' : '#1a237e') : 'transparent',
                backgroundColor: (i < userWords.length || showAnswer) ? '#f5f5f5' : 'transparent',
                borderRadius: 1,
                boxShadow: (i < userWords.length || showAnswer) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}>
                {w}
              </Box>
            ))}
          </Box>

          {/* 乱序单词池 - 可滚动区域 */}
          <Box sx={{
            flex: 2,
            minHeight: '150px',
            overflowY: 'auto',
            px: isMobile ? 0.5 : 1,
            py: isMobile ? 1 : 1.5
          }}>
            <Grid container spacing={isMobile ? 1 : 1.5} justifyContent="center" sx={{ mt: 0.5 }}>
              {availableWords.map((word) => (
                <Grid item key={word.uid} xs={isMobile ? 6 : 'auto'}>
                  <Zoom in={true}>
                    <Button
                      variant="outlined"
                      size={isMobile ? "medium" : "large"}
                      onClick={() => handleWordClick(word)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        borderWidth: 2,
                        fontWeight: 'bold',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        color: '#424242',
                        padding: isMobile ? '10px 6px' : '12px 10px',
                        borderColor: '#cfd8dc',
                        minWidth: isMobile ? 100 : 120,
                        minHeight: isMobile ? 40 : 48,
                        width: isMobile ? '100%' : 'auto',
                        '&:hover': {
                          borderWidth: 2,
                          borderColor: '#1a237e',
                          bgcolor: '#f5f5f5',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {word.val}
                    </Button>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TranslationPractice;