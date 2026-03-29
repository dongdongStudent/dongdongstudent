import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
  DataArray as DataArrayIcon,
  TableChart as TableChartIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { readingApi } from './api';

const FileBrowserView = ({ onFileSelect }) => {
  // ========== 状态管理 ==========
  const [jsonFiles, setJsonFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 文件内容查看
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  
  // 搜索和过滤
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' 或 'grid'
  const [activeTab, setActiveTab] = useState(0); // 0: 所有文件, 1: 已加载, 2: 未加载
  
  // JSON文件选择
  const [selectedJsonFileId, setSelectedJsonFileId] = useState('');
  
  // 文件统计
  const [stats, setStats] = useState({
    total: 0,
    loaded: 0,
    unloaded: 0,
    totalPassages: 0,
    totalQuestions: 0
  });

  // ========== 初始化加载 ==========
  useEffect(() => {
    loadFiles();
  }, []);

  // ========== 搜索过滤 ==========
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFiles(jsonFiles);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = jsonFiles.filter(file => 
      (file.name && file.name.toLowerCase().includes(term)) ||
      (file.fileName && file.fileName.toLowerCase().includes(term)) ||
      (file.id && file.id.toLowerCase().includes(term))
    );
    setFilteredFiles(filtered);
  }, [searchTerm, jsonFiles]);

  // ========== 加载文件列表 ==========
  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await readingApi.getJsonFiles();
      console.log('文件列表响应:', res);
      
      if (res?.flag === 1 && res.content?.files) {
        const files = res.content.files.map(file => ({
          ...file,
          fileName: file.fileName || `${file.id}.json`,
          name: file.name || file.id,
          loaded: false // 初始状态，实际应该从其他地方获取
        }));
        
        setJsonFiles(files);
        setFilteredFiles(files);
        
        // 更新统计信息
        updateStats(files);
        
        setSuccess(`成功加载 ${files.length} 个文件`);
      } else {
        setError('获取文件列表失败：' + (res?.message || '未知错误'));
        // 使用示例数据
        const sampleFiles = [
          { id: 'reading_comprehension_master', name: '阅读理解主题库', fileName: 'reading_comprehension_master.json', loaded: true, passages: 50, questions: 500 },
          { id: 'ichiro_story', name: 'Ichiro and the Sun', fileName: 'ichiro_story.json', loaded: true, passages: 10, questions: 100 },
          { id: 'science_passages', name: '科学文章', fileName: 'science_passages.json', loaded: false },
          { id: 'history_passages', name: '历史文章', fileName: 'history_passages.json', loaded: false },
          { id: 'literature_passages', name: '文学作品', fileName: 'literature_passages.json', loaded: false },
          { id: 'business_passages', name: '商业文章', fileName: 'business_passages.json', loaded: false },
          { id: 'technology_passages', name: '技术文章', fileName: 'technology_passages.json', loaded: false },
          { id: 'health_passages', name: '健康文章', fileName: 'health_passages.json', loaded: false }
        ];
        setJsonFiles(sampleFiles);
        setFilteredFiles(sampleFiles);
        updateStats(sampleFiles);
      }
    } catch (err) {
      console.error('加载文件失败:', err);
      setError('加载文件失败：' + err.message);
      // 使用示例数据作为回退
      const sampleFiles = [
        { id: 'reading_comprehension_master', name: '阅读理解主题库', fileName: 'reading_comprehension_master.json', loaded: true, passages: 50, questions: 500 },
        { id: 'ichiro_story', name: 'Ichiro and the Sun', fileName: 'ichiro_story.json', loaded: true, passages: 10, questions: 100 }
      ];
      setJsonFiles(sampleFiles);
      setFilteredFiles(sampleFiles);
      updateStats(sampleFiles);
    } finally {
      setLoading(false);
    }
  };

  // ========== 更新统计信息 ==========
  const updateStats = (files) => {
    const total = files.length;
    const loaded = files.filter(f => f.loaded).length;
    const unloaded = total - loaded;
    
    let totalPassages = 0;
    let totalQuestions = 0;
    
    files.forEach(file => {
      if (file.passages) totalPassages += file.passages;
      if (file.questions) totalQuestions += file.questions;
    });
    
    setStats({
      total,
      loaded,
      unloaded,
      totalPassages,
      totalQuestions
    });
  };

  // ========== 查看文件内容 ==========
  const handleViewFile = async (file) => {
    setSelectedFile(file);
    setContentLoading(true);
    setContentDialogOpen(true);
    
    try {
      const res = await readingApi.getJsonContent(file.fileName);
      console.log('文件内容响应:', res);
      
      if (res?.flag === 1 && res.content) {
        setFileContent(res.content);
      } else {
        setFileContent({ error: res?.message || '获取内容失败' });
      }
    } catch (err) {
      console.error('获取文件内容失败:', err);
      setFileContent({ error: err.message });
    } finally {
      setContentLoading(false);
    }
  };

  // ========== 处理JSON文件选择 ==========
  const handleJsonFileSelect = async (fileId) => {
    setSelectedJsonFileId(fileId);
    const selectedFile = jsonFiles.find(file => file.id === fileId);
    if (selectedFile) {
      // 加载文件内容并在界面上显示文章列表
      await loadFileContent(selectedFile);
    }
  };

  // ========== 加载文件内容并在界面上显示 ==========
  const loadFileContent = async (file) => {
    setSelectedFile(file);
    setContentLoading(true);
    
    try {
      const res = await readingApi.getJsonContent(file.fileName);
      console.log('文件内容响应:', res);
      
      if (res?.flag === 1 && res.content) {
        setFileContent(res.content);
        setSuccess(`成功加载文件: ${file.name}`);
      } else {
        setFileContent({ error: res?.message || '获取内容失败' });
        setError('获取文件内容失败：' + (res?.message || '未知错误'));
      }
    } catch (err) {
      console.error('获取文件内容失败:', err);
      setFileContent({ error: err.message });
      setError('获取文件内容失败：' + err.message);
    } finally {
      setContentLoading(false);
    }
  };

  // ========== 关闭内容对话框 ==========
  const handleCloseContentDialog = () => {
    setContentDialogOpen(false);
    setSelectedFile(null);
    setFileContent(null);
  };

  // ========== 刷新文件列表 ==========
  const handleRefresh = () => {
    loadFiles();
  };

  // ========== 切换视图模式 ==========
  const handleToggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  // ========== 处理标签页切换 ==========
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    let filtered = jsonFiles;
    if (newValue === 1) {
      filtered = jsonFiles.filter(file => file.loaded);
    } else if (newValue === 2) {
      filtered = jsonFiles.filter(file => !file.loaded);
    }
    
    setFilteredFiles(filtered);
  };

  // ========== 渲染文件内容 ==========
  const renderFileContent = () => {
    if (contentLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      );
    }
    
    if (!fileContent) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">无内容</Typography>
        </Box>
      );
    }
    
    if (fileContent.error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          加载失败: {fileContent.error}
        </Alert>
      );
    }
    
    return (
      <Box>
        {/* 文件信息摘要 */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">文件名</Typography>
              <Typography variant="body1">{selectedFile?.fileName}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">文件ID</Typography>
              <Typography variant="body1">{selectedFile?.id}</Typography>
            </Grid>
            {fileContent.passages && (
              <>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">篇章数量</Typography>
                  <Typography variant="body1">{fileContent.passages.length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">内容部分</Typography>
                  <Typography variant="body1">
                    {fileContent.passages.reduce((total, passage) => 
                      total + (passage.content?.length || 0), 0)} 个部分
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
        
        {/* 文章列表 */}
        <Typography variant="h6" gutterBottom>文章列表</Typography>
        
        {fileContent.passages ? (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <List>
              {fileContent.passages.map((passage, index) => (
                <React.Fragment key={passage.id || index}>
                  <ListItem 
                    button
                    onClick={() => {
                      if (onFileSelect && selectedFile) {
                        onFileSelect(selectedFile, passage.id);
                        setContentDialogOpen(false);
                      }
                    }}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(26, 35, 126, 0.05)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <DescriptionIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {passage.title || `文章 ${index + 1}`}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={`难度 ${passage.difficulty || '未知'}`} 
                            color={
                              passage.difficulty === 1 || passage.difficulty === 'easy' ? 'success' :
                              passage.difficulty === 2 || passage.difficulty === 'medium' ? 'warning' :
                              passage.difficulty === 3 || passage.difficulty === 'hard' ? 'error' : 'default'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {passage.category || '未分类'} · {passage.content?.length || 0} 个内容部分 · {passage.images?.length || 0} 张图片
                          </Typography>
                          {passage.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {passage.description.length > 100 
                                ? `${passage.description.substring(0, 100)}...` 
                                : passage.description}
                            </Typography>
                          )}
                          {passage.content && passage.content.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              内容预览: {passage.content[0]?.text?.substring(0, 80) || '无文本内容'}...
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="开始学习">
                        <IconButton 
                          edge="end"
                          onClick={() => {
                            if (onFileSelect && selectedFile) {
                              onFileSelect(selectedFile, passage.id);
                              setContentDialogOpen(false);
                            }
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < fileContent.passages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              无篇章数据或数据结构不同
            </Typography>
            <pre style={{ 
              fontSize: '12px', 
              overflow: 'auto', 
              maxHeight: '300px',
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px'
            }}>
              {JSON.stringify(fileContent, null, 2)}
            </pre>
          </Paper>
        )}
      </Box>
    );
  };

  // ========== 渲染文件列表项（列表视图） ==========
  const renderFileListItem = (file, index) => (
    <React.Fragment key={file.id || index}>
      <ListItem 
        sx={{ 
          bgcolor: file.loaded ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
        }}
      >
        <ListItemIcon>
          {file.loaded ? (
            <CheckCircleIcon color="success" />
          ) : (
            <DescriptionIcon color="action" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                {file.name}
              </Typography>
              {file.loaded && (
                <Chip 
                  label="已加载" 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary">
                {file.fileName}
              </Typography>
              {file.passages && (
                <Typography variant="caption" color="text.secondary">
                  包含 {file.passages} 个篇章 · {file.questions || 0} 道题目
                </Typography>
              )}
            </Box>
          }
        />
        <ListItemSecondaryAction>
          <Tooltip title="查看文章列表">
            <IconButton 
              onClick={() => handleViewFile(file)}
              color="primary"
            >
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="查看内容">
            <IconButton onClick={() => handleViewFile(file)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刷新状态">
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </ListItem>
      {index < filteredFiles.length - 1 && <Divider />}
    </React.Fragment>
  );

  // ========== 渲染文件卡片（网格视图） ==========
  const renderFileCard = (file, index) => (
    <Grid item xs={12} sm={6} md={4} key={file.id || index}>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: file.loaded ? '2px solid #4caf50' : '1px solid #e0e0e0'
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {file.loaded ? (
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            ) : (
              <DescriptionIcon color="action" sx={{ mr: 1 }} />
            )}
            <Typography variant="h6" component="div" noWrap>
              {file.name}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {file.fileName}
          </Typography>
          
          {file.passages && (
            <Box sx={{ mt: 2 }}>
              <Chip 
                icon={<TableChartIcon />} 
                label={`${file.passages} 篇章`} 
                size="small" 
                sx={{ mr: 1, mb: 1 }}
              />
              <Chip 
                icon={<DataArrayIcon />} 
                label={`${file.questions || 0} 题目`} 
                size="small" 
              />
            </Box>
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            最后更新: {file.lastUpdated || '未知'}
          </Typography>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button 
            size="small" 
            startIcon={<PlayArrowIcon />}
            onClick={() => handleViewFile(file)}
            color="primary"
            variant="contained"
          >
            查看文章
          </Button>
          <Box>
            <Button 
              size="small" 
              startIcon={<VisibilityIcon />}
              onClick={() => handleViewFile(file)}
            >
              查看
            </Button>
          </Box>
        </CardActions>
      </Card>
    </Grid>
  );

  // ========== 渲染统计卡片 ==========
  const renderStatsCard = (title, value, icon, color) => (
    <Card sx={{ bgcolor: color, color: 'white' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2">
              {title}
            </Typography>
          </Box>
          {icon}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 简洁标题 */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#1a237e' }}>
        English A-Z 阅读学习
      </Typography>

      {/* 左右布局 */}
      <Grid container spacing={3}>
        {/* 左侧：JSON选择 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6">
                JSON文件选择
              </Typography>
            </Box>
            
            <Box sx={{ p: 2 }}>
              {/* JSON文件选择下拉菜单 */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>选择JSON文件</InputLabel>
                <Select
                  value={selectedJsonFileId}
                  onChange={(e) => handleJsonFileSelect(e.target.value)}
                  label="选择JSON文件"
                >
                  <MenuItem value="">
                    <em>请选择一个JSON文件</em>
                  </MenuItem>
                  {jsonFiles.map(file => (
                    <MenuItem key={file.id} value={file.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon fontSize="small" />
                        <Typography variant="body1">{file.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* 简单文件列表 */}
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                可用文件 ({filteredFiles.length})
              </Typography>
              
              <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <List dense>
                  {filteredFiles.map((file, index) => (
                    <ListItem 
                      key={file.id || index}
                      button
                      selected={selectedJsonFileId === file.id}
                      onClick={() => handleJsonFileSelect(file.id)}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'rgba(26, 35, 126, 0.08)',
                          '&:hover': {
                            bgcolor: 'rgba(26, 35, 126, 0.12)'
                          }
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {file.loaded ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <DescriptionIcon color="action" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {file.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {file.fileName}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
              
              {/* 加载状态 */}
              {loading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                    加载中...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* 右侧：文章列表 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6">
                {selectedFile ? `文章列表 - ${selectedFile.name}` : '文章列表'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedFile ? '选择文章开始学习' : '请先选择JSON文件'}
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
              {selectedFile && fileContent ? (
                renderFileContent()
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="h6" gutterBottom color="text.secondary">
                    未选择文件
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    请在左侧选择一个JSON文件
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 文件内容对话框 */}
      <Dialog
        open={contentDialogOpen}
        onClose={handleCloseContentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon />
            <Typography variant="h6">
              {selectedFile?.name || '文件内容'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderFileContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContentDialog}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 成功提示 */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileBrowserView;
