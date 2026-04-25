import 'dotenv/config';
import Groq from 'groq-sdk';
import { Mistral } from '@mistralai/mistralai';

const MODELS = {
  mistral: {
    primary: process.env.MISTRAL_MODEL_PRIMARY || "mistral-large-latest",
  },
  groq: {
    primary: process.env.GROQ_MODEL_PRIMARY || "llama-3.3-70b-versatile",
  }
};

async function testMistral() {
  console.log('Testing Mistral Primary:', MODELS.mistral.primary);
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  try {
    const response = await client.chat.complete({
      model: MODELS.mistral.primary,
      messages: [{ role: 'user', content: 'Say "Mistral OK".' }],
      maxTokens: 10,
    });
    console.log('Mistral Response:', response.choices?.[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('Mistral Error:', error);
    return false;
  }
}

async function testGroq() {
  console.log('Testing Groq Primary:', MODELS.groq.primary);
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const response = await client.chat.completions.create({
      model: MODELS.groq.primary,
      messages: [{ role: 'user', content: 'Say "Groq OK".' }],
      max_tokens: 10,
    });
    console.log('Groq Response:', response.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('Groq Error:', error);
    return false;
  }
}

async function run() {
  await testMistral();
  await testGroq();
}

run();
