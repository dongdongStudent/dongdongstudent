// wordUtils.js - 单词工具函数库

// ==================== 工具函数 ====================

// 解析单词数据
export const parseWordData = (wordData) => {
    if (!wordData) {
        return {
            chinese: '',
            extraction_count: 0,
            correct_count: 0,
            wrong_count: 0,
            time: null,
            accuracy: 0,
            total_tests: 0,
            mastery_level: 0,
            is_mastered: false
        };
    }

    if (typeof wordData === 'string' && wordData === '') {
        return {
            chinese: '',
            extraction_count: 0,
            correct_count: 0,
            wrong_count: 0,
            time: null,
            accuracy: 0,
            total_tests: 0,
            mastery_level: 0,
            is_mastered: false
        };
    }

    if (typeof wordData === 'object' && wordData !== null) {
        const correct = wordData.correct_count || 0;
        const wrong = wordData.wrong_count || 0;
        const total_tests = correct + wrong;
        const accuracy = total_tests > 0 ? Math.round((correct / total_tests) * 10000) / 100 : 0;

        // 根据正确率和测试次数计算掌握程度
        let mastery_level = 0;
        let is_mastered = false;

        if (total_tests >= 5) {
            if (accuracy >= 90) {
                mastery_level = 5; // 完全掌握
                is_mastered = true;
            } else if (accuracy >= 80) {
                mastery_level = 4; // 熟练掌握
                is_mastered = true;
            } else if (accuracy >= 70) {
                mastery_level = 3; // 基本掌握
                is_mastered = true;
            } else if (accuracy >= 60) {
                mastery_level = 2; // 初步掌握
            } else if (accuracy > 0) {
                mastery_level = 1; // 开始学习
            }
        } else if (total_tests > 0) {
            mastery_level = 1; // 开始学习
            is_mastered = accuracy >= 70; // 如果测试次数少但正确率高，也算掌握
        } else if (wordData.extraction_count > 0) {
            mastery_level = 0; // 被抽取过但未测试
        }

        return {
            chinese: wordData.chinese || '',
            extraction_count: wordData.extraction_count || 0,
            correct_count: correct,
            wrong_count: wrong,
            total_tests: total_tests,
            time: wordData.time || null,
            accuracy: accuracy,
            mastery_level: mastery_level,
            is_mastered: is_mastered
        };
    }

    if (typeof wordData === 'string') {
        return {
            chinese: wordData,
            extraction_count: 0,
            correct_count: 0,
            wrong_count: 0,
            total_tests: 0,
            time: null,
            accuracy: 0,
            mastery_level: 0,
            is_mastered: false
        };
    }

    return {
        chinese: String(wordData),
        extraction_count: 0,
        correct_count: 0,
        wrong_count: 0,
        total_tests: 0,
        time: null,
        accuracy: 0,
        mastery_level: 0,
        is_mastered: false
    };
};

// 获取时间差描述
export const getTimeAgo = (date) => {
    if (!date) return '从未学习';
    try {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '昨天';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
        return `${Math.floor(diffDays / 30)}月前`;
    } catch (error) {
        return '日期错误';
    }
};

// 获取掌握程度描述和颜色
export const getMasteryInfo = (mastery_level, accuracy) => {
    const info = {
        label: '',
        color: 'default',
        icon: null
    };

    switch (mastery_level) {
        case 5:
            info.label = `完全掌握 (${accuracy}%)`;
            info.color = 'success';
            info.icon = 'CheckCircle';
            break;
        case 4:
            info.label = `熟练掌握 (${accuracy}%)`;
            info.color = 'success';
            info.icon = 'CheckCircle';
            break;
        case 3:
            info.label = `基本掌握 (${accuracy}%)`;
            info.color = 'info';
            info.icon = 'TrendingUp';
            break;
        case 2:
            info.label = `初步掌握 (${accuracy}%)`;
            info.color = 'warning';
            info.icon = 'Warning';
            break;
        case 1:
            info.label = `开始学习 (${accuracy}%)`;
            info.color = 'warning';
            info.icon = 'Warning';
            break;
        default:
            info.label = '未学习';
            info.color = 'default';
            info.icon = 'Cancel';
    }

    return info;
};

// ==================== 智能抽取算法函数 ====================
export const calculateEnhancedPriorityScore = (word) => {
    const now = Date.now();
    const lastTime = word.time ? new Date(word.time).getTime() : 0;
    const daysSinceLast = Math.max(0, (now - lastTime) / (1000 * 60 * 60 * 24));

    // 检查是否为"新单词"（无测试记录）
    const totalTests = (word.correct_count || 0) + (word.wrong_count || 0);
    const isNewWord = totalTests === 0;

    // === 关键修改：从未被抽中的单词直接给最高优先级 ===
    if ((word.extraction_count || 0) === 0) {
        return {
            score: 0,  // 0分表示最高优先级
            factors: {
                isNewWord,
                extraction_count: 0,
                priority: "最高优先级 - 从未被抽中"
            }
        };
    }

    if (isNewWord) {
        const timeWeight = 0.4;
        const timeFactor = 1 - Math.exp(-(daysSinceLast + 30) / 7);

        const extractionWeight = 0.3;
        const extractionFactor = Math.exp(-(word.extraction_count || 0) / 5);

        const randomWeight = 0.3;
        const randomFactor = Math.random() * 0.5;

        return {
            score: Math.min(Math.max(
                timeFactor * timeWeight +
                extractionFactor * extractionWeight +
                randomFactor * randomWeight, 0), 1),
            factors: { isNewWord: true, timeFactor, extractionFactor, randomFactor }
        };
    }

    const hasEnoughData = totalTests >= 5;

    let accuracyWeight = 0.30;
    let accuracyFactor = 1 - (word.accuracy || 0) / 100;

    if (!hasEnoughData) {
        accuracyWeight = 0.20;
        const priorAccuracy = 0.5;
        const smoothingFactor = 1;
        const effectiveAccuracy = ((word.correct_count || 0) + smoothingFactor * priorAccuracy) /
            (totalTests + smoothingFactor);
        accuracyFactor = 1 - effectiveAccuracy;
    }

    const timeWeight = 0.25;
    const timeFactor = 1 - Math.exp(-daysSinceLast / 7);

    const extractionWeight = 0.20;
    const extractionFactor = Math.exp(-(word.extraction_count || 0) / 10);

    const testWeight = 0.15;
    let testFactor = 0;
    if (totalTests === 0) {
        testFactor = 1;
    } else {
        testFactor = 1 / (1 + Math.log(totalTests + 1));
    }

    const masteryWeight = 0.10;
    const masteryFactor = (5 - (word.mastery_level || 0)) / 5;

    const errorConcentrationWeight = 0.10;
    let errorConcentrationFactor = 0;
    if (totalTests > 0) {
        const errorRate = (word.wrong_count || 0) / totalTests;
        errorConcentrationFactor = errorRate * 2;
    }

    const progressWeight = 0.05;
    let progressFactor = 0;
    if (totalTests >= 3) {
        const recentAccuracy = (word.accuracy || 0) / 100;
        progressFactor = 1 - recentAccuracy;
    }

    const enhancedScore = (
        accuracyFactor * accuracyWeight +
        timeFactor * timeWeight +
        extractionFactor * extractionWeight +
        testFactor * testWeight +
        masteryFactor * masteryWeight +
        errorConcentrationFactor * errorConcentrationWeight +
        progressFactor * progressWeight
    );

    return {
        score: Math.min(Math.max(enhancedScore, 0), 1),
        factors: {
            accuracyFactor,
            timeFactor,
            extractionFactor,
            testFactor,
            masteryFactor,
            errorConcentrationFactor,
            progressFactor,
            daysSinceLast,
            totalTests,
            hasEnoughData
        },
        weights: {
            accuracyWeight,
            timeWeight,
            extractionWeight,
            testWeight,
            masteryWeight,
            errorConcentrationWeight,
            progressWeight
        }
    };
};

