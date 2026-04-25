import 'dotenv/config';
import Groq from 'groq-sdk';
import { Mistral } from '@mistralai/mistralai';

const MODELS = {
  mistral: {
    primary: process.env.MISTRAL_MODEL_PRIMARY || "mistral-large-latest",
    secondary: process.env.MISTRAL_MODEL_SECONDARY || "mistral-medium-latest",
    tertiary: process.env.MISTRAL_MODEL_TERTIARY || "mistral-small-latest",
    quaternary: process.env.MISTRAL_MODEL_QUATERNARY || "pixtral-12b-2409",
  },
  groq: {
    primary: process.env.GROQ_MODEL_PRIMARY || "llama-3.3-70b-versatile",
    secondary: process.env.GROQ_MODEL_SECONDARY || "llama-3.1-70b-versatile",
    tertiary: process.env.GROQ_MODEL_TERTIARY || "llama-3.1-8b-instant",
    quaternary: process.env.GROQ_MODEL_QUATERNARY || "mixtral-8x7b-32768",
  }
};

async function testMistral() {
  console.log('Testing Mistral Primary:', MODELS.mistral.primary);
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  try {
    const response = await client.chat.complete({
      model: MODELS.mistral.primary,
      messages: [{ role: 'user', content: 'Say "Mistral OK" if you are working.' }],
      maxTokens: 10,
    });
    console.log('Mistral Response:', response.choices?.[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('Mistral Error:', error.message);
    return false;
  }
}

async function testGroq() {
  console.log('Testing Groq Primary:', MODELS.groq.primary);
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const response = await client.chat.completions.create({
      model: MODELS.groq.primary,
      messages: [{ role: 'user', content: 'Say "Groq OK" if you are working.' }],
      max_tokens: 10,
    });
    console.log('Groq Response:', response.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('Groq Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('--- Starting AI Model Verification ---');
  const mOk = await testMistral();
  const gOk = await testGroq();
  console.log('--- Verification Complete ---');
  if (mOk && gOk) {
    console.log('✅ All primary models are working.');
  } else {
    console.log('❌ Some models failed. Check logs.');
    process.exit(1);
  }
}

runTests();
