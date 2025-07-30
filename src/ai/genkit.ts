import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase/plugin';
import { config } from 'dotenv';

config();

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI()
  ],
  model: 'googleai/gemini-2.0-flash',
});
