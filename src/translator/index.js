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
  autoSpeak = true,
  getToken: propGetToken,
  defaultCompact = true,
}, ref) => {

  console.log('【WordTranslator】接收到的 initialWord:', initialWord);
  
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

  // 翻译函数
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
      console.error('翻译失败:', err);
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
    console.log('【updateContent】更新内容:', trimmedText);
    
    // 拆分句子
    const sentences = splitTextIntoSentences(trimmedText);
    console.log('【updateContent】拆分结果:', sentences);
    console.log('【updateContent】共', sentences.length, '个句子');
    
    setSentenceList(sentences);
    
    // 如果是完整模式，不清空单词输入框
    if (!isCompact && sentences.length > 0) {
      // 完整模式下，不自动设置单词输入框，保持用户输入的内容
      console.log('【updateContent】完整模式，保持单词输入框当前值:', wordInput);
    } else if (sentences.length > 0) {
      // 简洁模式下，设置第一句到输入框
      const firstSentence = sentences[0];
      setWordInput(firstSentence);
      console.log('【updateContent】简洁模式，设置 wordInput 为:', firstSentence);
      
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
  }, [translateWord, isCompact, wordInput]);

  // 当 initialWord 变化时，更新所有内容
  useEffect(() => {
    // 检查 initialWord 是否真的发生了变化
    if (initialWord !== prevInitialWordRef.current) {
      console.log('【useEffect】initialWord 发生变化:');
      console.log('  旧值:', prevInitialWordRef.current);
      console.log('  新值:', initialWord);
      
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
      console.log('【useEffect】open 变为 true，检查内容:', initialWord);
      
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

  const fetchExistingWords = useCallback(async () => {
    const token = getTokenValue();
    if (!token) return;
    try { 
      const words = await F_get_words_study(token, G_word_name) || [];
      const normalized = words.map(w => {
        if (typeof w === 'string') return w.toLowerCase();
        if (w && typeof w === 'object') return (w.word || w.text || '').toLowerCase();
        return '';
      }).filter(w => w);
      setExistingWords(normalized);
    } catch { 
      console.error('获取单词列表失败');
      setExistingWords([]);
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

  // 添加单词（使用上方的独立输入框）
  const handleAddWord = async () => {
    const text = wordInput;
    console.log('【handleAddWord】开始执行');
    console.log('【handleAddWord】输入:', text);
    
    if (!text?.trim()) { 
      message.warning('请输入单词或短语'); 
      return; 
    }
    
    const wordCount = getWordCount(text);
    if (wordCount > 7) { 
      message.warning('单词最多支持7个单词的短语'); 
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
      message.warning(`"${trimmedWord}" 已存在`);
      return;
    }
    
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
      console.error('【handleAddWord】网络错误:', error);
      message.error("网络异常，请重试");
    } finally {
      setAddingWord(false);
    }
  };

  // 添加句子
  const handleAddSentence = async (text, translationText) => {
    console.log('【handleAddSentence】开始执行');
    console.log('【handleAddSentence】输入:', text);
    
    if (!text?.trim()) { 
      message.warning('请输入句子'); 
      return; 
    }
    
    const trimmedSentence = text.trim();
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
        const result = await F_translator(trimmedSentence);
        if (result) {
          finalTranslation = typeof result === 'string' ? result : result?.basic?.explains?.join('；');
        } else {
          message.warning('无法获取句子翻译');
          setAddingSentence(false);
          return;
        }
      } catch (err) {
        console.error('翻译失败:', err);
        message.warning('无法获取句子翻译');
        setAddingSentence(false);
        return;
      }
    }
    
    setAddingSentence(true);
    
    try {
      const result = await sentenceApi.addSentence({
        text: trimmedSentence, 
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
      console.error('添加句子失败:', err);
      message.error(`添加失败: ${err.message}`); 
    } finally { 
      setAddingSentence(false); 
    }
  };

  const shouldShowTranslator = open && !showVocabMaster && !showWordBook && !showSentenceCenter;

  return (
    <>
      {shouldShowTranslator && (
        <DraggableDialog 
          open={true} 
          onClose={onClose} 
          isCompact={isCompact} 
          title="翻译" 
          onToggleMode={() => setIsCompact(!isCompact)} 
          onAddWord={handleAddWord}
          onAddSentence={() => handleAddSentence(wordInput, translation)}
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
                />
              </Box>
            </Box>
          )}
        </DraggableDialog>
      )}

      {showVocabMaster && (
        <DraggableDialog open={true} onClose={() => { setShowVocabMaster(false); fetchExistingWords(); }} isCompact={false} title="单词学习">
          <VocabularyMaster 
            key={vocabKey} 
            getToken={getTokenValue} 
            clickWork={word} 
            onClose={() => setShowVocabMaster(false)} 
            onWordChange={(data) => { 
              onWordChange?.(data); 
              if (data?.word) { 
                setWord(data.word); 
                setWordInput(data.word); 
              } 
            }} 
            G_word_name={G_word_name} 
            embedded={true} 
          />
        </DraggableDialog>
      )}

      {showWordBook && (
        <DraggableDialog open={true} onClose={() => { setShowWordBook(false); fetchExistingWords(); }} isCompact={false} title="单词复习">
          <WordBook 
            G_json="word_english_test_review" 
            onClose={() => setShowWordBook(false)} 
            onWordSelect={(selectedWord) => { 
              setWord(selectedWord); 
              setWordInput(selectedWord); 
              setShowWordBook(false); 
            }} 
          />
        </DraggableDialog>
      )}

      {showSentenceCenter && (
        <DraggableDialog open={true} onClose={() => setShowSentenceCenter(false)} isCompact={false} title="句子复习">
          <SentenceCenter />
        </DraggableDialog>
      )}
    </>
  );
});

WordTranslator.displayName = 'WordTranslator';
export default WordTranslator;