// 新增：新单词优先抽取函数
export const newWordPriorityExtraction = (poolWords, count) => {
    if (!poolWords || poolWords.length === 0 || count <= 0) return [];

    // 使用 total_tests 判断新词（从未测试过）
    const newWords = poolWords.filter(w => (w.total_tests || 0) === 0);
    const oldWords = poolWords.filter(w => (w.total_tests || 0) > 0);

    // console.log(`总单词: ${poolWords.length}, 新词(未测试): ${newWords.length}, 旧词(已测试): ${oldWords.length}`);

    const totalAvailable = Math.min(poolWords.length, count);

    // 目标：新单词占80% (可以调整这个比例)
    const targetNewCount = Math.min(Math.ceil(totalAvailable * 0.8), newWords.length);
    const targetOldCount = totalAvailable - targetNewCount;

    const result = [];

    // 1. 随机选择新单词
    if (targetNewCount > 0) {
        const shuffledNew = [...newWords].sort(() => Math.random() - 0.5);
        result.push(...shuffledNew.slice(0, targetNewCount));
    }

    // 2. 如果还需要旧单词
    if (result.length < totalAvailable && oldWords.length > 0) {
        const remainingNeeded = totalAvailable - result.length;

        // 旧单词按测试次数排序（次数少的优先），并加入随机因子
        const oldWithPriority = oldWords.map(word => ({
            ...word,
            priority: (word.total_tests || 0) - Math.random() * 0.5
        }));

        const sortedOld = oldWithPriority.sort((a, b) => a.priority - b.priority);
        result.push(...sortedOld.slice(0, remainingNeeded));
    }

    // 3. 如果还不够，从所有单词中随机补充
    if (result.length < totalAvailable) {
        const existingWords = new Set(result.map(w => w.word));
        const remainingWords = poolWords.filter(w => !existingWords.has(w.word));
        const shuffledRemaining = [...remainingWords].sort(() => Math.random() - 0.5);
        result.push(...shuffledRemaining.slice(0, totalAvailable - result.length));
    }

    // 统计
    const newInResult = result.filter(w => (w.total_tests || 0) === 0).length;
    console.log(`抽取结果: 总${result.length}个, 新单词${newInResult}个, 占比${(newInResult / result.length * 100).toFixed(1)}%`);

    return result;
};

// 2. 智能记忆曲线抽取算法
export const enhancedMemoryCurveExtraction = (poolWords, count) => {
    if (!poolWords || poolWords.length === 0 || count <= 0) return [];

    const now = Date.now();

    const wordsWithMemoryScore = poolWords.map(word => {
        const lastTime = word.time ? new Date(word.time).getTime() : 0;
        const hoursSinceLast = Math.max(0, (now - lastTime) / (1000 * 60 * 60));

        const baseStrength = (word.accuracy || 0) / 100;
        const forgettingRate = 0.15 + (1 - baseStrength) * 0.35;
        const reinforcementFactor = Math.log(Math.max(word.extraction_count, 1) + 1);
        const forgettingFactor = Math.exp(-forgettingRate * Math.pow(hoursSinceLast / 24, 0.7));
        const currentMemoryStrength = baseStrength * forgettingFactor;
        const reviewPriority = (1 - currentMemoryStrength) * Math.sqrt(hoursSinceLast / 24) / (1 + reinforcementFactor);

        return {
            ...word,
            reviewPriority,
            currentMemoryStrength,
            hoursSinceLast,
            forgettingRate,
            reinforcementFactor
        };
    });

    const sortedByPriority = wordsWithMemoryScore.sort((a, b) => a.reviewPriority - b.reviewPriority);

    const totalAvailable = Math.min(sortedByPriority.length, count);
    const memoryGroups = {
        urgent: sortedByPriority.filter(w => w.currentMemoryStrength < 0.3),
        weak: sortedByPriority.filter(w => w.currentMemoryStrength >= 0.3 && w.currentMemoryStrength < 0.6),
        stable: sortedByPriority.filter(w => w.currentMemoryStrength >= 0.6)
    };

    let urgentCount = 0, weakCount = 0, stableCount = 0;

    if (memoryGroups.urgent.length > 0) {
        urgentCount = Math.min(Math.floor(totalAvailable * 0.5), memoryGroups.urgent.length);
    }

    if (totalAvailable - urgentCount > 0) {
        weakCount = Math.min(Math.floor((totalAvailable - urgentCount) * 0.6), memoryGroups.weak.length);
    }

    if (totalAvailable - urgentCount - weakCount > 0) {
        stableCount = Math.min(totalAvailable - urgentCount - weakCount, memoryGroups.stable.length);
    }

    const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

    const result = [
        ...shuffleArray(memoryGroups.urgent).slice(0, urgentCount),
        ...shuffleArray(memoryGroups.weak).slice(0, weakCount),
        ...shuffleArray(memoryGroups.stable).slice(0, stableCount)
    ];

    if (result.length < totalAvailable) {
        const alreadySelected = new Set(result.map(w => w.word));
        const remainingWords = poolWords.filter(w => !alreadySelected.has(w.word));
        const additionalWords = shuffleArray(remainingWords).slice(0, totalAvailable - result.length);
        result.push(...additionalWords);
    }

    return result.sort((a, b) => {
        const aIndex = sortedByPriority.findIndex(w => w.word === a.word);
        const bIndex = sortedByPriority.findIndex(w => w.word === b.word);
        return aIndex - bIndex;
    }).slice(0, totalAvailable);
};

