// Screens
const startScreen = document.querySelector("#start-screen");
const quizScreen = document.querySelector("#quiz-screen");
const resultScreen = document.querySelector("#result-screen");

// Quiz Configuration Elements
const countSelectEl = document.querySelector("#question-count");
const difficultySelectEl = document.querySelector("#difficulty");
const categorySelectEl = document.querySelector("#category");

// Loading Message
const loadingMessageEl = document.querySelector("#loading-message")

// Buttons
const startBtn = document.querySelector("#start-btn");
const restartBtn = document.querySelector("#restart-btn");

// Question & Options
const questionTextEL = document.querySelector("#question-text");
const currentQuestionEl = document.querySelector("#current-question");
const totalQuestionsEl = document.querySelector("#total-questions");

const scoreEl = document.querySelector("#score");

const optionsContainer = document.querySelector("#options-container");

// Progress Element
const progressEl = document.querySelector("#progress");

// Result Elements
const finalScoreEl = document.querySelector("#final-score");
const maxScoreEl = document.querySelector("#max-score");

const resultMessage = document.querySelector("#result-message");



// Questions
let quizQuestions = [
    {
        question: "What is the capital of France?",
        options: [
            { text: "London", correct: false },
            { text: "Berlin", correct: false },
            { text: "Paris", correct: true },
            { text: "Madrid", correct: false },
        ],
    },
    {
        question: "Which planet is known as the Red Planet?",
        options: [
            { text: "Venus", correct: false },
            { text: "Mars", correct: true },
            { text: "Jupiter", correct: false },
            { text: "Saturn", correct: false },
        ],
    },
    {
        question: "What is the largest ocean on Earth?",
        options: [
            { text: "Atlantic Ocean", correct: false },
            { text: "Indian Ocean", correct: false },
            { text: "Arctic Ocean", correct: false },
            { text: "Pacific Ocean", correct: true },
        ],
    },
    {
        question: "Which of these is NOT a programming language?",
        options: [
            { text: "Java", correct: false },
            { text: "Python", correct: false },
            { text: "Banana", correct: true },
            { text: "JavaScript", correct: false },
        ],
    },
    {
        question: "What is the chemical symbol for gold?",
        options: [
            { text: "Go", correct: false },
            { text: "Gd", correct: false },
            { text: "Au", correct: true },
            { text: "Ag", correct: false },
        ],
    },
];

// Categories
const categories = [
    {
        "id": 9,
        "name": "General Knowledge"
    },
    {
        "id": 10,
        "name": "Entertainment: Books"
    },
    {
        "id": 11,
        "name": "Entertainment: Film"
    },
    {
        "id": 12,
        "name": "Entertainment: Music"
    },
    {
        "id": 13,
        "name": "Entertainment: Musicals & Theatres"
    },
    {
        "id": 14,
        "name": "Entertainment: Television"
    },
    {
        "id": 15,
        "name": "Entertainment: Video Games"
    },
    {
        "id": 16,
        "name": "Entertainment: Board Games"
    },
    {
        "id": 17,
        "name": "Science & Nature"
    },
    {
        "id": 18,
        "name": "Science: Computers"
    },
    {
        "id": 19,
        "name": "Science: Mathematics"
    },
    {
        "id": 20,
        "name": "Mythology"
    },
    {
        "id": 21,
        "name": "Sports"
    },
    {
        "id": 22,
        "name": "Geography"
    },
    {
        "id": 23,
        "name": "History"
    },
    {
        "id": 24,
        "name": "Politics"
    },
    {
        "id": 25,
        "name": "Art"
    },
    {
        "id": 26,
        "name": "Celebrities"
    },
    {
        "id": 27,
        "name": "Animals"
    },
    {
        "id": 28,
        "name": "Vehicles"
    },
    {
        "id": 29,
        "name": "Entertainment: Comics"
    },
    {
        "id": 30,
        "name": "Science: Gadgets"
    },
    {
        "id": 31,
        "name": "Entertainment: Japanese Anime & Manga"
    },
    {
        "id": 32,
        "name": "Entertainment: Cartoon & Animations"
    }
]


// Quiz State Variable
let score = 0;
let currentQuestionIndex = 0;
let answerDisabled = false;

// -----------------------------------
// Load Categories
// -----------------------------------
function loadCategories() {
    categories.forEach((category) => {
        const option = document.createElement("option");

        option.value = category.id;
        option.textContent = category.name;

        categorySelectEl.append(option);
    });
}

loadCategories();

