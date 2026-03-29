import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Slider,
    IconButton,
    Card,
    CardContent,
    Chip,
    Alert,
    Stack,
    LinearProgress,
    Fade,
    Zoom,
    CircularProgress,
    Grid,
    Divider,
    Avatar,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    SwipeableDrawer,
    Badge
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    Replay,
    VolumeUp,
    VolumeOff,
    VolumeDown,
    NavigateNext,
    CheckCircle,
    Visibility,
    VisibilityOff,
    Hearing,
    Loop,
    Refresh,
    ArrowBack,
    LibraryBooks,
    School,
    Numbers,
    Folder,
    AudioFile,
    Subtitles,
    MenuBook,
    Class,
    Home,
    Menu as MenuIcon,
    Settings,
    History,
    Star,
    Bookmark,
    Headphones,
    PlaylistPlay,
    Close,
    FolderOpen
} from '@mui/icons-material';

const ListeningPractice = () => {
    // Refs
    const audioRef = useRef(null);

    // 基础路径 - 所有文件都在 teacher 文件夹中
    const BASE_PATH = '/teacher';

    // 状态管理
    const [audioSrc, setAudioSrc] = useState('');
    const [currentFile, setCurrentFile] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [currentSubtitle, setCurrentSubtitle] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [autoLoopEnabled, setAutoLoopEnabled] = useState(true);

    // 版本管理状态
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [currentGrade, setCurrentGrade] = useState(null);
    const [currentUnit, setCurrentUnit] = useState(null);
    const [filesList, setFilesList] = useState([]);
    const [showFileList, setShowFileList] = useState(true);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [progressData, setProgressData] = useState({});
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // 筛选和排序
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [sortBy, setSortBy] = useState('unit');
    const [recentFiles, setRecentFiles] = useState([]);

    // 初始化
    useEffect(() => {
        loadProgress();
        loadVersions();
        loadRecentFiles();
    }, []);

    // 保存进度到localStorage
    useEffect(() => {
        if (Object.keys(progressData).length > 0) {
            localStorage.setItem('listeningPracticeProgress', JSON.stringify(progressData));
        }
    }, [progressData]);

    // 加载进度
    const loadProgress = () => {
        const savedProgress = localStorage.getItem('listeningPracticeProgress');
        if (savedProgress) {
            try {
                setProgressData(JSON.parse(savedProgress));
            } catch (e) {
                console.error('加载进度数据失败:', e);
            }
        }
    };

    // 加载最近文件
    const loadRecentFiles = () => {
        const saved = localStorage.getItem('recentListeningFiles');
        if (saved) {
            try {
                setRecentFiles(JSON.parse(saved));
            } catch (e) {
                console.error('加载最近文件失败:', e);
            }
        }
    };

    // 保存最近文件
    const saveRecentFile = (file) => {
        const updated = [file, ...recentFiles.filter(f => f.id !== file.id)].slice(0, 10);
        setRecentFiles(updated);
        localStorage.setItem('recentListeningFiles', JSON.stringify(updated));
    };

    // 加载版本列表
    const loadVersions = async () => {
        try {
            const response = await fetch(`${BASE_PATH}/versions.json`);
            if (response.ok) {
                const data = await response.json();
                setVersions(data.versions || []);
            } else {
                console.error('无法加载versions.json');
                // 使用默认配置
                setVersions([{
                    id: 'pep',
                    name: '人教版',
                    description: '人民教育出版社 英语教材',
                    icon: '🇨🇳',
                    grades: [
                        {
                            id: 'grade3',
                            name: '三年级',
                            units: [
                                { id: 'unit1', name: '第一单元', description: 'Hello!' },
                                { id: 'unit2', name: '第二单元', description: 'Colors' }
                            ]
                        },
                        {
                            id: 'grade4',
                            name: '四年级',
                            units: [
                                { id: 'unit1', name: '第一单元', description: 'My Classroom' }
                            ]
                        }
                    ]
                }]);
            }
        } catch (error) {
            console.error('加载版本列表失败:', error);
        }
    };

    // 加载单元文件列表 - 支持目录结构
    const loadFilesForUnit = async (versionId, gradeId, unitId) => {
        try {
            setLoadingFiles(true);
            console.log('加载单元文件:', versionId, gradeId, unitId);
            
            // 构建配置文件路径：/teacher/config/版本/年级/单元.json
            const configPath = `${BASE_PATH}/config/${versionId}/${gradeId}/${unitId}.json`;
            console.log('配置文件路径:', configPath);
            
            const response = await fetch(configPath);
            
            if (!response.ok) {
                console.error('无法加载文件列表:', configPath);
                setFilesList([]);
                setLoadingFiles(false);
                return;
            }

            const data = await response.json();

            const files = data.files.map(file => ({
                ...file,
                displayName: `${file.unit}.${file.lesson} ${file.title || ''}`,
                description: `第${file.unit}单元 第${file.lesson}课`,
                duration: file.duration || '约1-2分钟',
                hasAudio: true,
                hasSubtitle: true,
                progress: progressData[file.id] || 0,
                // 音频文件路径：/teacher/audio/版本/年级/单元/文件名.mp3
                audioPath: `${BASE_PATH}/audio/${versionId}/${gradeId}/${unitId}/${file.filename}`,
                // 字幕文件路径：/teacher/audio/版本/年级/单元/文件名.srt
                srtPath: `${BASE_PATH}/audio/${versionId}/${gradeId}/${unitId}/${file.srtFile || file.filename.replace('.mp3', '.srt')}`,
                versionId,
                gradeId,
                unitId
            }));

            setFilesList(files);
            console.log('设置的文件为', files)
            setLoadingFiles(false);

        } catch (error) {
            console.error('加载文件列表失败:', error);
            setFilesList([]);
            setLoadingFiles(false);
        }
    };

    // 选择版本
    const handleVersionSelect = (version) => {
        setCurrentVersion(version);
        setCurrentGrade(null);
        setCurrentUnit(null);
        setFilesList([]);
        setShowFileList(true);
    };

    // 选择年级
    const handleGradeSelect = (grade) => {
        setCurrentGrade(grade);
        setCurrentUnit(null);
        setFilesList([]);
    };

    // 选择单元
    const handleUnitSelect = (unit) => {
        setCurrentUnit(unit);
        loadFilesForUnit(currentVersion.id, currentGrade.id, unit.id);
    };

    // 返回上一级
    const handleBack = () => {
        if (currentUnit) {
            setCurrentUnit(null);
            setFilesList([]);
        } else if (currentGrade) {
            setCurrentGrade(null);
        } else if (currentVersion) {
            setCurrentVersion(null);
        }
    };

    // 选择文件
    const handleFileSelect = async (file) => {
        try {
            setIsLoading(true);
            setCurrentFile(file);
            setShowFileList(false);
            setHasError(false);
            saveRecentFile(file);

            console.log('加载音频文件:',file, file.audioPath);
            setAudioSrc(file.audioPath);

            await new Promise((resolve, reject) => {
                if (audioRef.current) {
                    audioRef.current.src = file.audioPath;
                    audioRef.current.load();

                    audioRef.current.onloadedmetadata = () => {
                        console.log('音频加载成功');
                        resolve();
                    };

                    audioRef.current.onerror = (err) => {
                        console.error('音频加载失败:', err);
                        reject(new Error(`音频加载失败`));
                    };
                } else {
                    resolve();
                }
            });

            await loadSrtFile(file);
            setIsLoading(false);
        } catch (error) {
            console.error('加载文件失败:', error);
            setHasError(true);
            setIsLoading(false);
        }
    };

    // 加载SRT文件
    const loadSrtFile = async (file) => {
        try {
            let parsedSubtitles = [];
            let srtContent = '';

            console.log('加载字幕文件:', file.srtPath);
            try {
                const response = await fetch(file.srtPath);
                if (response.ok) {
                    srtContent = await response.text();
                    console.log('字幕加载成功');
                }
            } catch (err) {
                console.log('SRT文件不可用，使用默认内容');
            }

            if (srtContent) {
                parsedSubtitles = parseSrt(srtContent);
            } else {
                const defaultContent = generateDefaultSrt(file);
                parsedSubtitles = parseSrt(defaultContent);
            }

            setSubtitles(parsedSubtitles);

            if (parsedSubtitles.length > 0) {
                setCurrentSubtitle(parsedSubtitles[0]);
            } else {
                const defaultSubtitle = {
                    id: 1,
                    text: '这是一个听力练习，请仔细听音频内容。',
                    startTime: 0,
                    endTime: duration || 30,
                    userAnswered: false,
                    isCorrect: false,
                    attempts: 0
                };
                setSubtitles([defaultSubtitle]);
                setCurrentSubtitle(defaultSubtitle);
            }

        } catch (error) {
            console.error('加载SRT文件失败:', error);
        }
    };

    // 生成默认SRT内容
    const generateDefaultSrt = (file) => {
        return `1
00:00:00,000 --> 00:00:05,000
${file.title || '英语听力练习'}

2
00:00:05,000 --> 00:00:10,000
请仔细听音频内容

3
00:00:10,000 --> 00:00:15,000
努力理解每个句子

4
00:00:15,000 --> 00:00:20,000
可以重复播放直到听懂

5
00:00:20,000 --> 00:00:25,000
点击"我懂了"进入下一句

6
00:00:25,000 --> 00:00:30,000
需要时可以查看答案`;
    };

    // 解析SRT格式
    const parseSrt = (content) => {
        if (!content || content.trim().length === 0) return [];

        try {
            const lines = content.trim().split('\n');
            const subtitles = [];
            let current = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (line === '') {
                    if (current && current.text) {
                        subtitles.push(current);
                        current = null;
                    }
                    continue;
                }

                if (/^\d+$/.test(line)) {
                    if (current) subtitles.push(current);
                    current = {
                        id: parseInt(line),
                        text: '',
                        startTime: 0,
                        endTime: 0,
                        userAnswered: false,
                        isCorrect: false,
                        attempts: 0
                    };
                }
                else if (line.includes('-->')) {
                    if (current) {
                        const [start, end] = line.split('-->').map(t => t.trim());
                        current.startTime = timeToSeconds(start);
                        current.endTime = timeToSeconds(end);
                    }
                }
                else if (line && current) {
                    current.text = current.text ? current.text + '\n' + line : line;
                }
            }

            if (current && current.text) subtitles.push(current);
            return subtitles;
        } catch (error) {
            console.error('解析SRT失败:', error);
            return [];
        }
    };

    // 时间转换
    const timeToSeconds = (timeStr) => {
        const parts = timeStr.replace(',', '.').split(':');
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 播放控制
    const playSentence = (sentence) => {
        if (!audioRef.current || !sentence) return;
        audioRef.current.currentTime = sentence.startTime;
        audioRef.current.play();
        setIsPlaying(true);
        if (autoLoopEnabled) setIsLooping(true);
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                if (currentSubtitle) {
                    audioRef.current.currentTime = currentSubtitle.startTime;
                }
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);

            if (currentSubtitle && time >= currentSubtitle.endTime) {
                if (isLooping) {
                    audioRef.current.currentTime = currentSubtitle.startTime;
                } else {
                    audioRef.current.pause();
                    setIsPlaying(false);
                }
            }

            if (currentSubtitle) {
                const progress = ((time - currentSubtitle.startTime) /
                    (currentSubtitle.endTime - currentSubtitle.startTime)) * 100;
                setProgress(Math.min(Math.max(progress, 0), 100));
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleVolumeChange = (event, newValue) => {
        if (audioRef.current) {
            audioRef.current.volume = newValue;
            setVolume(newValue);
            setIsMuted(newValue === 0);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleLoop = () => setIsLooping(!isLooping);
    const toggleAutoLoop = () => setAutoLoopEnabled(!autoLoopEnabled);
    const toggleShowAnswer = () => setShowAnswer(!showAnswer);

    const goToNext = () => {
        if (!currentSubtitle) return;
        const currentIndex = subtitles.findIndex(sub => sub.id === currentSubtitle.id);
        if (currentIndex < subtitles.length - 1) {
            const nextSub = subtitles[currentIndex + 1];
            setCurrentSubtitle(nextSub);
            setProgress(0);
            setShowAnswer(false);
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            setIsLooping(autoLoopEnabled);
        } else {
            updateFileProgress(100);
            alert(`🎉 恭喜！完成了《${currentFile.displayName}》！`);
        }
    };

    const goToPrevious = () => {
        if (!currentSubtitle) return;
        const currentIndex = subtitles.findIndex(sub => sub.id === currentSubtitle.id);
        if (currentIndex > 0) {
            const prevSub = subtitles[currentIndex - 1];
            setCurrentSubtitle(prevSub);
            setProgress(0);
            setShowAnswer(false);
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            setIsLooping(autoLoopEnabled);
        }
    };

    const handleGotIt = () => {
        if (!currentSubtitle) return;

        const updatedSubtitles = subtitles.map(sub =>
            sub.id === currentSubtitle.id
                ? { ...sub, userAnswered: true, isCorrect: true, attempts: sub.attempts + 1 }
                : sub
        );
        setSubtitles(updatedSubtitles);

        const completedCount = updatedSubtitles.filter(sub => sub.userAnswered).length;
        const fileProgress = (completedCount / updatedSubtitles.length) * 100;
        updateFileProgress(fileProgress);

        const currentIndex = subtitles.findIndex(sub => sub.id === currentSubtitle.id);
        if (currentIndex < subtitles.length - 1) {
            const nextSub = subtitles[currentIndex + 1];
            setCurrentSubtitle(nextSub);
            setProgress(0);
            setShowAnswer(false);
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            if (autoLoopEnabled) {
                setIsLooping(true);
                setTimeout(() => playSentence(nextSub), 300);
            }
        } else {
            updateFileProgress(100);
            alert(`🎉 恭喜！完成了《${currentFile.displayName}》！`);
            setIsLooping(false);
            setIsPlaying(false);
        }
    };

    const handleNotSure = () => {
        setIsLooping(true);
        if (audioRef.current) {
            audioRef.current.currentTime = currentSubtitle.startTime;
            if (!isPlaying) {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handleSentenceClick = (subtitle) => {
        setCurrentSubtitle(subtitle);
        setProgress(0);
        setShowAnswer(false);
        setIsLooping(autoLoopEnabled);
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        setTimeout(() => playSentence(subtitle), 100);
    };

    // 更新进度
    const updateFileProgress = (progress) => {
        if (!currentFile) return;
        const newProgressData = {
            ...progressData,
            [currentFile.id]: Math.round(progress)
        };
        setProgressData(newProgressData);
    };

    // 返回列表
    const handleBackToList = () => {
        setShowFileList(true);
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    // 计算统计
    const calculateStats = () => {
        const total = subtitles.length;
        const completed = subtitles.filter(sub => sub.userAnswered).length;
        return { total, completed, percentage: total > 0 ? ((completed / total) * 100).toFixed(1) : 0 };
    };

    const stats = calculateStats();
    const currentFileProgress = currentFile ? (progressData[currentFile.id] || 0) : 0;

    // 渲染主菜单
    const renderMainMenu = () => (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4, px: 1 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3 }}>
                {/* 顶部栏 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Headphones sx={{ fontSize: 32, color: 'primary.main' }} />
                        <Typography variant="h5" color="primary" fontWeight="bold">
                            英语听力练习
                        </Typography>
                    </Box>
                </Box>

                {/* 导航路径 */}
                {(currentVersion || currentGrade || currentUnit) && (
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Button size="small" onClick={() => { setCurrentVersion(null); setCurrentGrade(null); setCurrentUnit(null); }}>
                            首页
                        </Button>
                        {currentVersion && (
                            <>
                                <Typography variant="body2">/</Typography>
                                <Button size="small" onClick={() => { setCurrentGrade(null); setCurrentUnit(null); }}>
                                    {currentVersion.name}
                                </Button>
                            </>
                        )}
                        {currentGrade && (
                            <>
                                <Typography variant="body2">/</Typography>
                                <Button size="small" onClick={() => setCurrentUnit(null)}>
                                    {currentGrade.name}
                                </Button>
                            </>
                        )}
                        {currentUnit && (
                            <>
                                <Typography variant="body2">/</Typography>
                                <Chip label={currentUnit.name} size="small" color="primary" />
                            </>
                        )}
                    </Box>
                )}

                {/* 内容区域 */}
                {!currentVersion && (
                    // 显示版本列表
                    <>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MenuBook color="primary" /> 选择教材版本
                        </Typography>
                        <Grid container spacing={2}>
                            {versions.map(version => (
                                <Grid item xs={12} sm={6} md={4} key={version.id}>
                                    <Card 
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => handleVersionSelect(version)}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                                                    {version.icon || '📚'}
                                                </Avatar>
                                                <Typography variant="h6">{version.name}</Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {version.description}
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                {version.grades.map(g => (
                                                    <Chip key={g.id} label={g.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                                ))}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                {currentVersion && !currentGrade && (
                    // 显示年级列表
                    <>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Class color="primary" /> 选择年级
                        </Typography>
                        <Grid container spacing={2}>
                            {currentVersion.grades.map(grade => (
                                <Grid item xs={12} sm={6} md={4} key={grade.id}>
                                    <Card 
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => handleGradeSelect(grade)}
                                    >
                                        <CardContent>
                                            <Typography variant="h6">{grade.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {grade.units.length}个单元
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                {currentVersion && currentGrade && !currentUnit && (
                    // 显示单元列表
                    <>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Bookmark color="primary" /> 选择单元
                        </Typography>
                        <Grid container spacing={2}>
                            {currentGrade.units.map(unit => (
                                <Grid item xs={12} sm={6} md={4} key={unit.id}>
                                    <Card 
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => handleUnitSelect(unit)}
                                    >
                                        <CardContent>
                                            <Typography variant="h6">{unit.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {unit.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                {currentVersion && currentGrade && currentUnit && (
                    // 显示文件列表
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AudioFile color="primary" /> {currentUnit.name}
                            </Typography>
                        </Box>

                        {loadingFiles ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : filesList.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Folder sx={{ fontSize: 60, color: 'text.secondary' }} />
                                <Typography>没有找到音频文件</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {filesList.map(file => (
                                    <Grid item xs={12} sm={6} md={4} key={file.id}>
                                        <Card 
                                            sx={{ 
                                                cursor: 'pointer',
                                                border: file.progress === 100 ? '2px solid #4caf50' : 'none'
                                            }}
                                            onClick={() => handleFileSelect(file)}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Avatar sx={{ bgcolor: '#2196f3', mr: 1, width: 32, height: 32 }}>
                                                        {file.lesson}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle1">
                                                            {file.title || `第${file.lesson}课`}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {file.duration}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={file.progress} 
                                                    sx={{ height: 4, borderRadius: 2 }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </>
                )}

            </Paper>
        </Container>
    );

    // 渲染播放器
    const renderPlayer = () => {
        if (isLoading) {
            return (
                <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
                    <CircularProgress size={60} />
                    <Typography sx={{ mt: 2 }}>加载中...</Typography>
                </Container>
            );
        }

        if (hasError) {
            return (
                <Container maxWidth="sm" sx={{ mt: 10 }}>
                    <Alert severity="error">加载失败</Alert>
                    <Button fullWidth sx={{ mt: 2 }} onClick={handleBackToList}>返回</Button>
                </Container>
            );
        }

        return (
            <Container maxWidth="sm" sx={{ mt: 2, mb: 4, px: 1 }}>
                <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
                    {/* 顶部栏 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <IconButton onClick={handleBackToList} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" noWrap>
                                {currentFile?.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                进度: {currentFileProgress}%
                            </Typography>
                        </Box>
                        <Chip 
                            size="small"
                            label={`${stats.completed}/${stats.total}`}
                            color="primary"
                        />
                    </Box>

                    {/* 音频播放器 */}
                    <audio
                        ref={audioRef}
                        src={audioSrc}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={() => setHasError(true)}
                    />

                    {/* 当前句子 */}
                    <Card sx={{ mb: 2, bgcolor: '#e3f2fd' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2">
                                    第 {currentSubtitle?.id} 句
                                </Typography>
                                <Chip 
                                    size="small"
                                    label={isLooping ? "重复中" : "播放中"}
                                    icon={isLooping ? <Loop /> : <Hearing />}
                                />
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{ height: 6, borderRadius: 3, mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">{formatTime(currentTime)}</Typography>
                                <Typography variant="caption">{formatTime(duration)}</Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* 控制按钮 */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                        <IconButton onClick={goToPrevious} disabled={currentSubtitle?.id === 1}>
                            <NavigateNext sx={{ transform: 'rotate(180deg)' }} />
                        </IconButton>
                        <IconButton 
                            onClick={togglePlay}
                            sx={{ 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                            }}
                        >
                            {isPlaying ? <Pause /> : <PlayArrow />}
                        </IconButton>
                        <IconButton onClick={goToNext}>
                            <NavigateNext />
                        </IconButton>
                    </Box>

                    {/* 功能按钮 */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Button 
                            variant={isLooping ? "contained" : "outlined"}
                            color="secondary"
                            startIcon={<Loop />}
                            onClick={toggleLoop}
                            fullWidth
                            size="small"
                        >
                            重复
                        </Button>
                        <Button 
                            variant={showAnswer ? "contained" : "outlined"}
                            color="info"
                            startIcon={showAnswer ? <VisibilityOff /> : <Visibility />}
                            onClick={toggleShowAnswer}
                            fullWidth
                            size="small"
                        >
                            {showAnswer ? '隐藏' : '显示'}
                        </Button>
                    </Box>

                    {/* 答案区域 */}
                    {showAnswer && currentSubtitle && (
                        <Card sx={{ mb: 2, bgcolor: '#e8f5e9' }}>
                            <CardContent>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                    {currentSubtitle.text}
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    {/* 理解按钮 */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                            variant="contained"
                            color="success"
                            onClick={handleGotIt}
                            fullWidth
                            startIcon={<CheckCircle />}
                        >
                            我懂了
                        </Button>
                        <Button 
                            variant="outlined"
                            color="warning"
                            onClick={handleNotSure}
                            fullWidth
                            startIcon={<Replay />}
                        >
                            再听一遍
                        </Button>
                    </Box>

                    {/* 句子导航 */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            句子导航
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {subtitles.map(sub => (
                                <Box
                                    key={sub.id}
                                    onClick={() => handleSentenceClick(sub)}
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 1,
                                        bgcolor: currentSubtitle?.id === sub.id ? 'primary.main' :
                                                sub.userAnswered ? 'success.main' : 'grey.300',
                                        color: (currentSubtitle?.id === sub.id || sub.userAnswered) ? 'white' : 'black',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {sub.id}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Paper>
            </Container>
        );
    };

    return showFileList ? renderMainMenu() : renderPlayer();
};

export default ListeningPractice;