// 3. 自适应平衡抽取算法
export const adaptiveBalancedExtraction = (poolWords, count) => {
    if (!poolWords || poolWords.length === 0 || count <= 0) return [];

    const accuracyRanges = { low: [], medium: [], high: [] };

    const totalAccuracy = poolWords.reduce((sum, w) => sum + (w.accuracy || 0), 0);
    const avgAccuracy = totalAccuracy / poolWords.length;

    const lowThreshold = Math.max(50, avgAccuracy - 20);
    const highThreshold = Math.min(85, avgAccuracy + 15);

    poolWords.forEach(word => {
        const accuracy = word.accuracy || 0;
        if (accuracy < lowThreshold) {
            accuracyRanges.low.push(word);
        } else if (accuracy < highThreshold) {
            accuracyRanges.medium.push(word);
        } else {
            accuracyRanges.high.push(word);
        }
    });

    const totalAvailable = Math.min(poolWords.length, count);

    const lowRatio = accuracyRanges.low.length / poolWords.length;
    const mediumRatio = accuracyRanges.medium.length / poolWords.length;
    const highRatio = accuracyRanges.high.length / poolWords.length;

    const lowCount = Math.max(1, Math.floor(totalAvailable * (lowRatio * 0.8 + 0.2)));
    const mediumCount = Math.max(1, Math.floor(totalAvailable * (mediumRatio * 0.6 + 0.2)));
    const highCount = Math.min(Math.max(1, totalAvailable - lowCount - mediumCount), accuracyRanges.high.length);

    const adjustedLowCount = Math.min(lowCount, accuracyRanges.low.length);
    const adjustedMediumCount = Math.min(mediumCount, accuracyRanges.medium.length);
    const remainingCount = Math.min(totalAvailable - adjustedLowCount - adjustedMediumCount, accuracyRanges.high.length);

    const shuffleWithTimeConsideration = (array) => {
        return [...array].sort((a, b) => {
            const aTime = a.time ? new Date(a.time).getTime() : 0;
            const bTime = b.time ? new Date(b.time).getTime() : 0;
            const aDays = (Date.now() - aTime) / (1000 * 60 * 60 * 24);
            const bDays = (Date.now() - bTime) / (1000 * 60 * 60 * 24);
            const aWeight = Math.random() * (1 + aDays / 30);
            const bWeight = Math.random() * (1 + bDays / 30);
            return bWeight - aWeight;
        });
    };

    const result = [
        ...shuffleWithTimeConsideration(accuracyRanges.low).slice(0, adjustedLowCount),
        ...shuffleWithTimeConsideration(accuracyRanges.medium).slice(0, adjustedMediumCount),
        ...shuffleWithTimeConsideration(accuracyRanges.high).slice(0, remainingCount)
    ];

    if (result.length < totalAvailable) {
        const alreadySelected = new Set(result.map(w => w.word));
        const remainingWords = poolWords.filter(w => !alreadySelected.has(w.word));
        const additionalWords = [...remainingWords].sort(() => Math.random() - 0.5)
            .slice(0, totalAvailable - result.length);
        result.push(...additionalWords);
    }

    return [...result].sort(() => Math.random() - 0.5).slice(0, totalAvailable);
};

// 4. 基于权重的概率抽样算法
export const weightedProbabilityExtraction = (poolWords, count) => {
    if (!poolWords || poolWords.length === 0 || count <= 0) return [];

    const wordsWithScore = poolWords.map(word => ({
        ...word,
        priorityScore: calculateEnhancedPriorityScore(word)
    }));

    const temperature = 0.3;
    const expScores = wordsWithScore.map(item => Math.exp(item.priorityScore.score / temperature));
    const sumExpScores = expScores.reduce((sum, score) => sum + score, 0);

    const probabilities = expScores.map(score => {
        let prob = score / sumExpScores;
        prob = Math.max(prob, 0.01);
        return prob;
    });

    const totalProb = probabilities.reduce((sum, prob) => sum + prob, 0);
    const normalizedProbabilities = probabilities.map(prob => prob / totalProb);

    const selectedWords = [];
    const selectedIndices = new Set();

    while (selectedWords.length < Math.min(count, poolWords.length)) {
        const randomPoint = Math.random();
        let cumulativeProb = 0;
        let selectedIndex = -1;

        for (let i = 0; i < normalizedProbabilities.length; i++) {
            if (selectedIndices.has(i)) continue;
            cumulativeProb += normalizedProbabilities[i];
            if (cumulativeProb >= randomPoint) {
                selectedIndex = i;
                break;
            }
        }

        if (selectedIndex === -1) {
            for (let i = 0; i < poolWords.length; i++) {
                if (!selectedIndices.has(i)) {
                    selectedIndex = i;
                    break;
                }
            }
        }

        if (selectedIndex === -1) break;

        selectedWords.push(wordsWithScore[selectedIndex]);
        selectedIndices.add(selectedIndex);

        if (selectedIndices.size < poolWords.length) {
            const remainingSum = normalizedProbabilities
                .filter((_, idx) => !selectedIndices.has(idx))
                .reduce((sum, prob) => sum + prob, 0);

            if (remainingSum > 0) {
                for (let i = 0; i < normalizedProbabilities.length; i++) {
                    if (!selectedIndices.has(i)) {
                        normalizedProbabilities[i] = normalizedProbabilities[i] / remainingSum;
                    }
                }
            }
        }
    }

    return selectedWords;
};

