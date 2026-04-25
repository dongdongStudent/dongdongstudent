import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Switch, FormControlLabel, Box, Typography } from '@mui/material';
import { message } from 'antd';
import { F_translator, F_speak } from '../Function/weisimin.js';
import { getToken } from '../config.js';
import { F_get_words_study } from '../word/wordReviewUtils.js';
import { sentenceApi } from '../sentence/api.js';
import VocabularyMaster from '../word/workStudy.js';
import WordBook from '../word/wordReviewBook.js';
import SentenceCenter from '../sentence/review_center.js';
import { DraggableDialog, CompactTranslator, FullTranslator } from './components.js';
import { getWordCount, isSingleWord, splitTextIntoSentences, isShortText } from './utils.js';

const WordTranslator = forwardRef(({
  open,
  onClose,
  word: initialWord = '',
  G_word_name = 'word_reading_study',
  onWordChange,
  autoSpeak: propAutoSpeak = true,
  getToken: propGetToken,
  defaultCompact = true,
}, ref) => {
  
  const [word, setWord] = useState(initialWord);
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wordInput, setWordInput] = useState(''); // 上方独立的单词输入框
  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('translator_compact');
    return saved !== null ? JSON.parse(saved) : defaultCompact;
  });
  const [existingWords, setExistingWords] = useState([]);
  const [existingWordsData, setExistingWordsData] = useState([]); // 存储完整的单词数据
  const [addingWord, setAddingWord] = useState(false);
  const [addingSentence, setAddingSentence] = useState(false);
  const [showVocabMaster, setShowVocabMaster] = useState(false);
  const [showWordBook, setShowWordBook] = useState(false);
  const [showSentenceCenter, setShowSentenceCenter] = useState(false);
  const [vocabKey, setVocabKey] = useState(0);
  
  // 存储拆分后的句子列表
  const [sentenceList, setSentenceList] = useState([]);
  // 记录上一次的 initialWord，用于比较变化
  const prevInitialWordRef = useRef(initialWord);
  // 添加一个强制刷新计数器
  const [refreshKey, setRefreshKey] = useState(0);

  // 添加本地 autoSpeak 状态，用于控制 Switch
  const [autoSpeak, setAutoSpeak] = useState(propAutoSpeak);
  
  // 同步外部 prop 变化
  useEffect(() => {
    setAutoSpeak(propAutoSpeak);
  }, [propAutoSpeak]);

  // 翻译函数 - 使用本地 autoSpeak
  const translateWord = useCallback(async (wordToTranslate, shouldSpeak = true) => {
    if (!wordToTranslate?.trim()) { 
      setError('请输入要翻译的内容'); 
      return; 
    }
    const cleanedWord = wordToTranslate.trim();
    setLoading(true);
    setError(null);
    try {
      if (shouldSpeak && autoSpeak) F_speak(cleanedWord);
      const result = await F_translator(cleanedWord);
      if (result) {
        setTranslation(result);
        setWord(cleanedWord);
        onWordChange?.({ 
          word: cleanedWord, 
          translation: result, 
          source: 'translator', 
          isPhrase: !isSingleWord(cleanedWord) 
        });
      } else { 
        setError('未找到翻译结果'); 
        setTranslation(null);
      }
    } catch (err) { 
      setError('翻译失败，请稍后重试'); 
      setTranslation(null);
    } finally { 
      setLoading(false);
    }
  }, [onWordChange, autoSpeak]);

  // 核心函数：根据文本更新所有相关状态
  const updateContent = useCallback((text, shouldTranslate = true) => {
    if (!text || !text.trim()) {
      setSentenceList([]);
      setWordInput('');
      setTranslation(null);
      setError(null);
      return;
    }
    
    const trimmedText = text.trim();
    
    // 拆分句子
    const sentences = splitTextIntoSentences(trimmedText);
    
    setSentenceList(sentences);
    
    // 如果是完整模式，不清空单词输入框
    if (!isCompact && sentences.length > 0) {
      // 完整模式下，不自动设置单词输入框，保持用户输入的内容
    } else if (sentences.length > 0) {
      // 简洁模式下，设置第一句到输入框
      const firstSentence = sentences[0];
      setWordInput(firstSentence);
      
      // 如果需要翻译，翻译第一句
      if (shouldTranslate) {
        translateWord(firstSentence, true);
      }
    } else {
      if (shouldTranslate) {
        translateWord(trimmedText, true);
      }
    }
    
    // 强制刷新组件
    setRefreshKey(prev => prev + 1);
  }, [translateWord, isCompact]);

  // 当 initialWord 变化时，更新所有内容
  useEffect(() => {
    // 检查 initialWord 是否真的发生了变化
    if (initialWord !== prevInitialWordRef.current) {
      prevInitialWordRef.current = initialWord;
      
      if (initialWord && initialWord.trim()) {
        updateContent(initialWord, true);
      } else {
        // 如果 initialWord 为空，清空所有
        setSentenceList([]);
        setWordInput('');
        setTranslation(null);
        setError(null);
      }
    }
  }, [initialWord, updateContent]);

  // 当 open 变为 true 且有内容时，也检查一次
  useEffect(() => {
    if (open && initialWord && initialWord.trim()) {
      // 避免重复更新（如果内容没变）
      if (initialWord !== prevInitialWordRef.current) {
        prevInitialWordRef.current = initialWord;
        updateContent(initialWord, true);
      }
    }
  }, [open, initialWord, updateContent]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    translateText: (text) => {
      if (text?.trim()) { 
        updateContent(text, true);
        return true;
      }
      return false;
    },
    getCurrentWord: () => wordInput,
    clearTranslation: () => { 
      setWordInput(''); 
      setTranslation(null); 
      setError(null);
      setSentenceList([]);
    },
    setAndTranslate: (text) => { 
      if (text?.trim()) { 
        updateContent(text, true);
        return true;
      } 
      return false;
    },
    getSentenceList: () => sentenceList,
    updateSentenceList: (text) => {
      if (text && text.trim()) {
        updateContent(text, true);
        return sentenceList;
      }
      return [];
    },
    getSentenceCount: () => sentenceList.length,
    refresh: () => {
      if (initialWord && initialWord.trim()) {
        updateContent(initialWord, true);
      }
    }
  }));

  const getTokenValue = () => propGetToken ? propGetToken() : getToken();

  // 重置单词熟练度
  const resetWordStatus = async (wordText, token) => {
    try {
      // 获取当前单词的完整数据
      const wordsData = await F_get_words_study(token, G_word_name);
      const existingWord = wordsData.find(w => w.word.toLowerCase() === wordText.toLowerCase());
      
      if (!existingWord) {
        return false;
      }
      
      // 重置所有模式的状态为 false
      const resetStatus = {
        reading: false,
        translation: false,
        listening: false,
        pronunciation: false,
        spelling: false
      };
      
      // 更新单词状态
      const updatedWord = { ...existingWord, status: resetStatus };
      
      // 找到该单词在列表中的索引并替换
      const updatedWordsData = wordsData.map(w =>
        w.word.toLowerCase() === wordText.toLowerCase() ? updatedWord : w
      );
      
      // 同步到服务器
      const syncRes = await fetch(`https://www.ddstudent.xyz/server/english/update_words_study/${G_word_name}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': token 
        },
        body: JSON.stringify({ 
          type: 'sync_progress', 
          vocabularyData: updatedWordsData 
        })
      });
      
      const syncData = await syncRes.json();
      
      if (syncData.flag === 1) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const fetchExistingWords = useCallback(async () => {
    const token = getTokenValue();
    if (!token) return;
    try { 
      const words = await F_get_words_study(token, G_word_name) || [];
      // 存储完整的单词数据
      setExistingWordsData(words);
      // 存储单词文本列表用于快速检查
      const normalized = words.map(w => {
        if (typeof w === 'string') return w.toLowerCase();
        if (w && typeof w === 'object') return (w.word || w.text || '').toLowerCase();
        return '';
      }).filter(w => w);
      setExistingWords(normalized);
    } catch { 
      setExistingWords([]);
      setExistingWordsData([]);
    }
  }, [G_word_name]);

  useEffect(() => { 
    if (open) fetchExistingWords(); 
  }, [open, fetchExistingWords]);
  
  useEffect(() => { 
    localStorage.setItem('translator_compact', JSON.stringify(isCompact)); 
  }, [isCompact]);

  const handleSpeak = (wordToSpeak) => { 
    if (wordToSpeak) F_speak(wordToSpeak); 
  };

  // 添加单词（使用上方的独立输入框）- 修改为：如果单词已存在则重置熟练度
  const handleAddWord = async () => {
    const text = wordInput;
    
    if (!text?.trim()) { 
      message.warning('请输入单词或短语'); 
      return; 
    }
    
    const wordCount = getWordCount(text);
    if (wordCount > 3) { 
      message.warning('单词最多支持3个单词的短语'); 
      return; 
    }
    
    const trimmedWord = text.trim().toLowerCase();
    const token = getTokenValue();
    
    if (!token) { 
      message.warning('请先登录'); 
      return; 
    }
    
    // 检查是否已存在
    if (existingWords.includes(trimmedWord)) {
      // 单词已存在，重置熟练度
      message.info(`"${trimmedWord}" 已存在，正在重置熟练度...`);
      setAddingWord(true);
      
      try {
        const resetSuccess = await resetWordStatus(trimmedWord, token);
        
        if (resetSuccess) {
          message.success(`"${trimmedWord}" 的【英/中/听/读/拼】熟练度已全部重置，可以重新学习了`);
          // 刷新单词列表
          await fetchExistingWords();
          // 可选：触发回调通知父组件
          onWordChange?.({ 
            word: trimmedWord, 
            action: 'reset', 
            source: 'translator', 
            isPhrase: !isSingleWord(trimmedWord), 
            target: G_word_name 
          });
        } else {
          message.error(`重置 "${trimmedWord}" 熟练度失败，请重试`);
        }
      } catch (error) {
        message.error("重置失败，请重试");
      } finally {
        setAddingWord(false);
      }
      return;
    }
    
    // 单词不存在，正常添加
    setAddingWord(true);
    
    try {
      const res = await fetch(`https://www.ddstudent.xyz/server/english/update_words_study/${G_word_name}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': token 
        },
        body: JSON.stringify({ 
          type: 'add', 
          word: trimmedWord 
        })
      });
      
      const data = await res.json();
      
      if (data.flag === 1) {
        message.success(`"${trimmedWord}" 添加成功`);
        await fetchExistingWords();
        onWordChange?.({ 
          word: trimmedWord, 
          action: 'added', 
          source: 'translator', 
          isPhrase: !isSingleWord(trimmedWord), 
          target: G_word_name 
        });
      } else {
        message.error(data.msg || "添加失败");
      }
      
    } catch (error) {
      message.error("网络异常，请重试");
    } finally {
      setAddingWord(false);
    }
  };

  // 添加句子
  const handleAddSentence = async (text, translationText) => {
    if (!text?.trim()) { 
      message.warning('请输入句子'); 
      return; 
    }
    
    const trimmedText = text.trim();
    
    // 检查是否为单词（没有空格且长度较短，或者只包含字母）
    const isWord = !trimmedText.includes(' ') && 
                   /^[a-zA-Z]+$/.test(trimmedText) && 
                   trimmedText.length <= 20;
    
    if (isWord) {
      message.warning('只能添加句子，不能添加单词，请输入完整的句子');
      return;
    }
    
    const token = getTokenValue();
    
    if (!token) { 
      message.warning('请先登录'); 
      return; 
    }
    
    // 获取翻译
    let finalTranslation = translationText;
    if (!finalTranslation) {
      setAddingSentence(true);
      try {
        const result = await F_translator(trimmedText);
        if (result) {
          finalTranslation = typeof result === 'string' ? result : result?.basic?.explains?.join('；');
        } else {
          message.warning('无法获取句子翻译');
          setAddingSentence(false);
          return;
        }
      } catch (err) {
        message.warning('无法获取句子翻译');
        setAddingSentence(false);
        return;
      }
    }
    
    setAddingSentence(true);
    
    try {
      const result = await sentenceApi.addSentence({
        text: trimmedText, 
        chinese: finalTranslation, 
        pass: false, 
        correct_count: 0, 
        wrong_count: 0,
        extraction_count: 0, 
        last_answer_time: new Date().toISOString(), 
        time: new Date().toISOString()
      }, 'sentences');
      
      if (result?.flag === 1) { 
        message.success(`句子添加成功`); 
      } else {
        throw new Error(result?.message || '添加失败');
      }
    } catch (err) { 
      message.warning(`添加失败: ${err.message}`); 
    } finally { 
      setAddingSentence(false); 
    }
  };

  // 关闭子组件并刷新单词列表
  const handleCloseVocabMaster = useCallback(() => {
    setShowVocabMaster(false);
    fetchExistingWords();
  }, [fetchExistingWords]);

  const handleCloseWordBook = useCallback(() => {
    setShowWordBook(false);
    fetchExistingWords();
  }, [fetchExistingWords]);

  const handleCloseSentenceCenter = useCallback(() => {
    setShowSentenceCenter(false);
  }, []);

  const shouldShowTranslator = open && !showVocabMaster && !showWordBook && !showSentenceCenter;

  return (
    <>
      {/* 主翻译弹窗 */}
      {shouldShowTranslator && (
        <DraggableDialog 
          open={true} 
          onClose={onClose} 
          isCompact={isCompact} 
          title="翻译" 
          onToggleMode={() => setIsCompact(!isCompact)} 
          onAddWord={handleAddWord}
          onAddSentence={() => handleAddSentence(wordInput, translation)}
          autoSpeak={autoSpeak}
          onAutoSpeakChange={setAutoSpeak}
        >
          {isCompact ? (
            <CompactTranslator 
              key={refreshKey}
              word={word} 
              translation={translation} 
              loading={loading} 
              error={error} 
              onSearch={translateWord} 
              onSpeak={handleSpeak} 
              wordInput={wordInput} 
              setWordInput={setWordInput}
              onAddWord={handleAddWord}
              onAddSentence={() => handleAddSentence(wordInput, translation)}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', px: 2, pt: 1, pb: 0.5, borderBottom: '1px solid #3c3c3c' }}>
                <FormControlLabel 
                  control={
                    <Switch 
                      size="small" 
                      checked={isCompact} 
                      onChange={() => setIsCompact(!isCompact)} 
                      sx={{ 
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#4ec9b0' }, 
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4ec9b0' } 
                      }} 
                    />
                  } 
                  label={<Typography variant="caption" sx={{ color: '#858585' }}>简洁模式</Typography>} 
                  labelPlacement="start" 
                />
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <FullTranslator 
                  sentenceList={sentenceList}
                  wordInput={wordInput}
                  setWordInput={setWordInput}
                  onAddWord={handleAddWord}
                  onAddSentence={handleAddSentence}
                  onSpeak={handleSpeak}
                  onTranslate={(text, trans) => console.log('翻译:', text, trans)}
                  addingWord={addingWord}
                  addingSentence={addingSentence}
                  onOpenVocabMaster={() => {
                    setVocabKey(prev => prev + 1);
                    setShowVocabMaster(true);
                  }} 
                  onOpenWordBook={() => setShowWordBook(true)} 
                  onOpenSentenceCenter={() => setShowSentenceCenter(true)} 
                  autoSpeak={autoSpeak}
                  onAutoSpeakChange={setAutoSpeak}
                />
              </Box>
            </Box>
          )}
        </DraggableDialog>
      )}

      {/* 单词学习 - 独立弹窗，不使用 DraggableDialog 包裹 */}
      {showVocabMaster && (
        <VocabularyMaster 
          key={vocabKey}
          getToken={getTokenValue}
          clickWork={word}
          onClose={handleCloseVocabMaster}
          onWordChange={(data) => { 
            onWordChange?.(data); 
            if (data?.word) { 
              setWord(data.word); 
              setWordInput(data.word); 
            } 
          }} 
          G_word_name={G_word_name}
        />
      )}

      {/* 单词复习 - 独立弹窗 */}
      {showWordBook && (
        <WordBook 
          G_json="word_reading_review"
          onClose={handleCloseWordBook}
          onWordSelect={(selectedWord) => { 
            setWord(selectedWord); 
            setWordInput(selectedWord); 
            setShowWordBook(false); 
          }} 
        />
      )}

      {/* 句子复习 - 独立弹窗 */}
      {showSentenceCenter && (
        <SentenceCenter 
          onClose={handleCloseSentenceCenter}
        />
      )}
    </>
  );
});

WordTranslator.displayName = 'WordTranslator';
export default WordTranslator;