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
const nextButton = document.querySelector("#next-question");
const resultsScreen = document.querySelector("#results-screen");
const resultTotal = document.querySelector("#result-total");
const resultCorrect = document.querySelector("#result-correct");
const resultIncorrect = document.querySelector("#result-incorrect");
const resultRate = document.querySelector("#result-rate");
const restartButton = document.querySelector("#restart-practice");

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
let correctCount = 0;

async function loadQuestions() {
  try {
    const response = await fetch(questionDataUrl);
    if (!response.ok) throw new Error("题库文件读取失败");

    const allQuestions = await response.json();
    questions = allQuestions.filter((question) =>
      ["AI_checked", "human_checked"].includes(question.review_status),
    );

    if (questions.length === 0) {
      status.textContent = "题目正在准备中，加入并审核后即可开始练习。";
      return;
    }

    showQuestion();
  } catch (error) {
    status.textContent = "暂时无法读取题库。请通过本地网站预览打开此页面。";
  }
}

function showQuestion() {
  const question = questions[currentIndex];
  const questionNumber = currentIndex + 1;

  status.hidden = true;
  questionArea.hidden = false;
  feedback.hidden = true;
  count.textContent = `第 ${questionNumber} / ${questions.length} 题`;
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
    button.addEventListener("click", () => showFeedback(index));
    options.append(button);
  });
}

function showFeedback(selectedIndex) {
  const question = questions[currentIndex];
  const answerButtons = [...options.querySelectorAll(".answer-option")];
  const isCorrect = selectedIndex === question.answer;
  const correctLetter = String.fromCharCode(65 + question.answer);

  if (isCorrect) correctCount += 1;

  answerButtons.forEach((button, index) => {
    button.disabled = true;
    button.setAttribute("aria-pressed", String(index === selectedIndex));

    if (index === question.answer) {
      button.classList.add("is-correct");
      appendOptionStatus(button, "正解");
    } else if (index === selectedIndex) {
      button.classList.add("is-incorrect");
      appendOptionStatus(button, "你的选择");
    }
  });

  feedbackResult.textContent = isCorrect
    ? "回答正确！"
    : `回答错误。正确答案：${correctLetter}`;
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

function showResults() {
  const total = questions.length;
  const incorrectCount = total - correctCount;
  const accuracy = Math.round((correctCount / total) * 100);

  resultTotal.textContent = String(total);
  resultCorrect.textContent = String(correctCount);
  resultIncorrect.textContent = String(incorrectCount);
  resultRate.textContent = `${accuracy}%`;
  questionArea.hidden = true;
  resultsScreen.hidden = false;
}

restartButton.addEventListener("click", () => {
  currentIndex = 0;
  correctCount = 0;
  resultsScreen.hidden = true;
  questionArea.hidden = false;
  showQuestion();
});

loadQuestions();