// 5. 集成学习方法
export const integratedLearningExtraction = (poolWords, count) => {
    if (!poolWords || poolWords.length === 0 || count <= 0) return [];

    const totalAvailable = Math.min(poolWords.length, count);

    const memoryCurveResults = enhancedMemoryCurveExtraction(poolWords, Math.ceil(totalAvailable * 0.4));
    const adaptiveResults = adaptiveBalancedExtraction(poolWords, Math.ceil(totalAvailable * 0.4));
    const weightedResults = weightedProbabilityExtraction(poolWords, Math.ceil(totalAvailable * 0.2));

    console.log('集成学习', memoryCurveResults, adaptiveResults, '33', weightedResults)

    const allCandidates = [...memoryCurveResults, ...adaptiveResults, ...weightedResults];
    const uniqueWords = new Map();

    allCandidates.forEach(word => {
        if (!uniqueWords.has(word.word)) {
            uniqueWords.set(word.word, word);
        }
    });

    let result = Array.from(uniqueWords.values());

    if (result.length < totalAvailable) {
        const selectedWords = new Set(result.map(w => w.word));
        const remainingWords = poolWords.filter(w => !selectedWords.has(w.word));
        const additionalWords = [...remainingWords].sort(() => Math.random() - 0.5)
            .slice(0, totalAvailable - result.length);
        result.push(...additionalWords);
    }

    const wordsWithPriority = result.map(word => ({
        ...word,
        finalPriority: calculateEnhancedPriorityScore(word).score
    }));

    // 打印抽取结果

    return wordsWithPriority
        .sort((a, b) => a.finalPriority - b.finalPriority)
        .slice(0, totalAvailable);
};

// 6. 公平轮询抽取
export const fairRoundRobinExtraction = (poolWords, count) => {
    if (!poolWords || poolWords.length === 0 || count <= 0) return [];

    const sortedByExtraction = [...poolWords].sort((a, b) =>
        (a.extraction_count || 0) - (b.extraction_count || 0)
    );

    const extractionGroups = {};
    sortedByExtraction.forEach(word => {
        const count = word.extraction_count || 0;
        if (!extractionGroups[count]) extractionGroups[count] = [];
        extractionGroups[count].push(word);
    });

    const result = [];
    const availableCount = Math.min(poolWords.length, count);
    let remainingCount = availableCount;

    const sortedGroups = Object.keys(extractionGroups)
        .map(Number)
        .sort((a, b) => a - b);

    for (const extractionCount of sortedGroups) {
        if (remainingCount <= 0) break;

        const group = extractionGroups[extractionCount];
        const shuffledGroup = [...group].sort(() => Math.random() - 0.5);

        const groupRatio = group.length / poolWords.length;
        const neededFromGroup = Math.min(
            Math.max(1, Math.floor(availableCount * groupRatio)),
            Math.min(group.length, remainingCount)
        );

        result.push(...shuffledGroup.slice(0, neededFromGroup));
        remainingCount -= neededFromGroup;
    }

    if (remainingCount > 0 && result.length < availableCount) {
        const alreadySelected = new Set(result.map(w => w.word));
        const remainingWords = poolWords.filter(w => !alreadySelected.has(w.word));
        const shuffledRemaining = [...remainingWords].sort(() => Math.random() - 0.5);
        result.push(...shuffledRemaining.slice(0, remainingCount));
    }

    return result.slice(0, availableCount);
};

// 7. 纯随机抽取
export const randomExtraction = (poolWords, count) => {
    if (!poolWords || poolWords.length === 0 || count <= 0) return [];

    const availableCount = Math.min(poolWords.length, count);
    const shuffled = [...poolWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, availableCount);
};

// 智能抽取池大小计算
export const calculatePoolSize = (allWords, desiredCount = 20, includeAll = true) => {
    const totalWords = allWords.length;
    if (totalWords === 0) return 0;

    if (includeAll) {
        if (totalWords <= 10) {
            return totalWords;
        } else if (totalWords <= 50) {
            return Math.max(desiredCount, Math.floor(totalWords * 0.8));
        } else if (totalWords <= 100) {
            return Math.max(desiredCount, Math.floor(totalWords * 0.6));
        } else if (totalWords <= 200) {
            return Math.max(desiredCount, Math.floor(totalWords * 0.4));
        } else {
            return Math.min(desiredCount * 2, Math.floor(totalWords * 0.3));
        }
    }

    const qualifiedWords = Object.values(allWords)
        .map(word => parseWordData(word))
        .filter(word => {
            const hasExtraction = word.extraction_count > 0;
            const hasTests = (word.correct_count + word.wrong_count) > 0;
            const recentlyLearned = word.time && (Date.now() - new Date(word.time)) < 30 * 24 * 60 * 60 * 1000;
            return hasExtraction || hasTests || recentlyLearned;
        }).length;

    if (qualifiedWords === 0) return 0;

    return Math.min(
        Math.max(desiredCount, Math.floor(qualifiedWords * 0.7)),
        Math.floor(totalWords * 0.8)
    );
};

// 构建智能抽取池
// wordUtils.js - 修改 buildIntelligentPool 函数
// 构建智能抽取池
export const buildIntelligentPool = (processedWords, desiredCount = 20) => {
    if (!processedWords || processedWords.length === 0) return [];

    const allWords = processedWords;
    if (allWords.length === 0) return [];

    const wordsWithScores = allWords.map(word => ({
        ...word,
        priorityScore: calculateEnhancedPriorityScore(word)
    }));

    const sortedByPriority = [...wordsWithScores].sort((a, b) =>
        a.priorityScore.score - b.priorityScore.score
    );

    // 修改这里：返回所有单词，而不是只取前 poolSize 个
    // 但保留评分信息以便后续使用
    return sortedByPriority; // 直接返回全部单词
};

