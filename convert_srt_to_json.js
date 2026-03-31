const fs = require('fs');
const path = require('path');

// SRT解析函数
function parseSRT(srtContent) {
  const regex = /(\d+)\r?\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\r?\n([\s\S]*?)(?=\r?\n\r?\n|\r?\n*$)/g;
  const sentences = [];
  let match;
  
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [hms, ms] = timeStr.split(',');
    const [h, m, s] = hms.split(':').map(parseFloat);
    return h * 3600 + m * 60 + s + parseFloat(ms) / 1000;
  };
  
  while ((match = regex.exec(srtContent)) !== null) {
    const [, id, startTimeStr, endTimeStr, text] = match;
    const originalText = text.replace(/\r?\n/g, ' ').trim();
    
    // 智能拆分单词（模拟SentenceSplitter.splitSentenceIntelligently的逻辑）
    const words = splitSentenceIntelligently(originalText);
    
    sentences.push({
      id: parseInt(id),
      startTime: parseTime(startTimeStr),
      endTime: parseTime(endTimeStr),
      text: originalText,
      words: words,
      translation: '', // 可以后续添加翻译
      wordCount: words.length
    });
  }
  
  return sentences;
}

// 智能拆分单词函数
function splitSentenceIntelligently(text) {
  if (!text || typeof text !== 'string') return [];
  let normalizedText = text;
  
  // 智能处理缩写和特殊字符
  const patterns = [
    // 处理缩写：确保缩写不被拆分
    { regex: /(\w+)'(\w+)/gi, replacement: '$1__APOSTROPHE__$2' },
    { regex: /(\w+)-(\w+)/gi, replacement: '$1__HYPHEN__$2' },
    // 处理标点符号后的单词
    { regex: /(\w+)([.,!?;])(\w+)/g, replacement: '$1 $3' },
    { regex: /(\w+),(\w+)/g, replacement: '$1 $2' },
  ];
  
  patterns.forEach(pattern => { 
    normalizedText = normalizedText.replace(pattern.regex, pattern.replacement); 
  });
  
  // 拆分句子
  const words = splitSentence(normalizedText, { preserveCase: true, minWordLength: 1 });
  
  // 恢复特殊标记
  return words.map(word => {
    return word.replace(/__APOSTROPHE__/g, "'").replace(/__HYPHEN__/g, "-");
  });
}

// 基本拆分函数
function splitSentence(text, options = {}) {
  const { preserveCase = false, minWordLength = 1, splitPattern = /\s+/ } = options;
  if (!text || typeof text !== 'string') return [];

  let processedText = text;
  
  // 首先，处理标点符号，确保缩写不被错误拆分
  const abbreviationPatterns = [
    { pattern: /(\w+)'(\w+)/gi, replacement: '$1__APOSTROPHE__$2' },
    { pattern: /(\w+)-(\w+)/gi, replacement: '$1__HYPHEN__$2' },
  ];
  
  abbreviationPatterns.forEach(({ pattern, replacement }) => {
    processedText = processedText.replace(pattern, replacement);
  });

  // 移除其他标点符号，但保留我们的特殊标记
  processedText = processedText.replace(/[.,!?;'"()\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 恢复特殊标记为原始形式
  processedText = processedText.replace(/__APOSTROPHE__/g, "'");
  processedText = processedText.replace(/__HYPHEN__/g, "-");
  
  const rawWords = processedText.split(splitPattern);
  const processedWords = rawWords.map(word => {
    let cleanedWord = word.trim();
    if (cleanedWord === '') return '';
    
    // 对于缩写，保持原样（包括大小写）
    if (cleanedWord.includes("'") || cleanedWord.includes("-")) {
      return cleanedWord;
    }
    
    if (!preserveCase && cleanedWord.length > 0) {
      if (/^[A-Z]/.test(cleanedWord) && cleanedWord.length > 1) {
        return cleanedWord.charAt(0) + cleanedWord.slice(1).toLowerCase();
      } else {
        return cleanedWord.toLowerCase();
      }
    }
    return cleanedWord;
  });
  return processedWords.filter(w => w && w.length >= minWordLength);
}

// 转换单个SRT文件
function convertSRTFile(srtPath, jsonPath) {
  try {
    console.log(`转换: ${srtPath} -> ${jsonPath}`);
    
    // 读取SRT文件
    const srtContent = fs.readFileSync(srtPath, 'utf-8');
    
    // 解析SRT
    const sentences = parseSRT(srtContent);
    
    if (sentences.length === 0) {
      console.warn(`警告: ${srtPath} 没有解析到句子`);
      return false;
    }
    
    // 计算元数据
    const totalWords = sentences.reduce((sum, s) => sum + s.words.length, 0);
    const duration = sentences.length > 0 ? sentences[sentences.length - 1].endTime : 0;
    
    // 创建JSON结构
    const jsonData = {
      metadata: {
        id: path.basename(srtPath, '.srt'),
        title: path.basename(srtPath, '.srt'),
        totalSentences: sentences.length,
        totalWords: totalWords,
        duration: duration,
        difficulty: "beginner",
        convertedFrom: path.basename(srtPath)
      },
      sentences: sentences
    };
    
    // 写入JSON文件
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`成功: 转换了 ${sentences.length} 个句子`);
    return true;
    
  } catch (error) {
    console.error(`错误: 转换 ${srtPath} 失败:`, error.message);
    return false;
  }
}

// 批量转换目录中的所有SRT文件
function convertDirectory(srtDir, jsonDir) {
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }
  
  const files = fs.readdirSync(srtDir);
  const srtFiles = files.filter(f => f.toLowerCase().endsWith('.srt'));
  
  console.log(`在目录 ${srtDir} 中找到 ${srtFiles.length} 个SRT文件`);
  
  let successCount = 0;
  let failCount = 0;
  
  srtFiles.forEach(srtFile => {
    const srtPath = path.join(srtDir, srtFile);
    const jsonFile = srtFile.replace('.srt', '.json');
    const jsonPath = path.join(jsonDir, jsonFile);
    
    if (convertSRTFile(srtPath, jsonPath)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  console.log(`\n转换完成: ${successCount} 成功, ${failCount} 失败`);
  return { success: successCount, fail: failCount };
}

// 主函数
function main() {
  const baseDir = 'public/SentenceListen';
  
  // 需要转换的目录
  const directories = [
    '7A',
    '7B'
    // 可以添加更多目录：'8A', '8B', '9A', '9B' 等
  ];
  
  directories.forEach(dir => {
    const srtDir = path.join(baseDir, dir);
    const jsonDir = path.join(baseDir, dir); // 同一目录
    
    if (fs.existsSync(srtDir)) {
      console.log(`\n=== 转换目录: ${dir} ===`);
      convertDirectory(srtDir, jsonDir);
    } else {
      console.log(`目录不存在: ${srtDir}`);
    }
  });
  
  console.log('\n=== 所有转换完成 ===');
}

// 执行转换
if (require.main === module) {
  main();
}

module.exports = { convertSRTFile, convertDirectory };
