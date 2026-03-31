const fs = require('fs');
const path = require('path');

// 读取content.json文件
const contentPath = 'public/SentenceListen/content.json';
const contentData = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));

// 递归遍历对象，更新所有srt字段
function updateSRTReferences(obj) {
  if (Array.isArray(obj)) {
    // 如果是数组，遍历每个元素
    obj.forEach(item => updateSRTReferences(item));
  } else if (obj && typeof obj === 'object') {
    // 如果是对象，检查每个属性
    Object.keys(obj).forEach(key => {
      if (key === 'srt' && typeof obj[key] === 'string') {
        // 将.srt替换为.json
        obj[key] = obj[key].replace(/\.srt$/i, '.json');
        console.log(`更新: ${obj[key]}`);
      } else {
        // 递归处理嵌套对象
        updateSRTReferences(obj[key]);
      }
    });
  }
}

console.log('开始更新content.json文件...');
updateSRTReferences(contentData);

// 写回文件
fs.writeFileSync(contentPath, JSON.stringify(contentData, null, 2), 'utf-8');
console.log('content.json文件更新完成！');

// 验证更新
console.log('\n验证更新结果:');
function countUpdates(obj, path = '') {
  let count = 0;
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      count += countUpdates(item, `${path}[${index}]`);
    });
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (key === 'srt' && typeof obj[key] === 'string') {
        if (obj[key].endsWith('.json')) {
          console.log(`✓ ${path}.${key}: ${obj[key]}`);
          count++;
        } else {
          console.log(`✗ ${path}.${key}: ${obj[key]} (未更新)`);
        }
      } else {
        count += countUpdates(obj[key], `${path}.${key}`);
      }
    });
  }
  return count;
}

const totalUpdates = countUpdates(contentData);
console.log(`\n总计更新了 ${totalUpdates} 个文件引用`);