// 计算抽取统计信息
export const calculateExtractionStats = (selectedWords) => {
    if (!selectedWords || selectedWords.length === 0) return null;

    const stats = {
        total: selectedWords.length,
        zeroExtraction: 0,
        oneExtraction: 0,
        multiExtraction: 0,
        minExtractions: Infinity,
        maxExtractions: 0,
        avgExtractions: 0,
        avgAccuracy: 0,
        lowMasteryCount: 0,
        mediumMasteryCount: 0,
        highMasteryCount: 0,
        newWordsCount: 0,
        masteryLevels: [0, 0, 0, 0, 0, 0]
    };

    let totalExtractions = 0;
    let totalAccuracy = 0;

    selectedWords.forEach(word => {
        const count = word.extraction_count || 0;
        totalExtractions += count;

        if (count === 0) stats.zeroExtraction++;
        else if (count === 1) stats.oneExtraction++;
        else stats.multiExtraction++;

        const accuracy = word.accuracy || 0;
        totalAccuracy += accuracy;

        const masteryLevel = word.mastery_level || 0;
        if (masteryLevel >= 0 && masteryLevel <= 5) {
            stats.masteryLevels[masteryLevel]++;
        }

        if (masteryLevel <= 2) stats.lowMasteryCount++;
        else if (masteryLevel === 3) stats.mediumMasteryCount++;
        else stats.highMasteryCount++;

        if ((word.correct_count || 0) + (word.wrong_count || 0) === 0) {
            stats.newWordsCount++;
        }

        stats.minExtractions = Math.min(stats.minExtractions, count);
        stats.maxExtractions = Math.max(stats.maxExtractions, count);
    });

    stats.avgExtractions = selectedWords.length > 0 ? totalExtractions / selectedWords.length : 0;
    stats.avgAccuracy = selectedWords.length > 0 ? totalAccuracy / selectedWords.length : 0;

    return stats;
};

// 将抽取的单词转换为测试格式
export const convertExtractedWordsToTestFormat = (words) => {
    return words.map(item => ({
        english: item.word,
        chinese: item.chinese
    }));
};

// ==================== API 函数 ====================

/**获取单词数据从服务器
 * 
 * @param {function} getToken - 获取token的函数
 * @param {string} jsonName - 文件名，默认为 null
 * @returns {Promise<object>} 单词数据
 */
export const F_get_review = async (getToken, jsonName = null) => {

    try {
        let token;
        if (typeof getToken === 'function') {
            token = getToken();
            // console.log('Token from function:', token);
        } else if (typeof getToken === 'string') {
            token = getToken;
            // console.log('Token as string:', token);
        } else {
            console.warn('getToken参数无效，应为函数或字符串:', getToken);
            return getDefaultData(jsonName);
        }


        // 构建请求URL
        let url = 'https://www.ddstudent.xyz/server/english/get_review';


        if (jsonName) {
            url += `/${jsonName}`; // 注意：后端路由会自动添加 .json
        }
        // 如果没有jsonName，则获取 me_word_index.json

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            // console.log(`获取文件 ${jsonName || 'me_word_index'} 失败: ${response.status}`);
            return getDefaultData(jsonName);
        }

        const data = await response.json();
        // console.log('API响应数据:', data, 'jsonName:', jsonName);

        return data;

    } catch (error) {
        console.error('获取数据失败:', error);
        return getDefaultData(jsonName);
    }
};