// -----------------------------------
// Get Questions 
// -----------------------------------
async function getQuestions(params) {
    apiURl = `https://opentdb.com/api.php?${params}`;

    const response = await fetch(apiURl);

    if (!response.ok) {
        throw new Error("Failed to fetch questions")
    };

    const data = await response.json();

    if (data.response_code !== 0) {
        throw new Error("No question availabe. Change the settings and try again")
    }

    const questions = data.results;

    let Questions = [];

    questions.forEach((question) => {
        const questionText = question.question;
        let options = [
            { text: question.correct_answer, correct: 'true' }
        ];

        question.incorrect_answers.forEach((answer) => {
            answerData = { text: answer, correct: 'false' }
            options.push(answerData);
        })

        options.sort(() => Math.random() - 0.5);

        questionDetails = {
            question: questionText,
            options: options
        }

        Questions.push(questionDetails)
    })

    return Questions;
}


// -----------------------------------
// Functions
// -----------------------------------

async function startQuiz() {
    if (startBtn.disabled === "true") {
        return;
    }

    startBtn.disabled = true;
    loadingMessageEl.classList.remove("error");
    loadingMessageEl.textContent = "Loading questions..."

    try {
        const params = new URLSearchParams({
            amount: countSelectEl.value,
            type: "multiple"
        });

        if (categorySelectEl.value) {
            params.set("category", categorySelectEl.value);
        }

        if (difficultySelectEl.value) {
            params.set("difficulty", difficultySelectEl.value);
        }

        quizQuestions = await getQuestions(params);

        currentQuestionIndex = 0;
        score = 0;
        scoreEl.textContent = 0;

        totalQuestionsEl.textContent = quizQuestions.length;

        startScreen.classList.remove('active');
        quizScreen.classList.add('active');

        showQuestion();

    } catch (error) {
        loadingMessageEl.classList.add("error");
        loadingMessageEl.textContent = error.message;
        
        startBtn.disabled = false;

    } finally { };
}

function restartQuiz() {
    startBtn.disabled = false;
    loadingMessageEl.textContent = "";

    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
}

function showQuestion() {
    answerDisabled = false;

    const currentQuestion = quizQuestions[currentQuestionIndex];

    currentQuestionEl.textContent = currentQuestionIndex + 1;

    questionTextEL.innerHTML = currentQuestion.question;

    // Clear options
    optionsContainer.innerHTML = '';
    optionsContainer.classList.remove("answered");

    currentQuestion.options.forEach(option => {
        const optionBtn = document.createElement('button');
        optionBtn.classList.add("option-btn");
        optionBtn.innerHTML = option.text;

        optionBtn.dataset.correct = option.correct;

        optionBtn.addEventListener('click', selectAnswer)

        optionsContainer.append(optionBtn);
    });
}

function selectAnswer(event) {
    if (answerDisabled) return;
    answerDisabled = true;

    optionsContainer.classList.add("answered");

    let btn = event.currentTarget;

    // Check Answer
    if (btn.dataset.correct === "true") {
        score++;
        scoreEl.textContent = score;

        btn.classList.add("correct");

    } else {
        btn.classList.add("wrong");

        Array.from(optionsContainer.children).forEach((button) => {
            if (button.dataset.correct === "true") {
                button.classList.add("correct");
            }
        });
    }

    currentQuestionIndex++;

    // progress
    let progressPercent = (currentQuestionIndex / quizQuestions.length) * 100;
    progressEl.style.width = progressPercent + '%';


    setTimeout(() => {
        if (currentQuestionIndex < quizQuestions.length) {
            showQuestion();

        } else {
            showResult();
        }
    }, 1000)
}


// Show Result Function
function showResult() {
    finalScoreEl.textContent = score;
    maxScoreEl.textContent = quizQuestions.length;

    let scorePercentage = (score / quizQuestions.length) * 100;

    if (scorePercentage === 100) {
        resultMessage.textContent = "Perfect! You're a genius!";

    } else if (scorePercentage >= 80) {
        resultMessage.textContent = "Great job! You know your stuff!";

    } else if (scorePercentage >= 60) {
        resultMessage.textContent = "Good effort! Keep leaning!";

    } else if (scorePercentage >= 40) {
        resultMessage.textContent = "Not bad! Try again to improve!";

    } else {
        resultMessage.textContent = "Keep studing! You have the potential!";
    }

    quizScreen.classList.remove("active");
    resultScreen.classList.add("active");
}

// -----------------------------------
startBtn.addEventListener('click', startQuiz);
restartBtn.addEventListener('click', restartQuiz);

