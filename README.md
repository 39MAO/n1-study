# N1 Study

面向 JLPT N1 学习者的日语词汇与语法练习网站（个人试作项目）。

网站为独立学习项目，与 JLPT 官方无关。题目为原创内容，仍在持续检查与完善中。

## 第一版内容

- `data/vocabulary.json`：25 道原创词汇题。
- `data/grammar.json`：25 道原创语法题。
- `vocabulary/` 和 `grammar/`：两类练习页面。
- `css/styles.css`：页面样式和移动端适配。
- `vocabulary/quiz.js`：答题、反馈和成绩统计逻辑。

项目使用静态 HTML、CSS、JavaScript 和 JSON，不需要账号、数据库或后端服务。

## 本地预览

在项目目录中运行：

```powershell
python -m http.server 4173
```

然后在电脑浏览器打开 `http://localhost:4173/`。

## 题库维护

后续题目添加到 `data/vocabulary.json` 或 `data/grammar.json`。网站默认展示 `AI_checked` 和 `human_checked` 状态的题目。

