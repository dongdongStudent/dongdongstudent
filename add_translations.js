const fs = require('fs');
const path = require('path');

// 翻译数据库（示例，实际需要更完整的翻译）
const translationDB = {
  // 常见句子翻译
  "Hello, I'm Song Meimei. May I have your name?": "你好，我是宋梅梅。请问你叫什么名字？",
  "Hi, I'm Peter Brown. Nice to meet you.": "嗨，我是彼得·布朗。很高兴认识你。",
  "Nice to meet you too. How do you spell your name?": "我也很高兴认识你。你的名字怎么拼写？",
  "P-E-T-E-R, Peter. B-R-O-W-N, Brown.": "P-E-T-E-R，彼得。B-R-O-W-N，布朗。",
  "Where are you from?": "你来自哪里？",
  "I'm from London, in the UK.": "我来自英国伦敦。",
  "Wow, that's far. What class are you in?": "哇，那很远。你在哪个班？",
  "I'm in Class 1, Grade 7.": "我在七年级一班。",
  
  // 更多常见句子可以在这里添加
};

// 获取句子的翻译
function getTranslation(text) {
  // 首先检查翻译数据库
  if (translationDB[text]) {
    return translationDB[text];
  }
  
  // 如果没有找到，返回占位符
  return `[需要翻译: ${text}]`;
}

// 为单个JSON文件添加翻译
function addTranslationsToFile(filePath) {
  try {
    console.log(`处理文件: ${filePath}`);
    
    // 读取JSON文件
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let updatedCount = 0;
    
    // 遍历所有句子
    if (data.sentences && Array.isArray(data.sentences)) {
      data.sentences.forEach(sentence => {
        // 如果translation字段为空或不存在，添加翻译
        if (!sentence.translation || sentence.translation.trim() === '') {
          sentence.translation = getTranslation(sentence.text);
          updatedCount++;
        }
      });
    }
    
    // 写回文件
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  更新了 ${updatedCount} 个句子的翻译`);
    
    return { success: true, updated: updatedCount };
    
  } catch (error) {
    console.error(`  错误: 处理 ${filePath} 失败:`, error.message);
    return { success: false, error: error.message };
  }
}

// 批量处理目录中的所有JSON文件
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`目录不存在: ${dirPath}`);
    return { success: 0, fail: 0 };
  }
  
  const files = fs.readdirSync(dirPath);
  const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json'));
  
  console.log(`在目录 ${dirPath} 中找到 ${jsonFiles.length} 个JSON文件`);
  
  let successCount = 0;
  let failCount = 0;
  let totalUpdated = 0;
  
  jsonFiles.forEach(jsonFile => {
    const filePath = path.join(dirPath, jsonFile);
    const result = addTranslationsToFile(filePath);
    
    if (result.success) {
      successCount++;
      totalUpdated += result.updated || 0;
    } else {
      failCount++;
    }
  });
  
  console.log(`处理完成: ${successCount} 成功, ${failCount} 失败, 总共更新了 ${totalUpdated} 个翻译`);
  return { success: successCount, fail: failCount, totalUpdated };
}

// 主函数
function main() {
  const baseDir = 'public/SentenceListen';
  
  // 需要处理的目录
  const directories = [
    '7A',
    '7B'
  ];
  
  let totalSuccess = 0;
  let totalFail = 0;
  let totalTranslations = 0;
  
  directories.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    
    if (fs.existsSync(dirPath)) {
      console.log(`\n=== 处理目录: ${dir} ===`);
      const result = processDirectory(dirPath);
      totalSuccess += result.success;
      totalFail += result.fail;
      totalTranslations += result.totalUpdated || 0;
    } else {
      console.log(`目录不存在: ${dirPath}`);
    }
  });
  
  console.log('\n=== 所有处理完成 ===');
  console.log(`总计: ${totalSuccess} 个文件成功, ${totalFail} 个文件失败`);
  console.log(`总共添加/更新了 ${totalTranslations} 个翻译`);
  
  // 创建翻译说明文件
  createTranslationInstructions();
}

// 创建翻译说明文件
function createTranslationInstructions() {
  const instructions = `# 翻译说明文件

## 概述
此文件提供了为JSON文件添加翻译的说明和指南。

## 文件结构
每个JSON文件包含：
- metadata: 元数据信息
- sentences: 句子数组，每个句子包含：
  - id: 句子ID
  - startTime/endTime: 时间戳（秒）
  - text: 英文原文
  - words: 单词数组
  - translation: 中文翻译（需要填写）
  - wordCount: 单词数

## 翻译状态
- 已添加部分常见句子的翻译
- 其他句子标记为 "[需要翻译: 原文]"
- 需要手动完善所有翻译

## 如何完善翻译
1. 打开JSON文件
2. 找到每个句子的"translation"字段
3. 将"[需要翻译: 原文]"替换为正确的中文翻译
4. 保存文件

## 翻译示例
原始:
  "translation": "[需要翻译: Hello, I'm Song Meimei. May I have your name?]"

修改后:
  "translation": "你好，我是宋梅梅。请问你叫什么名字？"

## 注意事项
1. 保持翻译准确、自然
2. 注意专有名词的翻译（人名、地名等）
3. 保持句子结构完整
4. 翻译完成后，应用将自动显示中文翻译

## 批量处理工具
可以使用 add_translations.js 工具批量更新翻译字段。
`;

  fs.writeFileSync('翻译说明.md', instructions, 'utf-8');
  console.log('\n已创建翻译说明文件: 翻译说明.md');
}

// 执行处理
if (require.main === module) {
  main();
}

module.exports = { addTranslationsToFile, processDirectory };
