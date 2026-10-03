import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import { ExtractionError, type StructuredCompletion } from './extractor';
import { EXTRACTION_INSTRUCTIONS } from './instructions';
import { ExtractionSchema } from './schema';

const FORMAT = zodTextFormat(ExtractionSchema, 'document_result');

export function openAiCompletion(client: OpenAI, model: string): StructuredCompletion {
  return async (ocrText, signal) => {
    try {
      const response = await client.responses.parse(
        {
          model,
          instructions: EXTRACTION_INSTRUCTIONS,
          input: [{ role: 'user', content: `OCR text:\n\n${ocrText}` }],
          text: { format: FORMAT },
          max_output_tokens: 32_000,
          store: false,
        },
        { signal },
      );
      if (response.status === 'incomplete') return null;
      return response.output_parsed ?? null;
    } catch (error) {
      // Transport, quota and server errors: the SDK has already retried transient ones.
      if (error instanceof OpenAI.APIError) throw new ExtractionError('provider', { cause: error });
      // Anything else came from parsing the model's output.
      return null;
    }
  };
}
