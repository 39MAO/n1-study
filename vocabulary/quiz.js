const status = document.querySelector("#quiz-status");
const questionArea = document.querySelector("#question-area");
const count = document.querySelector("#question-count");
const category = document.querySelector("#question-category");
const prompt = document.querySelector("#question-prompt");
const options = document.querySelector("#answer-options");
const progressFill = document.querySelector("#progress-fill");
const feedback = document.querySelector("#answer-feedback");
const feedbackResult = document.querySelector("#feedback-result");
const feedbackExplanation = document.querySelector("#feedback-explanation");
const feedbackOptions = document.querySelector("#feedback-options");
const feedbackKnowledge = document.querySelector("#feedback-knowledge");
const previousButton = document.querySelector("#previous-question");
const skipButton = document.querySelector("#skip-question");
const nextButton = document.querySelector("#next-question");
const resultsScreen = document.querySelector("#results-screen");
const resultTotal = document.querySelector("#result-total");
const resultCorrect = document.querySelector("#result-correct");
const resultIncorrect = document.querySelector("#result-incorrect");
const resultRate = document.querySelector("#result-rate");
const restartButton = document.querySelector("#restart-practice");
const reviewButton = document.querySelector("#review-mistakes");
const reviewResultsButton = document.querySelector("#review-results-mistakes");

const categoryNamesByKind = {
  vocabulary: {
  kanji_reading: "漢字の読み方",
  word_meaning: "言葉の意味",
  synonym: "近い意味の言葉",
  word_usage: "言葉の用法",
  },
  grammar: {
    grammar_form: "文法形式判断",
    context_choice: "文脈に合う表現",
    sentence_order: "文の組み立て",
  },
};

const quizKind = document.body.dataset.quizKind ?? "vocabulary";
const questionDataUrl = document.body.dataset.quizData ?? "../data/vocabulary.json";
const categoryNames = categoryNamesByKind[quizKind] ?? categoryNamesByKind.vocabulary;

let questions = [];
let currentIndex = 0;
let allQuestions = [];
// 本轮每道题的作答记录：{ selectedIndex, isCorrect, skipped }，null 表示尚未作答。
let answers = [];
let sessionMistakeIds = new Set();
let isReviewSession = false;
const mistakeStorageKey = `n1-study:mistakes:${quizKind}`;

function loadMistakeIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(mistakeStorageKey) || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveMistakeIds(ids) {
  try { localStorage.setItem(mistakeStorageKey, JSON.stringify([...ids])); }
  catch { /* Practice remains available when browser storage is disabled. */ }
}

function refreshReviewButton() {
  reviewButton.hidden = false;
  reviewButton.textContent = isReviewSession ? "返回全部练习" : `错题复习（${loadMistakeIds().size}）`;
}

async function loadQuestions() {
  try {
    const response = await fetch(questionDataUrl);
    if (!response.ok) throw new Error("题库文件读取失败");

    const bank = await response.json();
    allQuestions = bank.filter((question) =>
      ["AI_checked", "human_checked"].includes(question.review_status),
    );

    if (allQuestions.length === 0) {
      status.textContent = "题目正在准备中，加入并审核后即可开始练习。";
      return;
    }

    startPractice(allQuestions);
    showQuestion();
  } catch (error) {
    status.textContent = "暂时无法读取题库。请通过本地网站预览打开此页面。";
  }
}

/** 开始一轮练习：重置进度与每题的作答记录。 */
function startPractice(list) {
  questions = list;
  currentIndex = 0;
  answers = new Array(list.length).fill(null);
  sessionMistakeIds = new Set();
  resultsScreen.hidden = true;
  feedback.hidden = true;
  status.hidden = true;
  questionArea.hidden = false;
}

function showQuestion() {
  const question = questions[currentIndex];
  const questionNumber = currentIndex + 1;

  status.hidden = true;
  questionArea.hidden = false;
  count.textContent = `第 ${questionNumber} / ${questions.length} 题`;
  refreshReviewButton();
  category.textContent = categoryNames[question.category] ?? (quizKind === "grammar" ? "文法" : "語彙");
  prompt.textContent = question.question;
  progressFill.style.width = `${(questionNumber / questions.length) * 100}%`;
  options.replaceChildren();

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "answer-option";
    button.type = "button";
    button.setAttribute("aria-pressed", "false");

    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = String.fromCharCode(65 + index);

    const text = document.createElement("span");
    text.className = "option-text";
    text.lang = "ja";
    text.textContent = option;

    button.append(letter, text);
    button.addEventListener("click", () => answerQuestion(index));
    options.append(button);
  });

  previousButton.disabled = currentIndex === 0;

  const record = answers[currentIndex];
  if (record) {
    // 已作答（含跳过）的题目：回看时锁定选项并展示解析。
    renderFeedback(record);
  } else {
    feedback.hidden = true;
    skipButton.hidden = false;
    skipButton.disabled = false;
  }
}

