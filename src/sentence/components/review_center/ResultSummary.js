// components/ResultSummary.js
import React, { useState, useEffect } from 'react';
import { resultStyles, prizeStyles } from './styles';

const ResultSummary = ({ testSentences, results, onRestart, onNewExtract, testMode }) => {
  const totalCount = testSentences.length;
  const correctCount = results.filter(r => r.isCorrect).length;
  const wrongCount = results.filter(r => !r.isCorrect).length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const isPerfect = correctCount === totalCount && totalCount > 0;
  
  const masteredInTest = testSentences.filter(s => s.pass).length;
  const unmasteredInTest = testSentences.filter(s => !s.pass).length;
  const masteredCorrect = results.filter((r, i) => r.isCorrect && testSentences[i].pass).length;
  const unmasteredCorrect = results.filter((r, i) => r.isCorrect && !testSentences[i].pass).length;

  const [showFireworks, setShowFireworks] = useState(isPerfect);

  useEffect(() => {
    if (isPerfect) {
      const timer = setTimeout(() => setShowFireworks(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isPerfect]);

  return (
    <div style={resultStyles.overlay}>
      {isPerfect && showFireworks && (
        <>
          <div style={prizeStyles.confetti}>
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                style={{
                  ...prizeStyles.confettiPiece,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: `hsl(${Math.random() * 60 + 30}, 100%, 50%)`,
                  width: `${Math.random() * 8 + 4}px`,
                  height: `${Math.random() * 8 + 4}px`
                }}
              />
            ))}
          </div>
          <div style={prizeStyles.goldPrize}>
            <div style={prizeStyles.trophy}>🏆</div>
            <div style={prizeStyles.goldText}>完美全对！</div>
            <div style={prizeStyles.goldSubtext}>获得黄金奖杯</div>
          </div>
        </>
      )}

      <div style={resultStyles.container}>
        <div style={resultStyles.header}>
          <span style={resultStyles.title}>
            {isPerfect ? '🎉 完美通关！' : `📊 ${testMode === 'listening' ? '听力' : '拼写'}测试完成`}
          </span>
          <span style={{
            ...resultStyles.score,
            color: isPerfect ? '#FFD700' : '#8b5cf6'
          }}>
            {accuracy}%
          </span>
        </div>

        <div style={resultStyles.statsGrid}>
          <div style={resultStyles.statCard}>
            <div style={resultStyles.statLabel}>总题数</div>
            <div style={resultStyles.statValue}>{totalCount}</div>
          </div>
          <div style={resultStyles.statCard}>
            <div style={resultStyles.statLabel}>正确</div>
            <div style={{...resultStyles.statValue, color: '#4CAF50'}}>{correctCount}</div>
          </div>
          <div style={resultStyles.statCard}>
            <div style={resultStyles.statLabel}>错误</div>
            <div style={{...resultStyles.statValue, color: '#f44336'}}>{wrongCount}</div>
          </div>
          <div style={resultStyles.statCard}>
            <div style={resultStyles.statLabel}>正确率</div>
            <div style={{
              ...resultStyles.statValue,
              color: isPerfect ? '#FFD700' : (accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FF9800' : '#f44336')
            }}>
              {accuracy}%
            </div>
          </div>
        </div>

        <div style={resultStyles.detailSection}>
          <div style={resultStyles.detailTitle}>📈 详细统计</div>
          <div style={resultStyles.detailRow}>
            <span>已掌握句子数：</span>
            <span style={resultStyles.detailValue}>{masteredInTest}</span>
          </div>
          <div style={resultStyles.detailRow}>
            <span>未掌握句子数：</span>
            <span style={resultStyles.detailValue}>{unmasteredInTest}</span>
          </div>
          <div style={resultStyles.detailRow}>
            <span>已掌握正确：</span>
            <span style={{...resultStyles.detailValue, color: '#4CAF50'}}>{masteredCorrect}</span>
          </div>
          <div style={resultStyles.detailRow}>
            <span>未掌握正确：</span>
            <span style={{...resultStyles.detailValue, color: '#FF9800'}}>{unmasteredCorrect}</span>
          </div>
        </div>

        {wrongCount > 0 && (
          <div style={resultStyles.wrongSection}>
            <div style={resultStyles.wrongTitle}>❌ 错题回顾</div>
            <div style={resultStyles.wrongList}>
              {results.map((result, index) => {
                if (!result.isCorrect) {
                  return (
                    <div key={index} style={resultStyles.wrongItem}>
                      <div style={resultStyles.wrongNumber}>{index + 1}.</div>
                      <div style={resultStyles.wrongContent}>
                        <div style={resultStyles.wrongText}>{testSentences[index].text}</div>
                        <div style={resultStyles.wrongChinese}>{testSentences[index].chinese}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        <div style={resultStyles.actions}>
          <button onClick={onNewExtract} style={resultStyles.extractButton}>
            🎲 重新抽取
          </button>
          <button onClick={onRestart} style={{
            ...resultStyles.restartButton,
            backgroundColor: isPerfect ? '#FFD700' : '#4CAF50',
            color: isPerfect ? '#333' : 'white'
          }}>
            {isPerfect ? '🏆 再拿一冠' : '🔄 再练一次'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultSummary;