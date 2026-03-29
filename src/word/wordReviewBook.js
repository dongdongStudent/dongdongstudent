import React, { useState, useEffect, useMemo } from 'react';
import {
    Container, Paper, Typography, Box, IconButton, TextField,
    InputAdornment, FormControl, InputLabel, Select, MenuItem,
    Chip, LinearProgress, Button, Alert, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TablePagination,
    TableSortLabel, Checkbox, Tooltip, Snackbar, CircularProgress,
    List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
    Search, VolumeUp, Delete, CheckCircle, Cancel, Help,
    Refresh, Shuffle, TrendingUp, AccessTime
} from '@mui/icons-material';
import { getToken } from "../config.js";
import { Alert as MuiAlert } from '@mui/material';
import ListeningFinalMaster from "./WordReviewTest.js";

import {
    parseWordData, getTimeAgo, getMasteryInfo,
    buildIntelligentPool, calculateExtractionStats,
    convertExtractedWordsToTestFormat, newWordPriorityExtraction,
    F_get_review, updateWordDataToServer, batchUpdateWordsData,
    deleteWordFromServer, batchDeleteWordsFromServer, resetWordStatsOnServer
} from './wordReviewUtils.js';

const SimpleWordBook = ({ G_json, onClose }) => {
    const [words, setWords] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortField, setSortField] = useState('word');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedWords, setSelectedWords] = useState(new Set());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(8); // 改为8行，减少滚动
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showExtractDialog, setShowExtractDialog] = useState(false);
    const [showExtractOptionsDialog, setShowExtractOptionsDialog] = useState(false);
    const [showResetStatsDialog, setShowResetStatsDialog] = useState(false);
    const [wordToReset, setWordToReset] = useState(null);
    const [wordToDelete, setWordToDelete] = useState(null);
    const [showSingleDeleteDialog, setShowSingleDeleteDialog] = useState(false);
    const [extractedWords, setExtractedWords] = useState([]);
    const [extractCount, setExtractCount] = useState(20);
    const [intelligentPool, setIntelligentPool] = useState([]);
    const [showWork, setShowWork] = useState(false);
    const [operationLoading, setOperationLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showMessage = (message, severity = 'success') => 
        setSnackbar({ open: true, message, severity });

    useEffect(() => {
        if (!getToken()) {
            if (window.confirm('您尚未登录，是否回到主页登录？')) window.location.href = '/';
            else onClose?.();
        }
    }, [onClose]);

    useEffect(() => { loadWords(); }, [G_json]);

    const loadWords = async () => {
        setLoading(true);
        try {
            const data = await F_get_review(getToken, G_json);
            setWords(data && typeof data === 'object' && !Array.isArray(data) ? data : {});
        } catch {
            showMessage('加载单词数据失败', 'error');
            setWords({});
        } finally { setLoading(false); }
    };

    const handleSort = (field) => {
        if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDirection('asc'); }
        setPage(0);
    };

    const processedWords = useMemo(() => {
        if (!words || typeof words !== 'object') return [];
        const wordArray = Object.entries(words).map(([word, wordData]) => {
            const { chinese, extraction_count, correct_count, wrong_count, total_tests, accuracy, mastery_level, is_mastered, time } = parseWordData(wordData);
            return {
                word, chinese, extraction_count, correct_count, wrong_count,
                total_tests, accuracy, mastery_level, is_mastered,
                masteryInfo: getMasteryInfo(mastery_level, accuracy),
                timeAgo: getTimeAgo(time), 
                lastReview: time,
                isSelected: selectedWords.has(word)
            };
        });
        let filtered = wordArray;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item => item.word.toLowerCase().includes(term) || item.chinese.toLowerCase().includes(term));
        }
        if (filter === 'mastered') filtered = filtered.filter(item => item.is_mastered);
        else if (filter === 'unmastered') filtered = filtered.filter(item => !item.is_mastered);
        return filtered.sort((a, b) => {
            let compare = 0;
            switch (sortField) {
                case 'word': compare = a.word.localeCompare(b.word); break;
                case 'chinese': compare = a.chinese.localeCompare(b.chinese); break;
                case 'mastery': compare = a.mastery_level - b.mastery_level; break;
                case 'extraction': compare = a.extraction_count - b.extraction_count; break;
                case 'accuracy': compare = a.accuracy - b.accuracy; break;
                case 'tests': compare = a.total_tests - b.total_tests; break;
                case 'lastReview': compare = new Date(a.lastReview || 0) - new Date(b.lastReview || 0); break;
                default: compare = a.word.localeCompare(b.word);
            }
            return sortDirection === 'asc' ? compare : -compare;
        });
    }, [words, selectedWords, searchTerm, filter, sortField, sortDirection]);

    useEffect(() => {
        if (processedWords.length > 0) setIntelligentPool(buildIntelligentPool(processedWords, 40));
    }, [processedWords]);

    const paginatedWords = useMemo(() => 
        processedWords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [processedWords, page, rowsPerPage]
    );

    const handleExtractRandomWords = () => {
        if (intelligentPool.length < extractCount) {
            showMessage(`抽取池只有${intelligentPool.length}个单词`, 'warning');
            return;
        }
        setOperationLoading(true);
        try {
            let selected = newWordPriorityExtraction(intelligentPool, extractCount);
            const uniqueSelected = [];
            const seen = new Set();
            for (const word of selected) {
                if (!seen.has(word.word)) {
                    uniqueSelected.push(word);
                    seen.add(word.word);
                }
            }
            const updates = uniqueSelected.map(item => ({
                word: item.word, chinese: item.chinese,
                extraction_count: (item.extraction_count || 0) + 1,
                correct_count: item.correct_count || 0,
                wrong_count: item.wrong_count || 0,
                time: new Date().toISOString()
            }));
            setWords(prev => {
                const updated = { ...prev };
                updates.forEach(({ word, chinese, extraction_count, correct_count, wrong_count, time }) => {
                    updated[word] = { chinese, extraction_count, correct_count, wrong_count, time };
                });
                return updated;
            });
            setExtractedWords(uniqueSelected);
            setShowExtractDialog(true);
            setShowExtractOptionsDialog(false);
            setTimeout(async () => {
                await batchUpdateWordsData(updates, getToken, G_json);
                showMessage(`成功抽取${uniqueSelected.length}个单词`, 'success');
                setIntelligentPool(buildIntelligentPool(processedWords, 40));
            }, 500);
        } catch { showMessage('抽取失败', 'error'); } finally { setOperationLoading(false); }
    };

    const handleMark = async (word, isCorrect) => {
        const current = words[word];
        if (!current) return;
        const { chinese, extraction_count, correct_count, wrong_count } = parseWordData(current);
        const newCorrect = isCorrect ? (correct_count || 0) + 1 : correct_count || 0;
        const newWrong = !isCorrect ? (wrong_count || 0) + 1 : wrong_count || 0;
        setOperationLoading(true);
        try {
            setWords(prev => ({ ...prev, [word]: { chinese, extraction_count, correct_count: newCorrect, wrong_count: newWrong, time: new Date().toISOString() } }));
            await updateWordDataToServer(word, chinese, extraction_count, newCorrect, newWrong, new Date().toISOString(), getToken, G_json);
            showMessage(`已标记单词 "${word}" 为${isCorrect ? '正确' : '错误'}`, isCorrect ? 'success' : 'warning');
            setIntelligentPool(buildIntelligentPool(processedWords, 40));
        } catch { showMessage('更新失败', 'error'); } finally { setOperationLoading(false); }
    };

    const handleBatchMark = async (isCorrect) => {
        if (selectedWords.size === 0) return;
        setOperationLoading(true);
        try {
            const wordArray = Array.from(selectedWords);
            const updates = wordArray.map(word => {
                const { chinese, extraction_count, correct_count, wrong_count } = parseWordData(words[word]);
                return {
                    word, chinese, extraction_count,
                    correct_count: isCorrect ? (correct_count || 0) + 1 : correct_count || 0,
                    wrong_count: !isCorrect ? (wrong_count || 0) + 1 : wrong_count || 0,
                    time: new Date().toISOString()
                };
            });
            setWords(prev => {
                const updated = { ...prev };
                updates.forEach(({ word, chinese, extraction_count, correct_count, wrong_count, time }) => {
                    updated[word] = { chinese, extraction_count, correct_count, wrong_count, time };
                });
                return updated;
            });
            await batchUpdateWordsData(updates, getToken, G_json);
            setSelectedWords(new Set());
            showMessage(`已批量标记 ${wordArray.length} 个单词为${isCorrect ? '正确' : '错误'}`, isCorrect ? 'success' : 'warning');
            setIntelligentPool(buildIntelligentPool(processedWords, 40));
        } catch { showMessage('批量更新失败', 'error'); } finally { setOperationLoading(false); }
    };

    const handleOpenSingleDeleteDialog = (word) => {
        setWordToDelete(word);
        setShowSingleDeleteDialog(true);
    };

    const handleSingleDelete = async () => {
        if (!wordToDelete) return;
        setOperationLoading(true);
        try {
            const original = { ...words };
            delete original[wordToDelete];
            setWords(original);
            setSelectedWords(prev => { const next = new Set(prev); next.delete(wordToDelete); return next; });
            setShowSingleDeleteDialog(false);
            setWordToDelete(null);
            await deleteWordFromServer(wordToDelete, getToken, G_json);
            showMessage(`已删除单词 "${wordToDelete}"`, 'success');
            setIntelligentPool(buildIntelligentPool(processedWords, 40));
        } catch { showMessage('删除失败', 'error'); } finally { setOperationLoading(false); }
    };

    const handleDeleteSelected = async () => {
        if (selectedWords.size === 0) return;
        setOperationLoading(true);
        try {
            const wordArray = Array.from(selectedWords);
            const original = { ...words };
            wordArray.forEach(word => delete original[word]);
            setWords(original);
            setSelectedWords(new Set());
            setShowDeleteDialog(false);
            await batchDeleteWordsFromServer(wordArray, getToken, G_json);
            showMessage(`已删除 ${wordArray.length} 个单词`, 'success');
            setIntelligentPool(buildIntelligentPool(processedWords, 40));
        } catch { showMessage('批量删除失败', 'error'); } finally { setOperationLoading(false); }
    };

    const handleResetStats = async (word) => {
        setOperationLoading(true);
        try {
            setWords(prev => {
                const updated = { ...prev };
                if (updated[word]) updated[word] = { ...updated[word], correct_count: 0, wrong_count: 0, extraction_count: 0, time: new Date().toISOString() };
                return updated;
            });
            await resetWordStatsOnServer(word, getToken, G_json);
            setShowResetStatsDialog(false); setWordToReset(null);
            showMessage(`已重置单词 "${word}" 的统计信息`, 'success');
            setIntelligentPool(buildIntelligentPool(processedWords, 40));
        } catch { showMessage('重置统计失败', 'error'); } finally { setOperationLoading(false); }
    };

    const stats = useMemo(() => {
        if (!words || typeof words !== 'object') return { total: 0, mastered: 0, unmastered: 0, selected: selectedWords.size, overall_accuracy: 0, new_words_count: 0, pool_size: intelligentPool.length };
        let total = 0, mastered = 0, total_correct = 0, total_wrong = 0, new_words_count = 0;
        Object.values(words).forEach(wordData => {
            const { correct_count, wrong_count, is_mastered } = parseWordData(wordData);
            total++; if (is_mastered) mastered++;
            total_correct += correct_count || 0; total_wrong += wrong_count || 0;
            if ((correct_count || 0) + (wrong_count || 0) === 0) new_words_count++;
        });
        const total_tests = total_correct + total_wrong;
        return {
            total, mastered, unmastered: total - mastered, selected: selectedWords.size,
            overall_accuracy: total_tests > 0 ? Math.round((total_correct / total_tests) * 10000) / 100 : 0,
            new_words_count, pool_size: intelligentPool.length
        };
    }, [words, selectedWords, intelligentPool]);

    // 获取单个单词的统计信息
    const getWordStats = (word) => {
        const wordData = words[word];
        if (!wordData) return { extraction_count: 0, correct_count: 0, wrong_count: 0, total_tests: 0, accuracy: 0 };
        const { extraction_count, correct_count, wrong_count, total_tests, accuracy } = parseWordData(wordData);
        return { extraction_count, correct_count, wrong_count, total_tests, accuracy };
    };

    if (loading) return <Container sx={{ py: 4, textAlign: 'center' }}><CircularProgress /><Typography sx={{ mt: 2 }}>加载中...</Typography></Container>;

    return (
        <div style={{ 
            position: 'fixed', 
            top: '5%',  // 从10%改为5%，更靠上
            left: '10%',  // 从2.5%改为10%，左右更均衡
            width: '80vw',  // 从95vw改为80vw，更集中
            height: '85vh',  // 从90vh改为85vh，减少高度
            backgroundColor: 'white', 
            boxShadow: '0 0 30px rgba(0,0,0,0.4)', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column',
            zIndex: 1300
        }}>
            <Button 
                onClick={onClose} 
                sx={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px', 
                    minWidth: 'auto', 
                    zIndex: 1,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' }
                }}
            >
                ✕
            </Button>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>  {/* 减少padding */}
                <Container sx={{ py: 2 }}>  {/* 减少垂直padding */}
                    <Box sx={{ mb: 2 }}>  {/* 减少margin-bottom */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{G_json}.json ({stats.total}词)</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="contained" color="secondary" startIcon={<Shuffle />} size="small" onClick={() => setShowExtractOptionsDialog(true)} disabled={operationLoading || stats.pool_size < 5}>抽取 (池:{stats.pool_size})</Button>
                                <Button variant="outlined" startIcon={<Refresh />} size="small" onClick={loadWords} disabled={operationLoading}>刷新</Button>
                            </Box>
                        </Box>
                        <Paper sx={{ p: 1.5, mb: 1.5 }}>  {/* 减少内边距和外边距 */}
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                <Chip label={`已掌握: ${stats.mastered}`} color="success" size="small" icon={<CheckCircle fontSize="small" />} />
                                <Chip label={`未掌握: ${stats.unmastered}`} color="warning" size="small" icon={<Cancel fontSize="small" />} />
                                <Chip label={`正确率: ${stats.overall_accuracy}%`} color="info" size="small" icon={<TrendingUp fontSize="small" />} />
                                <Chip label={`新词: ${stats.new_words_count}`} color="primary" size="small" variant="outlined" />
                                {stats.selected > 0 && <><Chip label={`已选: ${stats.selected}`} color="primary" size="small" />
                                    <Button variant="outlined" color="error" size="small" startIcon={<Delete />} onClick={() => setShowDeleteDialog(true)}>删除选中</Button></>}
                            </Box>
                        </Paper>
                    </Box>

                    <Paper sx={{ p: 1.5, mb: 1.5 }}>  {/* 减少内边距 */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <TextField placeholder="搜索..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ width: 180 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                <InputLabel>掌握程度</InputLabel>
                                <Select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0); }} label="掌握程度">
                                    <MenuItem value="all">全部</MenuItem>
                                    <MenuItem value="mastered">已掌握</MenuItem>
                                    <MenuItem value="unmastered">未掌握</MenuItem>
                                </Select>
                            </FormControl>
                            <Typography variant="body2" color="text.secondary">共 {processedWords.length} 词</Typography>
                        </Box>
                    </Paper>

                    <Paper sx={{ overflow: 'hidden' }}>
                        <TableContainer sx={{ maxHeight: 400 }}>  {/* 减少表格高度 */}
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox" sx={{ py: 0.5 }}><Checkbox checked={paginatedWords.length > 0 && selectedWords.size === paginatedWords.length} indeterminate={selectedWords.size > 0 && selectedWords.size < paginatedWords.length} onChange={() => setSelectedWords(selectedWords.size === paginatedWords.length ? new Set() : new Set(paginatedWords.map(item => item.word)))} /></TableCell>
                                        <TableCell sx={{ py: 0.5 }}><TableSortLabel active={sortField === 'word'} direction={sortDirection} onClick={() => handleSort('word')}>单词</TableSortLabel></TableCell>
                                        <TableCell sx={{ py: 0.5 }}>中文</TableCell>
                                        <TableCell sx={{ py: 0.5 }}><TableSortLabel active={sortField === 'mastery'} onClick={() => handleSort('mastery')}>掌握</TableSortLabel></TableCell>
                                        <TableCell sx={{ py: 0.5 }}><TableSortLabel active={sortField === 'tests'} onClick={() => handleSort('tests')}>测试</TableSortLabel></TableCell>
                                        <TableCell sx={{ py: 0.5 }}><TableSortLabel active={sortField === 'extraction'} onClick={() => handleSort('extraction')}>抽取</TableSortLabel></TableCell>
                                        <TableCell sx={{ py: 0.5 }}><TableSortLabel active={sortField === 'accuracy'} onClick={() => handleSort('accuracy')}>正确率</TableSortLabel></TableCell>
                                        <TableCell sx={{ py: 0.5 }}><TableSortLabel active={sortField === 'lastReview'} onClick={() => handleSort('lastReview')}>最近学习</TableSortLabel></TableCell>
                                        <TableCell align="center" sx={{ py: 0.5 }}>操作</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedWords.length ? paginatedWords.map(item => (
                                        <TableRow key={item.word} hover selected={item.isSelected} sx={{ '& td': { py: 0.5 } }}>
                                            <TableCell padding="checkbox"><Checkbox checked={item.isSelected} onChange={() => setSelectedWords(prev => { const next = new Set(prev); next.has(item.word) ? next.delete(item.word) : next.add(item.word); return next; })} /></TableCell>
                                            <TableCell><Typography variant="body2" sx={{ fontWeight: 'medium' }}>{item.word}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{item.chinese}</Typography></TableCell>
                                            <TableCell><Tooltip title={`测试: ${item.correct_count}对/${item.wrong_count}错`}><Chip label={item.masteryInfo.label} size="small" color={item.masteryInfo.color} variant="outlined" icon={<Help fontSize="small" />} sx={{ height: 24 }} /></Tooltip></TableCell>
                                            <TableCell><Typography variant="body2">{item.total_tests}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{item.extraction_count}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" sx={{ color: item.accuracy >= 80 ? 'success.main' : item.accuracy >= 60 ? 'info.main' : item.accuracy >= 40 ? 'warning.main' : 'error.main' }}>{item.accuracy}%</Typography></TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTime fontSize="small" color="action" sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption">{item.timeAgo}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <IconButton size="small" onClick={() => { if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.word)); }}><VolumeUp fontSize="small" /></IconButton>
                                                    <IconButton size="small" onClick={() => handleMark(item.word, true)} color="success"><CheckCircle fontSize="small" /></IconButton>
                                                    <IconButton size="small" onClick={() => handleMark(item.word, false)} color="error"><Cancel fontSize="small" /></IconButton>
                                                    <IconButton size="small" onClick={() => { setWordToReset(item.word); setShowResetStatsDialog(true); }} color="warning"><Refresh fontSize="small" /></IconButton>
                                                    <IconButton size="small" onClick={() => handleOpenSingleDeleteDialog(item.word)} color="error"><Delete fontSize="small" /></IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={9} align="center"><Alert severity="info" sx={{ py: 1 }}>{Object.keys(words).length ? '没有匹配的单词' : '单词本为空'}</Alert></TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination 
                            rowsPerPageOptions={[5, 8, 10, 15]} 
                            component="div" 
                            count={processedWords.length} 
                            rowsPerPage={rowsPerPage} 
                            page={page} 
                            onPageChange={(e, p) => setPage(p)} 
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
                            sx={{ '.MuiTablePagination-select': { py: 0.5 } }}
                        />
                    </Paper>

                    {selectedWords.size > 0 && <Paper sx={{ p: 1, mt: 1, bgcolor: 'action.hover' }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="body2">已选 {selectedWords.size} 词</Typography><Box sx={{ display: 'flex', gap: 1 }}><Button size="small" startIcon={<CheckCircle />} onClick={() => handleBatchMark(true)}>正确</Button><Button size="small" startIcon={<Cancel />} onClick={() => handleBatchMark(false)}>错误</Button><Button size="small" color="error" startIcon={<Delete />} onClick={() => setShowDeleteDialog(true)}>删除</Button></Box></Box></Paper>}

                    {/* 抽取设置对话框 */}
                    <Dialog open={showExtractOptionsDialog} onClose={() => setShowExtractOptionsDialog(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>抽取设置</DialogTitle>
                        <DialogContent>
                            <Box sx={{ pt: 2 }}>
                                <Typography>抽取数量</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                    <TextField type="number" value={extractCount} onChange={(e) => setExtractCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 20)))} size="small" sx={{ width: 100 }} inputProps={{ min: 1, max: 100 }} />
                                    <Typography variant="body2">(1-100)</Typography>
                                </Box>
                                <Box sx={{ p: 2, mt: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Typography variant="body2"><strong>新单词优先</strong>: 优先抽取从未学习过的新单词</Typography>
                                </Box>
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                                    <Typography variant="subtitle2">当前状态</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        <Chip label={`抽取池: ${stats.pool_size}`} size="small" /><Chip label={`新词: ${stats.new_words_count}`} size="small" color="info" /><Chip label={`已掌握: ${stats.mastered}`} size="small" color="success" />
                                    </Box>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowExtractOptionsDialog(false)}>取消</Button>
                            <Button onClick={handleExtractRandomWords} variant="contained" color="secondary" disabled={operationLoading || stats.pool_size < extractCount}>{operationLoading ? '抽取中' : `抽取${Math.min(extractCount, stats.pool_size)}词`}</Button>
                        </DialogActions>
                    </Dialog>

                    {/* 抽取结果对话框 */}
                    <Dialog open={showExtractDialog} onClose={() => setShowExtractDialog(false)} maxWidth="md" fullWidth scroll="paper">
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">抽取结果 ({extractedWords.length}词)</Typography>
                                <Button variant="contained" onClick={() => { setShowExtractDialog(false); setShowWork(true); }}>开始测试</Button>
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            {calculateExtractionStats(extractedWords) && (
                                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mb: 1.5 }}>
                                    <Typography variant="subtitle2">统计:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Chip label={`新词: ${calculateExtractionStats(extractedWords).newWordsCount}`} size="small" color="info" />
                                        <Chip label={`平均正确率: ${calculateExtractionStats(extractedWords).avgAccuracy.toFixed(1)}%`} size="small" />
                                    </Box>
                                </Box>
                            )}
                            <List dense>
                                {extractedWords.map((item, index) => {
                                    const wordStats = getWordStats(item.word);
                                    return (
                                        <React.Fragment key={item.word}>
                                            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 0.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', mb: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 40 }}>
                                                        {index + 1}.
                                                    </Typography>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                        {item.word}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {item.chinese}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 5 }}>
                                                    <Chip size="small" label={`抽取: ${wordStats.extraction_count}次`} variant="outlined" icon={<Shuffle fontSize="small" />} sx={{ height: 24 }} />
                                                    <Chip size="small" label={`测试: ${wordStats.total_tests}次`} variant="outlined" icon={<AccessTime fontSize="small" />} sx={{ height: 24 }} />
                                                    <Chip size="small" label={`正确: ${wordStats.correct_count}`} variant="outlined" color="success" sx={{ height: 24 }} />
                                                    <Chip size="small" label={`错误: ${wordStats.wrong_count}`} variant="outlined" color="error" sx={{ height: 24 }} />
                                                    <Chip size="small" label={`正确率: ${wordStats.accuracy}%`} variant="outlined" color={wordStats.accuracy >= 80 ? 'success' : wordStats.accuracy >= 60 ? 'warning' : 'error'} sx={{ height: 24 }} />
                                                </Box>
                                            </ListItem>
                                            {index < extractedWords.length - 1 && <Divider />}
                                        </React.Fragment>
                                    );
                                })}
                            </List>
                        </DialogContent>
                    </Dialog>

                    {/* 批量删除确认对话框 */}
                    <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogContent>
                            <Typography>确定删除选中的 {selectedWords.size} 个单词？此操作不可撤销。</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowDeleteDialog(false)}>取消</Button>
                            <Button onClick={handleDeleteSelected} color="error" variant="contained">确认删除</Button>
                        </DialogActions>
                    </Dialog>

                    {/* 单个删除确认对话框 */}
                    <Dialog open={showSingleDeleteDialog} onClose={() => setShowSingleDeleteDialog(false)}>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogContent>
                            <Typography>确定删除单词 <strong>“{wordToDelete}”</strong>？此操作不可撤销。</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowSingleDeleteDialog(false)}>取消</Button>
                            <Button onClick={handleSingleDelete} color="error" variant="contained">确认删除</Button>
                        </DialogActions>
                    </Dialog>

                    {/* 重置统计对话框 */}
                    <Dialog open={showResetStatsDialog} onClose={() => setShowResetStatsDialog(false)}>
                        <DialogTitle>重置统计</DialogTitle>
                        <DialogContent>
                            <Typography>重置 “{wordToReset}” 的统计信息？所有学习记录将被清除。</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowResetStatsDialog(false)}>取消</Button>
                            <Button onClick={() => handleResetStats(wordToReset)} color="warning" variant="contained">确认重置</Button>
                        </DialogActions>
                    </Dialog>

                    <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        <MuiAlert severity={snackbar.severity}>{snackbar.message}</MuiAlert>
                    </Snackbar>

                    <ListeningFinalMaster open={showWork} onClose={() => setShowWork(false)} wordData={extractedWords.length ? convertExtractedWordsToTestFormat(extractedWords) : null} targetFile_1={G_json} />
                </Container>
            </div>
        </div>
    );
};

export default SimpleWordBook;