export const F_get_words_study = async (getToken, jsonName = null) => {

    try {
        let token;
        if (typeof getToken === 'function') {
            token = getToken();
            // console.log('Token from function:', token);
        } else if (typeof getToken === 'string') {
            token = getToken;
            // console.log('Token as string:', token);
        } else {
            console.warn('getToken参数无效，应为函数或字符串:', getToken);
            return getDefaultData(jsonName);
        }


        // 构建请求URL
        const url = `https://www.ddstudent.xyz/server/english/get_words_study/${jsonName}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            // console.log(`获取文件 ${jsonName || 'me_word_index'} 失败: ${response.status}`);
            return getDefaultData(jsonName);
        }

        const data = await response.json();
        // console.log('API响应数据:', data, 'jsonName:', jsonName);

        return data;

    } catch (error) {
        console.error('获取数据失败:', error);
        return getDefaultData(jsonName);
    }
};

// 辅助函数：根据jsonName返回默认数据
const getDefaultData = (jsonName) => {
    if (!jsonName) {
        // me_word_index.json 默认返回空对象
        return {
            words: {},
            meta: {
                count: 0,
                version: 1,
                updated: new Date().toISOString(),
                created: new Date().toISOString(),
            }
        };
    }

    // 检查是否是数字（比如 '1', '2', '3'）
    if (!isNaN(jsonName) && jsonName !== '') {
        return []; // 数字.json 默认返回空数组
    }

    // 其他情况返回空对象
    return {};
};

/**更新单词数据到服务器
 * 
 * @param {string} word - 英文单词
 * @param {string} chinese - 中文释义
 * @param {number} extractionCount - 抽取次数
 * @param {number} correctCount - 正确次数
 * @param {number} wrongCount - 错误次数
 * @param {string} time - 时间
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const updateWordDataToServer = async (word, chinese, extractionCount, correctCount, wrongCount, time, getToken, targetFile = 'me_word_index') => {
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        const wordData = {
            chinese: chinese,
            extraction_count: extractionCount || 0,
            correct_count: correctCount || 0,
            wrong_count: wrongCount || 0,
            time: time || null
        };

        console.log(`更新单词数据到 ${targetFile}:`, { word, wordData });

        const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'update',
                word: word,
                wordData: wordData,
                target: targetFile
            })
        });

        if (!response.ok) {
            throw new Error('更新失败');
        }

        const result = await response.json();
        return result.flag === 1;
    } catch (error) {
        console.error('更新单词数据失败:', error);
        return false;
    }
};

/**批量更新单词数据
 * 
 * @param {Array} wordList - 单词列表
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const batchUpdateWordsData = async (wordList, getToken, targetFile = 'me_word_index') => {
    console.log(`批量更新单词列表到 ${targetFile}:`, wordList);
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        for (const { word, chinese, extraction_count, correct_count, wrong_count, time } of wordList) {
            const wordData = {
                chinese: chinese,
                extraction_count: extraction_count || 0,
                correct_count: correct_count || 0,
                wrong_count: wrong_count || 0,
                time: time || null
            };

            const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'update',
                    word: word,
                    wordData: wordData,
                    target: targetFile
                })
            });

            if (!response.ok) {
                throw new Error(`更新单词 ${word} 失败`);
            }

            const result = await response.json();
            if (result.flag !== 1) {
                throw new Error(`更新单词 ${word} 失败`);
            }
        }

        return true;
    } catch (error) {
        console.error('批量更新失败:', error);
        return false;
    }
};

/**添加新单词到服务器
 * 
 * @param {string} word - 英文单词
 * @param {string} chinese - 中文释义
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const addWordToServer = async (word, chinese, getToken, targetFile = 'word_pepa_review') => {
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return {
                success: false,
                isNew: false,
                message: '未检测到token',
                wordExists: false
            };
        }

        const wordData = {
            chinese: chinese,
            extraction_count: 0,
            correct_count: 0,
            wrong_count: 0,
            time: new Date().toISOString()
        };

        const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'add',
                word: word,
                wordData: wordData,
                target: targetFile
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        // 根据服务器响应判断
        if (result.flag === 1) {
            // 成功保存
            return {
                success: true,
                isNew: true,
                message: result.message || '添加成功',
                wordExists: false
            };
        } else if (result.flag === 0 && result.message === '单词已存在') {
            // 单词已存在
            return {
                success: true,  // 注意：这里 success 还是 true，因为是"已存在"而不是"失败"
                isNew: false,
                message: result.message,
                wordExists: true
            };
        } else {
            // 其他失败情况
            return {
                success: false,
                isNew: false,
                message: result.message || '保存失败',
                wordExists: false
            };
        }
    } catch (error) {
        console.error('添加单词失败:', error);
        return {
            success: false,
            isNew: false,
            message: error.message,
            wordExists: false
        };
    }
};

/**批量添加单词
 * 
 * @param {Array} wordList - 单词列表，格式: [{english: 'word', chinese: '翻译'}, ...]
 * @param {function|string} tokenOrFunc - 获取token的函数或token字符串
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @param {function} onProgress - 进度回调函数
 * @returns {Promise<object>} 结果
 */
export const batchAddWordsToServer = async (wordList, tokenOrFunc, targetFile = 'me_word_index', onProgress) => {
    try {
        // 处理token：可能是函数或字符串
        let getTokenFunction;
        if (typeof tokenOrFunc === 'function') {
            getTokenFunction = tokenOrFunc;
        } else if (typeof tokenOrFunc === 'string') {
            // 如果是字符串，包装成一个返回该字符串的函数
            getTokenFunction = () => tokenOrFunc;
        } else {
            return {
                success: false,
                savedCount: 0,
                newWords: 0,
                existingWords: 0,
                failed: wordList.length,
                error: '参数必须是函数或字符串',
                results: []
            };
        }

        const results = [];
        let newWordsCount = 0;
        let existingWordsCount = 0;
        let failedCount = 0;
        let savedCount = 0;


        for (let i = 0; i < wordList.length; i++) {
            const item = wordList[i];

            try {
                // 调用修改后的 addWordToServer
                const result = await addWordToServer(
                    item.english.toLowerCase(),
                    item.chinese,
                    getTokenFunction,
                    targetFile
                );


                if (result.success) {
                    if (result.isNew) {
                        // 新增单词成功
                        results.push({
                            word: item.english,
                            chinese: item.chinese,
                            status: 'new',
                            success: true,
                            message: result.message
                        });
                        newWordsCount++;
                        savedCount++;
                    } else if (result.wordExists) {
                        // 单词已存在
                        results.push({
                            word: item.english,
                            chinese: item.chinese,
                            status: 'existing',
                            success: true,
                            message: result.message
                        });
                        existingWordsCount++;
                        savedCount++; // 已存在的单词也算"有效保存"
                    } else {
                        // 其他成功情况
                        results.push({
                            word: item.english,
                            chinese: item.chinese,
                            status: 'other',
                            success: true,
                            message: result.message
                        });
                        savedCount++;
                    }
                } else {
                    // 保存失败
                    results.push({
                        word: item.english,
                        chinese: item.chinese,
                        status: 'failed',
                        success: false,
                        message: result.message || '保存失败'
                    });
                    failedCount++;
                }

            } catch (error) {
                console.error(`单词 ${item.english} 添加失败:`, error);
                results.push({
                    word: item.english,
                    chinese: item.chinese,
                    status: 'error',
                    success: false,
                    error: error.message
                });
                failedCount++;
            }

            // 进度信息
            const currentProgress = {
                total: wordList.length,
                current: i + 1,
                word: item.english,
                newWords: newWordsCount,
                existingWords: existingWordsCount,
                failed: failedCount,
                saved: savedCount
            };

            // 更新进度并回调
            if (onProgress && typeof onProgress === 'function') {
                onProgress(currentProgress);
            }

            // 添加延迟避免请求过快（可选）
            if (i < wordList.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return {
            success: savedCount > 0,
            savedCount: savedCount,
            total: wordList.length,
            newWords: newWordsCount,
            existingWords: existingWordsCount,
            failed: failedCount,
            results: results
        };

    } catch (error) {
        console.error('批量添加失败:', error);
        return {
            success: false,
            savedCount: 0,
            total: wordList.length,
            newWords: 0,
            existingWords: 0,
            failed: wordList.length,
            error: error.message,
            results: []
        };
    }
};

/**删除单词（单个）
 * 
 * @param {string} word - 要删除的单词
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const deleteWordFromServer = async (word, getToken, targetFile = 'me_word_index') => {
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'delete',
                word: word,
                target: targetFile
            })
        });

        if (!response.ok) {
            throw new Error('删除失败');
        }

        const result = await response.json();
        return result.flag === 1;
    } catch (error) {
        console.error('删除单词失败:', error);
        return false;
    }
};

/**批量删除单词
 * 
 * @param {Array} words - 要删除的单词数组
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const batchDeleteWordsFromServer = async (words, getToken, targetFile = 'me_word_index') => {
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        console.log(`批量删除单词从 ${targetFile}:`, words);

        for (const word of words) {
            const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'delete',
                    word: word,
                    target: targetFile
                })
            });

            if (!response.ok) {
                throw new Error(`删除单词 ${word} 失败`);
            }

            const result = await response.json();
            if (result.flag !== 1) {
                throw new Error(`删除单词 ${word} 失败`);
            }
        }

        return true;
    } catch (error) {
        console.error('批量删除失败:', error);
        return false;
    }
};

/**重置单词统计信息
 * 
 * @param {string} word - 单词
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const resetWordStatsOnServer = async (word, getToken, targetFile = 'me_word_index') => {
    console.log('重置单词统计:', word, '目标文件:', targetFile);
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'reset_stats',
                word: word,
                target: targetFile
            })
        });

        if (!response.ok) {
            throw new Error('重置统计失败');
        }

        const result = await response.json();
        return result.flag === 1;
    } catch (error) {
        console.error('重置单词统计失败:', error);
        return false;
    }
};

/**增加单词抽取次数
 * 
 * @param {string} word - 单词
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const incrementExtractionCount = async (word, getToken, targetFile = 'me_word_index') => {
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'increment',
                word: word,
                target: targetFile
            })
        });

        if (!response.ok) {
            throw new Error('增加抽取次数失败');
        }

        const result = await response.json();
        return result.flag === 1;
    } catch (error) {
        console.error('增加抽取次数失败:', error);
        return false;
    }
};

/**增加单词正确次数
 * 
 * @param {string} word - 单词
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const incrementCorrectCount = async (word, getToken, targetFile = 'me_word_index') => {
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'increment_correct',
                word: word,
                target: targetFile
            })
        });

        if (!response.ok) {
            throw new Error('增加正确次数失败');
        }

        const result = await response.json();
        return result.flag === 1;
    } catch (error) {
        console.error('增加正确次数失败:', error);
        return false;
    }
};

/**增加单词错误次数
 * 
 * @param {string} word - 单词
 * @param {function} getToken - 获取token的函数
 * @param {string} targetFile - 目标文件，默认为 'me_word_index'
 * @returns {Promise<boolean>} 是否成功
 */
export const incrementWrongCount = async (word, getToken, targetFile = 'me_word_index') => {
    try {
        const token = getToken();
        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'increment_wrong',
                word: word,
                target: targetFile
            })
        });

        if (!response.ok) {
            throw new Error('增加错误次数失败');
        }

        const result = await response.json();
        return result.flag === 1;
    } catch (error) {
        console.error('增加错误次数失败:', error);
        return false;
    }
};


/**将学习列表的单词添加到对应的复习列表中
 * 
 * @param {string|function} tokenOrFunc - token字符串或获取token的函数
 * @param {string} json_study - 源文件，如 'word_pepa_study', 'word_textbook_study', 'word_reading_study'
 * @returns {Promise<object>} 操作结果
 */
export const addWordToReviewList = async (tokenOrFunc, json_study = 'no_json_set') => {
    try {
        // 处理token
        let token;
        if (typeof tokenOrFunc === 'function') {
            token = tokenOrFunc();
        } else if (typeof tokenOrFunc === 'string') {
            token = tokenOrFunc;
        } else {
            console.error('token参数无效:', tokenOrFunc);
            return {
                success: false,
                message: 'token参数无效',
                savedCount: 0,
                total: 0,
                error: 'token参数无效'
            };
        }

        if (!token) {
            console.warn('token为空');
            return {
                success: false,
                message: 'token为空',
                savedCount: 0,
                total: 0,
                error: 'token为空'
            };
        }

        // 1. 根据源文件名生成目标文件名
        // 规则：word_xxx_study -> word_xxx_review
        const getTargetFileName = (fileName) => {
            if (fileName.includes('_study')) {
                return fileName.replace('_study', '_review');
            } else if (fileName.includes('_master')) {
                return fileName.replace('_master', '_review');
            } else {
                // 如果没有特定后缀，添加_review
                return `${fileName}_review`;
            }
        };

        // 2. 获取源文件的单词列表和学习单词列表

        const targetFile = getTargetFileName(json_study);
                console.log('1111111111111111设置的asdasd',json_study,targetFile)
        const data = await F_get_words_study(token, json_study);
        const reviewData = await F_get_review(token, targetFile);

        // 3. 对比reviewData中是否已经包含data中的单词
        // 获取reviewData中已有的单词列表（转为小写，保持一致性）
        const existingWordsInReview = new Set();
        if (reviewData && typeof reviewData === 'object') {
            Object.keys(reviewData).forEach(word => {
                existingWordsInReview.add(word.toLowerCase());
            });
        }


        // 4. 整理需要添加的单词列表（过滤掉已存在的）
        const wordList = [];
        let existingCount = 0;
        let newCount = 0;

        if (Array.isArray(data)) {
            // 如果是数组格式（根据你提供的示例）
            data.forEach(item => {
                if (item.word) {
                    const wordLower = item.word.toLowerCase();
                    // 检查是否已经在复习列表中
                    if (!existingWordsInReview.has(wordLower)) {
                        // 不在复习列表中，需要添加
                        wordList.push({
                            english: wordLower,
                            chinese: item.translation || item.chinese || '待翻译'
                        });
                        newCount++;
                    } else {
                        // 已经在复习列表中，跳过
                        existingCount++;
                    }
                }
            });
        } else if (typeof data === 'object' && data !== null) {
            // 如果是对象格式
            if (data.words && Array.isArray(data.words)) {
                // 格式：{ words: [...] }
                data.words.forEach(item => {
                    if (item.word) {
                        const wordLower = item.word.toLowerCase();
                        if (!existingWordsInReview.has(wordLower)) {
                            wordList.push({
                                english: wordLower,
                                chinese: item.translation || item.chinese || '待翻译'
                            });
                            newCount++;
                        } else {
                            existingCount++;
                        }
                    }
                });
            } else if (data.words && typeof data.words === 'object') {
                // 格式：{ words: { word1: {...}, word2: {...} } }
                Object.entries(data.words).forEach(([word, wordData]) => {
                    const wordLower = word.toLowerCase();
                    if (!existingWordsInReview.has(wordLower)) {
                        const translation = wordData.translation || wordData.chinese || '待翻译';
                        wordList.push({
                            english: wordLower,
                            chinese: translation
                        });
                        newCount++;
                    } else {
                        existingCount++;
                    }
                });
            } else if (typeof data === 'object') {
                // 直接对象格式：{ word1: {...}, word2: {...} }
                Object.entries(data).forEach(([word, wordData]) => {
                    const wordLower = word.toLowerCase();
                    if (!existingWordsInReview.has(wordLower)) {
                        const translation = wordData.translation || wordData.chinese || '待翻译';
                        wordList.push({
                            english: wordLower,
                            chinese: translation
                        });
                        newCount++;
                    } else {
                        existingCount++;
                    }
                });
            }
        }

        console.log(`需要添加的新单词数: ${newCount}, 已存在的单词数: ${existingCount}`);

        if (wordList.length === 0) {
            if (existingCount > 0) {
                return {
                    success: true,
                    message: `所有${existingCount}个单词都已经在复习列表(${targetFile})中，无需重复添加`,
                    savedCount: 0,
                    total: existingCount,
                    newWords: 0,
                    existingWords: existingCount,
                    failed: 0,
                    json_study: json_study,
                    targetFile: targetFile,
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    success: false,
                    message: `没有在${json_study}中找到需要添加的单词`,
                    savedCount: 0,
                    total: 0,
                    newWords: 0,
                    existingWords: 0,
                    failed: 0,
                    json_study: json_study,
                    targetFile: targetFile,
                    timestamp: new Date().toISOString()
                };
            }
        }

        // 5. 批量添加到目标文件
        const result = await batchAddWordsToServer(
            wordList,
            token,
            targetFile, // 动态生成的目标文件
            (progress, currentWord) => {
                // 进度回调
                console.log(`进度: ${progress.saved}/${progress.total}, 当前处理: ${currentWord}`);
            }
        );

        // 6. 返回结果
        return {
            success: result.success,
            message: result.success
                ? `成功添加 ${result.savedCount} 个新单词到 ${targetFile} (${existingCount}个已存在)`
                : `添加失败: ${result.error || '未知错误'}`,
            ...result,
            json_study: json_study,
            targetFile: targetFile,
            newWords: result.savedCount || 0,
            existingWords: existingCount,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('添加单词到复习列表失败:', error);
        return {
            success: false,
            message: `操作失败: ${error.message}`,
            savedCount: 0,
            total: 0,
            newWords: 0,
            existingWords: 0,
            failed: 0,
            error: error.message,
            json_study: json_study,
            timestamp: new Date().toISOString()
        };
    }
};

// 更新单词测试结果到服务器
export const updateTestResultToServer = async (word, chinese, isCorrect, currentStats, targetFile = 'me_word_index', token) => {
    try {

        if (!token) {
            console.warn('未检测到token');
            return false;
        }

        // 基于当前统计计算新值
        const newCorrectCount = isCorrect ?
            (currentStats.correct_count || 0) + 1 :
            (currentStats.correct_count || 0);

        const newWrongCount = !isCorrect ?
            (currentStats.wrong_count || 0) + 1 :
            (currentStats.wrong_count || 0);

        // 增加抽取次数
        const newExtractionCount = (currentStats.extraction_count || 0) + 1;

        // 准备更新的数据
        const wordData = {
            chinese: chinese || currentStats.chinese || '',
            extraction_count: currentStats.extraction_count,
            correct_count: newCorrectCount,
            wrong_count: newWrongCount,
            time: new Date().toISOString()
        };
        console.log('回答的大11111111111111111111', targetFile)
        // 发送更新请求
        const response = await fetch('https://www.ddstudent.xyz/server/english/update_word_review', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                type: 'update',
                word: word,
                wordData: wordData,
                target: targetFile
            })
        });

        if (!response.ok) {
            throw new Error('更新失败');
        }

        const result = await response.json();
        return result.flag === 1;
    } catch (error) {
        console.error('更新测试结果失败:', error);
        return false;
    }
};

// 获取单词当前数据
export const getWordCurrentStats = async (word, token, targetFile) => {
    try {
        if (!token) {
            console.warn('未检测到token');
            return {
                chinese: '',
                extraction_count: 0,
                correct_count: 0,
                wrong_count: 0
            };
        }

        // 使用 F_get_review 获取数据
        const data = await F_get_review(token, targetFile.replace('.json', '')); // 移除可能的 .json 后缀

        // 检查数据格式
        // F_get_review 返回的是整个文件的数据，我们需要从中提取特定单词的数据
        let wordData = {};

        // 根据不同的数据结构格式处理
        if (data && typeof data === 'object') {
            // 格式1: {words: {word1: {...}, word2: {...}, ...}}
            if (data.words && typeof data.words === 'object') {
                wordData = data.words[word] || {};
            }
            // 格式2: {word1: {...}, word2: {...}, ...} (直接对象格式)
            else if (data[word]) {
                wordData = data[word];
            }
            // 格式3: 可能是数组格式或空对象
            else if (Array.isArray(data)) {
                // 如果是数组，查找包含该单词的对象
                const item = data.find(item =>
                    item.word === word ||
                    item.english === word ||
                    (item.data && item.data.word === word)
                );
                if (item) {
                    wordData = item.data || item;
                }
            }
        }

        // 解析数据
        let stats = {
            chinese: '',
            extraction_count: 0,
            correct_count: 0,
            wrong_count: 0
        };

        if (typeof wordData === 'object' && wordData !== null) {
            stats = {
                chinese: wordData.chinese || '',
                extraction_count: wordData.extraction_count || 0,
                correct_count: wordData.correct_count || 0,
                wrong_count: wordData.wrong_count || 0
            };
        } else if (typeof wordData === 'string') {
            // 如果是字符串格式，尝试解析
            if (wordData.includes('|')) {
                const parts = wordData.split('|');
                if (parts.length >= 5) {
                    stats = {
                        chinese: parts[0],
                        extraction_count: parseInt(parts[2]) || 0,
                        correct_count: parseInt(parts[3]) || 0,
                        wrong_count: parseInt(parts[4]) || 0
                    };
                } else {
                    stats.chinese = wordData;
                }
            } else {
                stats.chinese = wordData;
            }
        }

        return stats;
    } catch (error) {
        console.error('获取单词数据失败:', error);
        return {
            chinese: '',
            extraction_count: 0,
            correct_count: 0,
            wrong_count: 0
        };
    }
};