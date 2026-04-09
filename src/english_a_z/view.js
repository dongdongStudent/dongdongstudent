import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  School as SchoolIcon,
  LibraryBooks as LibraryBooksIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';

const FileBrowserView = ({ 
  files = [],
  onFileSelect,
  onArticleSelect,
  loading = false,
  searchTerm = '',
  onSearchChange,
  selectedFile = null,
  fileContent = null,
  contentLoading = false
}) => {
  
  // 渲染文件列表
  const renderFileList = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (files.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            暂无学习材料
          </Typography>
        </Box>
      );
    }
    
    return (
      <List>
        {files.map((file, index) => (
          <React.Fragment key={file.id || index}>
            <ListItem 
              button
              onClick={() => onFileSelect && onFileSelect(file)}
              sx={{ 
                bgcolor: selectedFile?.id === file.id ? 'rgba(26, 35, 126, 0.08)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(26, 35, 126, 0.05)' }
              }}
            >
              <ListItemIcon>
                <LibraryBooksIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" fontWeight="medium">
                    {file.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {file.description}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="查看内容">
                  <IconButton edge="end" onClick={() => onFileSelect && onFileSelect(file)}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
            {index < files.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  // 渲染文件总体介绍
  const renderFileIntroduction = () => {
    if (!fileContent) return null;
    
    return (
      <Card sx={{ mb: 2, bgcolor: '#e3f2fd', border: '1px solid #bbdefb' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <MenuBookIcon sx={{ color: '#1a237e', mr: 1 }} />
            <Typography variant="h6" color="primary">
              {fileContent.name || selectedFile?.name || '学习材料'}
            </Typography>
          </Box>
          
          {fileContent.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {fileContent.description}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<LibraryBooksIcon />} 
              label={`共 ${fileContent.passages?.length || 0} 篇文章`} 
              size="small"
              color="primary"
              variant="outlined"
            />
            {fileContent.totalQuestions !== undefined && (
              <Chip 
                label={`${fileContent.totalQuestions} 道题目`} 
                size="small"
                variant="outlined"
              />
            )}
            {fileContent.level && (
              <Chip 
                label={`难度: ${fileContent.level === 'beginner' ? '初级' : fileContent.level === 'intermediate' ? '中级' : '高级'}`} 
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染文章列表
  const renderArticleList = () => {
    if (contentLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!selectedFile) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="text.secondary">
            未选择学习材料
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请从左侧选择一个学习材料
          </Typography>
        </Box>
      );
    }
    
    if (!fileContent?.passages || fileContent.passages.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            该学习材料没有可用的文章数据
          </Typography>
        </Box>
      );
    }
    
    return (
      <>
        {/* 文件总体介绍 */}
        {renderFileIntroduction()}
        
        {/* 文章列表标题 */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: '#1a237e' }}>
          📖 文章列表
        </Typography>
        
        <List>
          {fileContent.passages.map((passage, index) => (
            <React.Fragment key={passage.id || index}>
              <ListItem 
                button
                onClick={() => onArticleSelect && onArticleSelect(selectedFile, passage.id)}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {passage.title || `文章 ${index + 1}`}
                      </Typography>
                      {passage.difficulty && (
                        <Chip 
                          size="small" 
                          label={`难度 ${passage.difficulty === 1 ? '简单' : passage.difficulty === 2 ? '中等' : passage.difficulty === 3 ? '困难' : passage.difficulty}`} 
                          color={
                            passage.difficulty === 1 ? 'success' :
                            passage.difficulty === 2 ? 'warning' :
                            passage.difficulty === 3 ? 'error' : 'default'
                          }
                          variant="outlined"
                        />
                      )}
                      {passage.category && (
                        <Chip 
                          size="small" 
                          label={passage.category} 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {passage.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {passage.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {passage.content?.length || 0} 个学习部分
                        {passage.totalQuestions > 0 && ` · ${passage.totalQuestions} 道题目`}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="开始学习">
                    <IconButton 
                      edge="end"
                      onClick={() => onArticleSelect && onArticleSelect(selectedFile, passage.id)}
                      color="primary"
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              {index < fileContent.passages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </>
    );
  };
  
  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100%' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#1a237e' }}>
        📚 English A-Z 阅读学习
      </Typography>

      <Grid container spacing={3}>
        {/* 左侧：文件列表 */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6">
                📁 学习材料列表
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="🔍 搜索材料..."
                value={searchTerm}
                onChange={onSearchChange}
                sx={{ mt: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              {renderFileList()}
            </Box>
          </Paper>
        </Grid>
        
        {/* 右侧：文章列表 */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6">
                {selectedFile ? (fileContent?.name || selectedFile.name || '文章列表') : '📖 文章列表'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedFile ? '选择文章开始学习' : '请从左侧选择学习材料'}
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              {renderArticleList()}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FileBrowserView;