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
    Tooltip
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
    Subtitles
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";


const ListeningPractice = () => {
    // Refs
    const audioRef = useRef(null);
    const navigate = useNavigate();
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

    // 文件列表状态
    const [filesList, setFilesList] = useState([]);
    const [showFileList, setShowFileList] = useState(true);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [progressData, setProgressData] = useState({});

    // 筛选和排序
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [sortBy, setSortBy] = useState('unit');

    // 初始化
    useEffect(() => {
        // 从localStorage加载进度数据
        const savedProgress = localStorage.getItem('listeningPracticeProgress');
        if (savedProgress) {
            try {
                setProgressData(JSON.parse(savedProgress));
            } catch (e) {
                console.error('加载进度数据失败:', e);
            }
        }

        // 加载文件列表
        loadFilesList();
    }, []);

    // 保存进度到localStorage
    useEffect(() => {
        if (Object.keys(progressData).length > 0) {
            localStorage.setItem('listeningPracticeProgress', JSON.stringify(progressData));
        }
    }, [progressData]);

    // 从JSON文件加载文件列表
    const loadFilesFromJson = async () => {
        try {
            console.log('开始从JSON文件加载文件列表...');
            const response = await fetch('/ListeningPractice/text/file-list.json');

            if (!response.ok) {
                console.error('无法加载file-list.json文件');
                return [];
            }

            const data = await response.json();
            console.log('从JSON加载到', data.files?.length || 0, '个文件配置');

            // 直接返回JSON中的数据，不检查文件是否存在
            const files = data.files.map(file => ({
                ...file,
                displayName: `Unit ${file.unit}.${file.lesson}`,
                description: `第${file.unit}单元 第${file.lesson}课`,
                duration: '约1-2分钟',
                part: 1,
                hasAudio: true,
                hasSubtitle: true, // 假设都有字幕
                progress: progressData[file.id] || 0
            }));

            console.log(`加载 ${files.length} 个文件配置`);
            return files;

        } catch (error) {
            console.error('加载JSON文件失败:', error);
            return [];
        }
    };

    // 加载文件列表
    const loadFilesList = async () => {
        try {
            setLoadingFiles(true);

            // 从JSON加载文件
            const files = await loadFilesFromJson();

            // 根据筛选条件过滤
            let filteredFiles = files;
            if (selectedUnit !== 'all') {
                filteredFiles = filteredFiles.filter(file => file.unit === parseInt(selectedUnit));
            }

            // 根据排序条件排序
            filteredFiles.sort((a, b) => {
                if (sortBy === 'unit') {
                    if (a.unit !== b.unit) return a.unit - b.unit;
                    if (a.lesson !== b.lesson) return a.lesson - b.lesson;
                    return 0;
                } else if (sortBy === 'progress') {
                    return (b.progress || 0) - (a.progress || 0);
                }
                return 0;
            });

            setFilesList(filteredFiles);
            setLoadingFiles(false);

        } catch (error) {
            console.error('加载文件列表失败:', error);
            setLoadingFiles(false);
        }
    };

    // 强制重新加载文件列表
    const forceReload = () => {
        loadFilesList();
    };

    // 选择文件
    const handleFileSelect = async (file) => {
        try {
            setIsLoading(true);
            setCurrentFile(file);
            setShowFileList(false);
            setHasError(false);

            console.log('开始加载文件:', file.filename);

            // 加载音频
            const audioUrl = `/ListeningPractice/audio/${file.filename}`;

            console.log('音频URL:', audioUrl)

            setAudioSrc(audioUrl);

            // 等待音频元素加载
            await new Promise((resolve, reject) => {
                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.load();

                    audioRef.current.onloadedmetadata = () => {
                        console.log('音频加载成功，时长:', audioRef.current.duration);
                        resolve();
                    };

                    audioRef.current.onerror = (err) => {
                        console.error('音频加载失败:', err);
                        reject(new Error(`音频加载失败: ${file.filename}`));
                    };
                } else {
                    resolve();
                }
            });

            // 加载SRT字幕
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
            console.log('开始加载SRT文件，文件信息:', file);

            let parsedSubtitles = [];
            let srtContent = '';
            let foundFormat = '';

            // 尝试多种可能的SRT文件名格式
            const srtFormats = [
                file.srtFile, // JSON中指定的文件名
                `${file.unit}_${file.lesson}.srt`,   // 标准小写
                `${file.unit}_${file.lesson}.SRT`,   // 标准大写
                `${file.unit}_${file.lesson}.txt`,   // txt格式
                `${file.unit}_${file.lesson}.TXT`,   // 大写TXT
            ];

            // 去除重复格式
            const uniqueFormats = [...new Set(srtFormats)];

            // 逐个尝试
            for (const format of uniqueFormats) {
                try {
                    console.log('尝试加载SRT格式:', format);
                    const response = await fetch(`/ListeningPractice/audio/${format}`);

                    if (response.ok) {
                        srtContent = await response.text();
                        foundFormat = format;
                        console.log(`成功加载SRT文件: ${format}`);
                        break;
                    }
                } catch (err) {
                    console.log(`格式 ${format} 不可用`);
                    continue;
                }
            }

            // 如果找到SRT文件，解析它
            if (srtContent) {
                parsedSubtitles = parseSrt(srtContent);
                console.log(`从 ${foundFormat} 解析到 ${parsedSubtitles.length} 个字幕`);

                // 打印前几个字幕用于调试
                if (parsedSubtitles.length > 0) {
                    console.log('前3个字幕:');
                    parsedSubtitles.slice(0, 3).forEach((sub, idx) => {
                        console.log(`字幕${idx + 1}: "${sub.text}" (${sub.startTime}s - ${sub.endTime}s)`);
                    });
                }
            } else {
                // 如果没找到，使用默认内容
                console.warn(`未找到SRT文件，使用默认内容`);
                const defaultContent = generateDefaultSrt();
                parsedSubtitles = parseSrt(defaultContent);
            }

            setSubtitles(parsedSubtitles);

            // 设置第一个字幕为当前
            if (parsedSubtitles.length > 0) {
                setCurrentSubtitle(parsedSubtitles[0]);
                console.log('设置当前字幕为:', parsedSubtitles[0].text);
            } else {
                // 如果没有字幕，创建一个默认的
                console.warn('没有解析到字幕，创建默认字幕');
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
            // 使用默认内容
            const defaultContent = generateDefaultSrt();
            const parsedSubtitles = parseSrt(defaultContent);
            setSubtitles(parsedSubtitles);

            if (parsedSubtitles.length > 0) {
                setCurrentSubtitle(parsedSubtitles[0]);
            }
        }
    };

    // 生成默认SRT内容
    const generateDefaultSrt = () => {
        return `1
00:00:00,000 --> 00:00:05,000
欢迎使用英语听力练习

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

    // 解析SRT格式 - 加强调试版本
    const parseSrt = (content) => {
        console.log('开始解析SRT内容，内容长度:', content.length);

        if (!content || content.trim().length === 0) {
            console.warn('SRT内容为空');
            return [];
        }

        try {
            const lines = content.trim().split('\n');
            console.log('总行数:', lines.length);

            const subtitles = [];
            let current = null;
            let lineNumber = 0;

            for (let i = 0; i < lines.length; i++) {
                lineNumber++;
                const line = lines[i].trim();

                // 跳过空行
                if (line === '') {
                    if (current && current.text) {
                        subtitles.push(current);
                        console.log(`完成字幕 ${current.id}，文本: "${current.text}"`);
                        current = null;
                    }
                    continue;
                }

                // 字幕序号
                if (/^\d+$/.test(line)) {
                    if (current) {
                        subtitles.push(current);
                        console.log(`完成字幕 ${current.id}，文本: "${current.text}"`);
                    }
                    current = {
                        id: parseInt(line),
                        text: '',
                        startTime: 0,
                        endTime: 0,
                        userAnswered: false,
                        isCorrect: false,
                        attempts: 0
                    };
                    console.log(`开始字幕 ${current.id}`);
                }
                // 时间轴
                else if (line.includes('-->')) {
                    if (current) {
                        try {
                            const [start, end] = line.split('-->').map(t => t.trim());
                            current.startTime = timeToSeconds(start);
                            current.endTime = timeToSeconds(end);
                            console.log(`字幕 ${current.id} 时间: ${start} -> ${end}`);
                        } catch (timeError) {
                            console.error(`解析时间轴失败: ${line}`, timeError);
                        }
                    }
                }
                // 字幕文本
                else if (line && current) {
                    if (current.text) {
                        current.text += '\n' + line;
                    } else {
                        current.text = line;
                    }
                }
            }

            if (current && current.text) {
                subtitles.push(current);
                console.log(`完成字幕 ${current.id}，文本: "${current.text}"`);
            }

            console.log('解析完成，总字幕数:', subtitles.length);
            return subtitles;
        } catch (error) {
            console.error('解析SRT失败:', error);
            console.error('错误内容前100字符:', content.substring(0, 100));
            return [];
        }
    };

    // 时间转换函数
    const timeToSeconds = (timeStr) => {
        const parts = timeStr.replace(',', '.').split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseFloat(parts[2]);
        return hours * 3600 + minutes * 60 + seconds;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 播放指定句子
    const playSentence = (sentence) => {
        if (!audioRef.current || !sentence) return;

        audioRef.current.currentTime = sentence.startTime;
        audioRef.current.play();
        setIsPlaying(true);

        if (autoLoopEnabled) {
            setIsLooping(true);
        }
    };

    // 音频控制
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
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
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

    const toggleLoop = () => {
        setIsLooping(!isLooping);
    };

    const toggleAutoLoop = () => {
        setAutoLoopEnabled(!autoLoopEnabled);
    };

    const goToNext = () => {
        if (!currentSubtitle) return;

        const currentIndex = subtitles.findIndex(sub => sub.id === currentSubtitle.id);
        if (currentIndex < subtitles.length - 1) {
            const nextSub = subtitles[currentIndex + 1];
            setCurrentSubtitle(nextSub);
            setProgress(0);
            setShowAnswer(false);

            if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }

            if (!autoLoopEnabled) {
                setIsLooping(false);
            } else {
                setIsLooping(true);
            }
        } else {
            // 完成当前文件
            updateFileProgress(100);
            alert(`🎉 恭喜！你已经完成了《${currentFile.displayName}》！`);
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

            if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }

            if (!autoLoopEnabled) {
                setIsLooping(false);
            } else {
                setIsLooping(true);
            }
        }
    };

    const toggleShowAnswer = () => {
        setShowAnswer(!showAnswer);
    };

    const handleGotIt = () => {
        if (!currentSubtitle) return;

        // 更新字幕状态
        const updatedSubtitles = subtitles.map(sub =>
            sub.id === currentSubtitle.id
                ? {
                    ...sub,
                    userAnswered: true,
                    isCorrect: true,
                    attempts: sub.attempts + 1
                }
                : sub
        );
        setSubtitles(updatedSubtitles);

        // 计算并更新文件进度
        const completedCount = updatedSubtitles.filter(sub => sub.userAnswered).length;
        const fileProgress = (completedCount / updatedSubtitles.length) * 100;
        updateFileProgress(fileProgress);

        // 进入下一句
        const currentIndex = subtitles.findIndex(sub => sub.id === currentSubtitle.id);
        if (currentIndex < subtitles.length - 1) {
            const nextSub = subtitles[currentIndex + 1];
            setCurrentSubtitle(nextSub);
            setProgress(0);
            setShowAnswer(false);

            if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }

            if (autoLoopEnabled) {
                setIsLooping(true);
                setTimeout(() => {
                    playSentence(nextSub);
                }, 300);
            }
        } else {
            updateFileProgress(100);
            alert(`🎉 恭喜！你已经完成了《${currentFile.displayName}》！`);
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

        if (autoLoopEnabled) {
            setIsLooping(true);
        } else {
            setIsLooping(false);
        }

        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }

        setTimeout(() => {
            playSentence(subtitle);
        }, 100);
    };

    // 更新文件进度
    const updateFileProgress = (progress) => {
        if (!currentFile) return;

        const newProgressData = {
            ...progressData,
            [currentFile.id]: Math.round(progress)
        };
        setProgressData(newProgressData);
        loadFilesList(); // 刷新列表显示新进度
    };

    // 返回文件列表
    const handleBackToList = () => {
        setShowFileList(true);
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    // 计算当前文件统计
    const calculateStats = () => {
        const total = subtitles.length;
        const completed = subtitles.filter(sub => sub.userAnswered).length;
        const correct = subtitles.filter(sub => sub.isCorrect).length;
        return {
            total,
            completed,
            correct,
            accuracy: completed > 0 ? (correct / completed * 100).toFixed(1) : 0,
            percentage: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
        };
    };

    const stats = calculateStats();
    const currentFileProgress = currentFile ? (progressData[currentFile.id] || 0) : 0;

    // 获取单元列表（从实际文件）
    const getUnitList = () => {
        const units = new Set();
        filesList.forEach(file => units.add(file.unit));
        return Array.from(units).sort((a, b) => a - b);
    };

    // 计算单元统计
    const calculateUnitStats = () => {
        const unitStats = {};
        const allUnits = new Set();

        // 从filesList获取所有单元
        filesList.forEach(file => allUnits.add(file.unit));

        Array.from(allUnits).forEach(unit => {
            const unitFiles = filesList.filter(file => file.unit === unit);
            const totalFiles = unitFiles.length;
            const completedFiles = unitFiles.filter(file => progressData[file.id] === 100).length;
            const totalProgress = unitFiles.reduce((sum, file) => sum + (progressData[file.id] || 0), 0);
            const avgProgress = totalFiles > 0 ? Math.round(totalProgress / totalFiles) : 0;

            unitStats[unit] = {
                totalFiles,
                completedFiles,
                avgProgress
            };
        });

        return unitStats;
    };

    const unitStats = calculateUnitStats();

    // 渲染文件列表
    const renderFileList = () => (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                {/* 标题和统计 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LibraryBooks sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h4" component="h1" color="primary">
                                英语听力练习库
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                共 {filesList.length} 个练习材料，按单元分类
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                数据来源: file-list.json
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="重新加载文件列表">
                            <Button
                                variant="outlined"
                                onClick={() => navigate("/")}
                            >
                                返回主目录
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={forceReload}
                                disabled={loadingFiles}
                            >
                                刷新列表
                            </Button>
                        </Tooltip>
                    </Box>
                </Box>

                {/* 文件统计 */}
                <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color="primary">
                                        {filesList.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        音频文件
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color="secondary">
                                        {filesList.filter(f => f.hasSubtitle).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        有字幕文件
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color="success.main">
                                        {filesList.filter(f => f.progress === 100).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        已完成
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* 筛选和排序 */}
                <Card sx={{ mb: 3, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>选择单元</InputLabel>
                                <Select
                                    value={selectedUnit}
                                    label="选择单元"
                                    onChange={(e) => {
                                        setSelectedUnit(e.target.value);
                                        setTimeout(loadFilesList, 0);
                                    }}
                                >
                                    <MenuItem value="all">所有单元 ({filesList.length})</MenuItem>
                                    {getUnitList().map(unit => (
                                        <MenuItem key={unit} value={unit}>
                                            第{unit}单元 ({unitStats[unit]?.totalFiles || 0}个文件)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>排序方式</InputLabel>
                                <Select
                                    value={sortBy}
                                    label="排序方式"
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setTimeout(loadFilesList, 0);
                                    }}
                                >
                                    <MenuItem value="unit">按单元排序</MenuItem>
                                    <MenuItem value="progress">按进度排序</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    自动重复:
                                </Typography>
                                <Button
                                    variant={autoLoopEnabled ? "contained" : "outlined"}
                                    color={autoLoopEnabled ? "secondary" : "default"}
                                    onClick={toggleAutoLoop}
                                    size="small"
                                >
                                    {autoLoopEnabled ? '开启' : '关闭'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Card>

                {/* 单元统计（只显示有文件的单元） */}
                {getUnitList().length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <School />
                            单元进度概览
                        </Typography>
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                            {getUnitList().map(unit => {
                                const stats = unitStats[unit];
                                return (
                                    <Grid item xs={6} sm={4} md={2.4} key={unit}>
                                        <Card
                                            sx={{
                                                p: 1.5,
                                                cursor: 'pointer',
                                                backgroundColor: selectedUnit === unit.toString() ? '#e3f2fd' : 'inherit',
                                                '&:hover': {
                                                    backgroundColor: '#f5f5f5'
                                                }
                                            }}
                                            onClick={() => {
                                                setSelectedUnit(unit.toString());
                                                setTimeout(loadFilesList, 0);
                                            }}
                                        >
                                            <Typography variant="subtitle2" align="center" gutterBottom>
                                                第{unit}单元
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={stats.avgProgress}
                                                sx={{ height: 6, borderRadius: 3, mb: 1 }}
                                            />
                                            <Typography variant="caption" color="text.secondary" align="center" display="block">
                                                {stats.avgProgress}% 完成
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" align="center" display="block">
                                                {stats.completedFiles}/{stats.totalFiles}
                                            </Typography>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* 文件列表 */}
                {loadingFiles ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography variant="body1" sx={{ ml: 2 }}>
                            正在加载文件列表...
                        </Typography>
                    </Box>
                ) : filesList.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Folder sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            没有找到音频文件
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            请检查 public/file-list.json 文件配置
                            <br />确保文件存在于 public 文件夹中
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Refresh />}
                            onClick={forceReload}
                        >
                            重新加载
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Typography variant="h6" gutterBottom>
                            可用的练习材料 ({filesList.length}个)
                        </Typography>
                        <Grid container spacing={2}>
                            {filesList.map((file) => (
                                <Grid item xs={12} sm={6} md={4} key={file.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            border: '2px solid',
                                            borderColor: file.progress === 100 ? '#4caf50' : 'transparent',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 6
                                            }
                                        }}
                                        onClick={() => handleFileSelect(file)}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Avatar sx={{
                                                    bgcolor: '#2196f3',
                                                    mr: 2
                                                }}>
                                                    <Typography variant="body2" sx={{ color: 'white' }}>
                                                        {file.unit}.{file.lesson}
                                                    </Typography>
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="h6" gutterBottom>
                                                        {file.displayName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {file.description}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    {file.progress === 100 && (
                                                        <CheckCircle sx={{ color: '#4caf50' }} />
                                                    )}
                                                    {!file.hasSubtitle && (
                                                        <Tooltip title="未找到字幕文件">
                                                            <Subtitles sx={{ color: 'warning.main', ml: 1 }} />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {file.duration}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="音频文件">
                                                        <AudioFile sx={{ fontSize: 16, color: 'success.main' }} />
                                                    </Tooltip>
                                                    {!file.hasSubtitle && (
                                                        <Tooltip title="无字幕文件">
                                                            <Subtitles sx={{ fontSize: 16, color: 'warning.main' }} />
                                                        </Tooltip>
                                                    )}
                                                    {file.hasSubtitle && (
                                                        <Tooltip title="有字幕文件">
                                                            <Subtitles sx={{ fontSize: 16, color: 'info.main' }} />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ mt: 2 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={file.progress}
                                                    sx={{ height: 6, borderRadius: 3 }}
                                                />
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                    进度: {file.progress}%
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>使用说明：</strong>
                        <br />• 点击任意卡片开始听力练习
                        <br />• 文件列表来自 public/file-list.json 配置文件
                        <br />• 系统会自动检查音频和字幕文件是否存在
                        <br />• 🎵 图标表示有音频文件，📝 图标表示有字幕文件
                        <br />• 黄色📝图标表示未找到字幕文件
                        <br />• 系统自动保存学习进度
                        <br />• 绿色边框表示已完成的材料
                    </Typography>
                </Alert>
            </Paper>
        </Container >
    );

    // 渲染播放器
    const renderPlayer = () => {
        if (isLoading) {
            return (
                <Container maxWidth="sm" sx={{ mt: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress size={60} sx={{ mb: 3 }} />
                    <Typography variant="h6" color="primary">
                        正在加载《{currentFile?.displayName}》...
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        音频: {currentFile?.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        字幕: {currentFile?.hasSubtitle ? '有' : '无'}
                    </Typography>
                </Container>
            );
        }

        if (hasError) {
            return (
                <Container maxWidth="sm" sx={{ mt: 10 }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        <Typography variant="h6">加载失败</Typography>
                        <Typography variant="body2">
                            无法加载文件。请检查文件是否存在：{currentFile?.filename}
                            <br />请确保文件在 public 文件夹中
                            <br />检查浏览器控制台查看详细错误信息
                        </Typography>
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={handleBackToList}
                        fullWidth
                        startIcon={<ArrowBack />}
                    >
                        返回文件列表
                    </Button>
                </Container>
            );
        }

        return (
            <Container maxWidth="sm" sx={{ mt: 2, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: '#f8f9fa' }}>
                    {/* 返回按钮和标题 */}
                    <Box sx={{ mb: 3 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={handleBackToList}
                            sx={{ mb: 2 }}
                            variant="outlined"
                        >
                            返回列表
                        </Button>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="h5" component="h1" color="primary">
                                    {currentFile?.displayName}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary">
                                    {currentFile?.description} • 进度: {currentFileProgress}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    字幕: {currentFile?.hasSubtitle ? '有' : '无'}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                    icon={autoLoopEnabled ? <Loop /> : <PlayArrow />}
                                    label={autoLoopEnabled ? "自动重复" : "单次播放"}
                                    color={autoLoopEnabled ? "secondary" : "default"}
                                    variant="outlined"
                                    size="small"
                                    onClick={toggleAutoLoop}
                                    clickable
                                />
                                <Chip
                                    label={`${stats.completed}/${stats.total}句`}
                                    color="primary"
                                    size="small"
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* 隐藏的音频播放器 */}
                    <audio
                        ref={audioRef}
                        src={audioSrc}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={() => setHasError(true)}
                        style={{ display: 'none' }}
                    />

                    {/* 当前句子信息 */}
                    <Card sx={{ mb: 3, borderRadius: 2, backgroundColor: '#e3f2fd' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                    第 {currentSubtitle?.id} 句 / 共 {subtitles.length} 句
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Chip
                                        icon={isLooping ? <Loop /> : <Hearing />}
                                        label={isLooping ? "重复中" : "播放中"}
                                        size="small"
                                        color={isLooping ? "secondary" : "primary"}
                                    />
                                </Box>
                            </Box>

                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    mb: 1,
                                    backgroundColor: '#bbdefb',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#1976d2'
                                    }
                                }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">
                                    播放进度
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* 主控制区 */}
                    <Card sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent>
                            <Stack spacing={2}>
                                {/* 播放控制 */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                                    <IconButton
                                        onClick={goToPrevious}
                                        disabled={currentSubtitle?.id === 1}
                                        sx={{
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { backgroundColor: 'primary.dark' },
                                            '&.Mui-disabled': { backgroundColor: '#e0e0e0' }
                                        }}
                                    >
                                        <NavigateNext sx={{ transform: 'rotate(180deg)' }} />
                                    </IconButton>

                                    <IconButton
                                        onClick={togglePlay}
                                        sx={{
                                            backgroundColor: isPlaying ? 'secondary.main' : 'primary.main',
                                            color: 'white',
                                            width: 60,
                                            height: 60,
                                            '&:hover': { backgroundColor: isPlaying ? 'secondary.dark' : 'primary.dark' }
                                        }}
                                    >
                                        {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                                    </IconButton>

                                    <IconButton
                                        onClick={goToNext}
                                        sx={{
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { backgroundColor: 'primary.dark' }
                                        }}
                                    >
                                        <NavigateNext />
                                    </IconButton>
                                </Box>

                                {/* 控制按钮 */}
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant={isLooping ? "contained" : "outlined"}
                                        color="secondary"
                                        startIcon={<Loop />}
                                        onClick={toggleLoop}
                                        fullWidth
                                    >
                                        {isLooping ? '停止重复' : '手动重复'}
                                    </Button>

                                    <Button
                                        variant={showAnswer ? "contained" : "outlined"}
                                        color="info"
                                        startIcon={showAnswer ? <VisibilityOff /> : <Visibility />}
                                        onClick={toggleShowAnswer}
                                        fullWidth
                                    >
                                        {showAnswer ? '隐藏答案' : '显示答案'}
                                    </Button>
                                </Box>

                                {/* 音量控制 */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton onClick={toggleMute} size="small">
                                        {isMuted ? <VolumeOff /> : volume > 0.5 ? <VolumeUp /> : <VolumeDown />}
                                    </IconButton>
                                    <Slider
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        sx={{ flexGrow: 1 }}
                                    />
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* 答案区域 */}
                    {showAnswer && currentSubtitle && (
                        <Fade in={showAnswer}>
                            <Card sx={{ mb: 3, backgroundColor: '#e8f5e9', borderRadius: 2, border: '2px solid #4caf50' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <CheckCircle sx={{ color: '#4caf50' }} />
                                        <Typography variant="h6" color="success.main">
                                            句子原文
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{
                                        whiteSpace: 'pre-line',
                                        p: 2,
                                        backgroundColor: 'white',
                                        borderRadius: 1,
                                        fontStyle: 'italic',
                                        fontSize: '1.1rem'
                                    }}>
                                        "{currentSubtitle.text}"
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        {currentSubtitle.userAnswered
                                            ? `✓ 已掌握（练习了${currentSubtitle.attempts}次）`
                                            : '第一次学习'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Fade>
                    )}

                    {/* 理解确认按钮 */}
                    <Zoom in={!showAnswer}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary" textAlign="center">
                                {isLooping ? '🔁 重复听到懂为止' : '🎧 你听懂这句话了吗？'}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    startIcon={<CheckCircle />}
                                    onClick={handleGotIt}
                                    fullWidth
                                    sx={{
                                        height: 56,
                                        fontSize: '1rem',
                                        borderRadius: 2,
                                        boxShadow: '0 3px 10px rgba(76, 175, 80, 0.3)'
                                    }}
                                >
                                    {autoLoopEnabled ? '我懂了，下一句(自动重复)' : '我懂了，下一句'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="warning"
                                    size="large"
                                    startIcon={<Replay />}
                                    onClick={handleNotSure}
                                    fullWidth
                                    sx={{
                                        height: 56,
                                        fontSize: '1rem',
                                        borderRadius: 2,
                                        borderWidth: 2
                                    }}
                                >
                                    没听懂，再听几遍
                                </Button>
                            </Box>
                        </Box>
                    </Zoom>

                    {/* 句子导航 */}
                    <Card sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Numbers />
                                句子导航 (点击数字跳转)
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                justifyContent: 'center'
                            }}>
                                {subtitles.map((subtitle) => {
                                    const isCurrent = currentSubtitle?.id === subtitle.id;
                                    const isCompleted = subtitle.userAnswered;

                                    return (
                                        <Box
                                            key={subtitle.id}
                                            onClick={() => handleSentenceClick(subtitle)}
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                backgroundColor: isCurrent ? '#1976d2' :
                                                    isCompleted ? '#4caf50' : '#e0e0e0',
                                                color: isCurrent ? 'white' :
                                                    isCompleted ? 'white' : 'black',
                                                fontWeight: 'bold',
                                                fontSize: '1.1rem',
                                                transition: 'all 0.2s ease',
                                                border: '2px solid',
                                                borderColor: isCurrent ? '#1565c0' :
                                                    isCompleted ? '#388e3c' : '#bdbdbd',
                                                '&:hover': {
                                                    transform: 'scale(1.1)',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                                }
                                            }}
                                        >
                                            {subtitle.id}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                </Paper>
            </Container>
        );
    };

    return (
        <>
            {showFileList ? renderFileList() : renderPlayer()}
        </>
    );
};

export default ListeningPractice;