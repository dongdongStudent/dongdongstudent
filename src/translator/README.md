你说得对，是 **8 个参数**：

| 序号 | 参数名 | 实际变量名 | 默认值 | 说明 |
|------|--------|-----------|--------|------|
| 1 | `open` | `open` | 无（必填） | 是否显示翻译器 |
| 2 | `onClose` | `onClose` | 无（必填） | 关闭回调 |
| 3 | `word` | `initialWord` | `''` | 初始单词 |
| 4 | `G_word_name` | `G_word_name` | `'word_reading_study'` | 单词本名称 |
| 5 | `onWordChange` | `onWordChange` | 无 | 单词变化回调 |
| 6 | `autoSpeak` | `autoSpeak` | `true` | 是否自动朗读 |
| 7 | `getToken` | `propGetToken` | `getToken` | 获取 token 的函数 |
| 8 | `defaultCompact` | `defaultCompact` | `true` | 默认是否简洁模式 |

## 注意

`word: initialWord = ''` 这种写法是 **参数重命名 + 默认值**：

- 外部传入时用 `word`
- 内部使用时叫 `initialWord`
- 如果不传，默认值是 `''`

所以外部使用时：

```jsx
<WordTranslator
  open={true}
  onClose={fn}
  word="hello"           // ← 外部用 word
  G_word_name="my_words"
  onWordChange={fn}
  autoSpeak={false}
  getToken={myGetToken}
  defaultCompact={false}
/>
```