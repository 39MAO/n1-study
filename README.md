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

练习题保存在 `data/vocabulary.json` 和 `data/grammar.json`，顶层是 JSON 数组。新题沿用每题的现有结构：`id`、`type`、`category`、`question`、4 个 `options`、从 0 开始的 `answer`、`explanation`、4 条 `option_explanations`、`knowledge_point`、`difficulty` 和 `review_status`。

### 每天加入新标日内容

1. 按当天词汇/语法知识点生成原创题目；只参考公开 N1 题目的题型、难度和考点，不保存参考题正文，也不复制或轻微改写原题。官方真题不要放入公开题库。
2. 对照 `data/vocabulary.json` 或 `data/grammar.json` 的现有题目字段，把一批新题整理成 JSON 数组。
3. 打开 `tools/question-import.html`（首页不再显示入口，直接在网址后加上该路径访问），选择对应的现有 JSON 文件，粘贴新题并检查。导入器会检查必填字段、4 个选项、说明数量、类别和重复 ID，并自动生成 ID。
4. 逐题检查日语自然度、固定搭配、接续、唯一正确答案、干扰项，以及与参考题的相似度。只有确认整批完成人工检查后才勾选审核确认，再下载合并文件；未勾选的题会标成 `AI_checked`，勾选后标成 `human_checked`。
5. 用下载的文件替换相应题库文件，再提交到 GitHub。导入器只在本机浏览器处理文件，不会自动改写 GitHub 仓库。

导入器另为每道新题添加 `generation_method`、`source_reference`、`original_question` 和 `reviewed` 元数据；参考来源只记出题风格，不记录参考题正文。网站仍兼容目前没有这些元数据的旧题。

答错的题会按词汇/语法类别保存在当前浏览器的本地存储中；练习页面的“错题复习”可再次练习，答对后会从待复习列表移除。不同设备或浏览器之间不会自动同步。

答题页面提供“上一题”和“跳过”两个操作。跳过按答错计入成绩，并同样进入错题复习列表；返回已经作答或跳过的题目时会锁定选项并回显当时的解析，不能重答，避免回头改答案影响成绩。

题库网页预览需要通过本地 HTTP 服务打开，不能直接用 `file://` 打开。

