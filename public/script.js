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
  { id: 1, text: "How often do you travel by private jet?", options: ["25-49 hours per year", "50+ hours per year", "Less than 25 hours per year"] },
  { id: 2, text: "What is the primary purpose of your travel?", options: ["Business", "Leisure", "Mixed business and leisure"] },
  { id: 3, text: "What are your preferred travel destinations?", options: ["Global (multiple continents)", "Within my continent", "Specific country or region"] },
  { id: 4, text: "Are you currently a member of any private jet service or loyalty program?", options: ["Yes, with VistaJet", "Yes, with another provider", "No"] },
  { id: 5, text: "Which membership option interests you most?", options: ["VJ25 (25-49 hours/year)", "Program (50+ hours/year)", "On-demand charter"] },
  { id: 6, text: "What type of onboard experience do you value most?", options: ["Business suite", "Fine dining", "Wellness amenities"] },
  { id: 7, text: "Are you interested in bespoke experiences or curated voyages?", options: ["Yes, very interested", "Somewhat interested", "Not interested"] },
  { id: 8, text: "How important are VistaJet's environmental initiatives to you?", options: ["Very important", "Somewhat important", "Not a priority"] },
  { id: 9, text: "How important is 24/7 concierge service to you when traveling?", options: ["Essential", "Nice to have", "Not important"] },
  { id: 10, text: "Do you travel with pets?", options: ["Yes, frequently", "Occasionally", "No"] },
  { id: 11, text: "Are you interested in unique dining experiences while flying?", options: ["Very interested", "Somewhat interested", "Not a priority"] },
  { id: 12, text: "How important is wellness to you during travel?", options: ["Very important", "Somewhat important", "Not a priority"] },
  { id: 13, text: "Are you interested in exploring unique travel experiences beyond just flying?", options: ["Very interested", "Somewhat interested", "Not interested"] },
  { id: 14, text: "Would you like to receive information about exclusive Private World offerings?", options: ["Yes, regularly", "Occasionally", "No, thank you"] },
  { id: 15, text: "How did you hear about VistaJet?", options: ["Referral", "Online search", "Advertisement"] }
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