function answerQuestion(selectedIndex) {
  if (answers[currentIndex]) return;

  const question = questions[currentIndex];
  const isCorrect = selectedIndex === question.answer;
  answers[currentIndex] = { selectedIndex, isCorrect, skipped: false };
  recordMistake(question, isCorrect);
  renderFeedback(answers[currentIndex]);
}

function skipQuestion() {
  if (answers[currentIndex]) return;

  const question = questions[currentIndex];
  // 跳过按答错计入成绩，并进入错题复习列表。
  answers[currentIndex] = { selectedIndex: -1, isCorrect: false, skipped: true };
  recordMistake(question, false);
  renderFeedback(answers[currentIndex]);
}

function recordMistake(question, isCorrect) {
  const mistakes = loadMistakeIds();
  if (isCorrect) {
    if (isReviewSession) mistakes.delete(question.id);
  } else {
    mistakes.add(question.id);
    sessionMistakeIds.add(question.id);
  }
  saveMistakeIds(mistakes);
  refreshReviewButton();
}

function renderFeedback(record) {
  const question = questions[currentIndex];
  const answerButtons = [...options.querySelectorAll(".answer-option")];
  const isCorrect = record.isCorrect;
  const correctLetter = String.fromCharCode(65 + question.answer);

  answerButtons.forEach((button, index) => {
    button.disabled = true;
    button.setAttribute("aria-pressed", String(index === record.selectedIndex));

    if (index === question.answer) {
      button.classList.add("is-correct");
      appendOptionStatus(button, "正解");
    } else if (index === record.selectedIndex) {
      button.classList.add("is-incorrect");
      appendOptionStatus(button, "你的选择");
    }
  });

  if (record.skipped) {
    feedbackResult.textContent = `已跳过，本题记为答错。正确答案：${correctLetter}`;
  } else if (isCorrect) {
    feedbackResult.textContent = "回答正确！";
  } else {
    feedbackResult.textContent = `回答错误。正确答案：${correctLetter}`;
  }
  feedbackResult.classList.toggle("is-correct-text", isCorrect);
  feedbackResult.classList.toggle("is-incorrect-text", !isCorrect);
  feedbackExplanation.textContent = question.explanation;
  feedbackKnowledge.textContent = question.knowledge_point;
  feedbackOptions.replaceChildren();

  question.option_explanations.forEach((explanation, index) => {
    const item = document.createElement("li");
    const letter = String.fromCharCode(65 + index);
    item.textContent = `${letter}. ${explanation}`;
    if (index === question.answer) item.classList.add("correct-explanation");
    feedbackOptions.append(item);
  });

  nextButton.textContent = currentIndex === questions.length - 1
    ? "完成练习"
    : "下一题";
  skipButton.hidden = true;
  feedback.hidden = false;
  feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function appendOptionStatus(button, label) {
  const statusLabel = document.createElement("span");
  statusLabel.className = "option-status";
  statusLabel.textContent = label;
  button.append(statusLabel);
}

nextButton.addEventListener("click", () => {
  if (currentIndex === questions.length - 1) {
    showResults();
    return;
  }

  currentIndex += 1;
  showQuestion();
});

previousButton.addEventListener("click", () => {
  if (currentIndex === 0) return;

  currentIndex -= 1;
  showQuestion();
});

skipButton.addEventListener("click", skipQuestion);

function showResults() {
  const total = questions.length;
  const correct = answers.reduce(
    (sum, record) => sum + (record && record.isCorrect ? 1 : 0),
    0,
  );
  const incorrectCount = total - correct;
  const accuracy = Math.round((correct / total) * 100);

  resultTotal.textContent = String(total);
  resultCorrect.textContent = String(correct);
  resultIncorrect.textContent = String(incorrectCount);
  resultRate.textContent = `${accuracy}%`;
  reviewResultsButton.hidden = sessionMistakeIds.size === 0;
  questionArea.hidden = true;
  resultsScreen.hidden = false;
}

restartButton.addEventListener("click", () => {
  isReviewSession = false;
  startPractice(allQuestions);
  showQuestion();
});

function startMistakeReview(ids = [...loadMistakeIds()]) {
  const idSet = new Set(ids);
  const reviewList = allQuestions.filter((question) => idSet.has(question.id));
  if (reviewList.length === 0) {
    status.hidden = false;
    status.textContent = "太好了，目前没有待复习错题。";
    return;
  }
  isReviewSession = true;
  startPractice(reviewList);
  showQuestion();
}

reviewButton.addEventListener("click", () => {
  if (isReviewSession) {
    isReviewSession = false;
    startPractice(allQuestions);
    showQuestion();
    return;
  }
  startMistakeReview();
});

reviewResultsButton.addEventListener("click", () => startMistakeReview([...sessionMistakeIds]));

loadQuestions();

