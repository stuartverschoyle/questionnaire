async function generateOverview(prompt, email) {
  try {
    const response = await fetch('/.netlify/functions/generate-overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from server:', errorData);
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error fetching overview:', error);
    return 'An error occurred while generating the overview.';
  }
}

const questions = [
  { id: 1, text: "Do you have pets?", options: ["yes", "no"] },
  { id: 2, text: "Do you fly private?", options: ["yes", "no"] },
  { id: 3, text: "Where to?", options: ["USA", "Europe", "Asia"] },
  { id: 4, text: "Diet?", options: ["Vegan", "Meat", "Both"] },
  { id: 5, text: "Children?", options: ["yes", "no"] },
];

let step = 0;
const answers = {};

document.addEventListener('DOMContentLoaded', () => {
  showQuestion();

  document.getElementById('submit-email').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    if (email) {
      const prompt = createPrompt(answers);
      try {
        const message = await generateOverview(prompt, email);
        console.log(`Email: ${email}, Message: ${message}`);
        alert('Overview sent to your email!');
      } catch (error) {
        console.error('Error sending email:', error);
        alert('Failed to send overview. Please try again.');
      }
    }
  });
});

function showQuestion() {
  if (step < questions.length) {
    const questionContainer = document.getElementById('question-container');
    const question = questions[step];
    questionContainer.innerHTML = `
      <h2>${question.text}</h2>
      <ul>
        ${question.options.map(option => `<li onclick="handleAnswer('${question.id}', '${option}')">${option}</li>`).join('')}
      </ul>
    `;
  } else {
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('email-container').style.display = 'block';
  }
}

function handleAnswer(questionId, answer) {
  answers[questionId] = answer;
  step++;
  showQuestion();
}

function createPrompt(answers) {
  let prompt = "Here are the answers given by the user:\n";
  for (const [questionId, answer] of Object.entries(answers)) {
    const questionText = questions.find(q => q.id == questionId).text;
    prompt += `${questionText} Answer: ${answer}\n`;
  }
  prompt += "Please provide an overview based on these answers.";
  return prompt;
}
