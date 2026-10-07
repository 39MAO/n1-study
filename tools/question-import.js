const bankInput = document.querySelector("#bank-file");
const questionsInput = document.querySelector("#question-json");
const sourceInput = document.querySelector("#source-reference");
const reviewedInput = document.querySelector("#human-reviewed");
const validateButton = document.querySelector("#validate-import");
const downloadButton = document.querySelector("#download-import");
const status = document.querySelector("#import-status");
const preview = document.querySelector("#import-preview");

let preparedBank = null;
let preparedQuestions = null;
let targetFileName = "";

function invalidate() {
  preparedBank = null;
  preparedQuestions = null;
  downloadButton.disabled = true;
}

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try { resolve(JSON.parse(String(reader.result))); }
      catch { reject(new Error("现有题库文件不是有效 JSON。")); }
    });
    reader.addEventListener("error", () => reject(new Error("无法读取题库文件。")));
    reader.readAsText(file, "UTF-8");
  });
}

function checkQuestion(question, index, prefix, allowedCategories, ids) {
  const label = `第 ${index + 1} 题`;
  if (!question || typeof question !== "object" || Array.isArray(question)) throw new Error(`${label}：每个数组项目都必须是题目对象。`);
  const requiredText = ["category", "question", "explanation", "knowledge_point"];
  for (const key of requiredText) {
    if (typeof question[key] !== "string" || !question[key].trim()) throw new Error(`${label}：${key} 不能为空。`);
  }
  if (!allowedCategories.has(question.category)) throw new Error(`${label}：category「${question.category}」不属于所选题库。`);
  if (!Array.isArray(question.options) || question.options.length !== 4 || question.options.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`${label}：options 必须是 4 个非空选项。`);
  }
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) throw new Error(`${label}：answer 必须是 0 到 3 的整数。`);
  if (!Array.isArray(question.option_explanations) || question.option_explanations.length !== 4 || question.option_explanations.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`${label}：option_explanations 必须有 4 条非空说明。`);
  }
  const baseId = typeof question.id === "string" && question.id.trim() ? question.id.trim() : null;
  let id = baseId;
  if (!id) {
    let next = ids.size + 1;
    do { id = `${prefix}${String(next++).padStart(3, "0")}`; } while (ids.has(id));
  }
  if (ids.has(id)) throw new Error(`${label}：题目 ID「${id}」与现有题目或本批其他题目重复。`);
  ids.add(id);
  return { ...question, id, type: prefix === "v" ? "vocabulary" : "grammar", difficulty: question.difficulty || "N1" };
}

function updatePreview(lines) {
  preview.replaceChildren(...lines.map((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    return item;
  }));
}

async function validateImport() {
  invalidate();
  preview.replaceChildren();
  try {
    const file = bankInput.files[0];
    if (!file) throw new Error("请先选择 vocabulary.json 或 grammar.json。 ");
    const bank = await readJsonFile(file);
    if (!Array.isArray(bank)) throw new Error("现有题库的顶层结构应为 JSON 数组。");
    const isVocabulary = /vocab/i.test(file.name);
    const isGrammar = /grammar/i.test(file.name);
    if (!isVocabulary && !isGrammar) throw new Error("请用文件名为 vocabulary.json 或 grammar.json 的现有题库。 ");
    const prefix = isVocabulary ? "v" : "g";
    const ids = new Set(bank.map((question) => question.id).filter(Boolean));
    const parsed = JSON.parse(questionsInput.value);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("新题必须是至少包含一道题的 JSON 数组。");
    const categories = isVocabulary
      ? new Set(["kanji_reading", "word_meaning", "synonym", "word_usage"])
      : new Set(["grammar_form", "context_choice", "sentence_order"]);
    const added = parsed.map((question, index) => checkQuestion(question, index, prefix, categories, ids));
    const confirmed = reviewedInput.checked;
    const source = sourceInput.value.trim() || "JLPT N1 style reference; no question text retained";
    for (const question of added) {
      question.review_status = confirmed ? "human_checked" : "AI_checked";
      question.generation_method = "style_reference";
      question.source_reference = source;
      question.original_question = false;
      question.reviewed = confirmed;
    }
    preparedBank = [...bank, ...added];
    preparedQuestions = added;
    targetFileName = file.name;
    status.textContent = `检查通过：可加入 ${added.length} 道题。${confirmed ? "已标记为人工审核。" : "当前标记为 AI_checked，人工确认后才算 human_checked。"}`;
    updatePreview(added.map((question) => `${question.id} · ${question.category} · ${question.question.slice(0, 90)}`));
    downloadButton.disabled = false;
  } catch (error) {
    status.textContent = error instanceof SyntaxError ? "新题 JSON 格式有误，请检查逗号、引号和括号。" : error.message;
  }
}

bankInput.addEventListener("change", invalidate);
questionsInput.addEventListener("input", invalidate);
sourceInput.addEventListener("input", invalidate);
reviewedInput.addEventListener("change", invalidate);
validateButton.addEventListener("click", validateImport);
downloadButton.addEventListener("click", () => {
  if (!preparedBank || !preparedQuestions) return;
  const blob = new Blob([`${JSON.stringify(preparedBank, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = targetFileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = `已下载 ${targetFileName}，共 ${preparedBank.length} 道题（新增 ${preparedQuestions.length} 道）。用下载文件替换项目中同名文件即可。`;
});
