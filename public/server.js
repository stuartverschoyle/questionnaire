const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const nodemailer = require('nodemailer');
const pplx = require('@api/pplx');
require('dotenv').config();

pplx.auth(process.env.PERPLEXITY_API_KEY);

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());

app.post('/generate-overview', async (req, res) => {
  const { prompt, email } = req.body;
  const scrapedData = await scrapeWebsite('https://vistajet.com');
  const combinedPrompt = createCombinedPrompt(prompt, scrapedData);

  // Generate AI overview using Perplexity AI
  let overview;
  try {
    overview = await generateAIOverview(combinedPrompt);
  } catch (error) {
    console.error('Error generating AI overview:', error);
    res.status(500).json({ message: 'Failed to generate AI overview', error: error.message || error });
    return;
  }

  // Send email with the overview
  try {
    await sendEmail(email, overview);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message || error });
  }
});

async function scrapeWebsite(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    // Extract relevant data from the website
    const paragraphs = $('p').map((i, el) => $(el).text()).get();
    return paragraphs.join(' ');
  } catch (error) {
    console.error('Error scraping website:', error);
    return '';
  }
}

function createCombinedPrompt(userAnswers, scrapedData) {
  // Create a detailed prompt combining user answers and scraped data
  return `
    The user has provided the following answers to the questionnaire:
    ${userAnswers}

    Based on the information from the VistaJet website, summarize all the benefits and accommodating facilities that VistaJet can offer. Here is the information from the VistaJet website:
    ${scrapedData}

    Please provide a concise and comprehensive overview that combines the user's answers with the benefits and facilities offered by VistaJet in the form of a professional email signed off by The VistaJet Team. The email should have a call to action to contact the company. Dont have any * or ** in the email and increase the amount of information given. the contact email is privateworld@vistajet.com, Dont have a subject in the email body, start the email Dear Sir/Madam. Dont list the personal details provided or have any lits in the email response. Just a well layed out email. keep the email fewer than 200 words
  `;
}

async function generateAIOverview(prompt) {
  try {
    const { data } = await pplx.post_chat_completions({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: 'Be precise and concise.' },
        { role: 'user', content: prompt }
      ]
    });
    return data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    throw new Error('An error occurred while generating the overview.');
  }
}

async function sendEmail(recipient, overview) {
  // Configure the email transport using Hotmail
  const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: process.env.HOTMAIL_USER, // Use environment variables
      pass: process.env.HOTMAIL_PASS  // Use environment variables
    }
  });

  // Email options
  const mailOptions = {
    from: process.env.HOTMAIL_USER, // Use environment variables
    to: recipient,
    subject: 'Your Overview',
    text: overview
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

const PORT = 3000; // Change the port if needed
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
