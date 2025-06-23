// app/lib/modules/llm/providers/ollama.ts

import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { logger } from '~/utils/logger';

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export default class OllamaProvider extends BaseProvider {
  name = 'Ollama';
  getApiKeyLink = 'https://ollama.com/download';
  labelForGetApiKey = 'Download Ollama';
  icon = 'i-ph:cloud-arrow-down';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
  };

  staticModels: ModelInfo[] = [];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'ANTHROPIC_API_KEY',
    });

    const response = await fetch(`${baseUrl}/api/tags`);
    const { models } = (await response.json()) as { models: OllamaModel[] };

    return models.map((model) => ({
      name: model.name,
      label: `${model.name} (${model.details.parameter_size})`,
      provider: this.name,
      maxTokenAllowed: 32768,
    }));
  }

  getModelInstance = ({ model, serverEnv }: { model: string; serverEnv?: Env }): LanguageModelV1 => {
    const baseURL = '/api/ollama'; // Proxied endpoint

    logger.debug('Using Ollama base URL:', baseURL);

    const ollamaInstance = ollama(model, {
      numCtx: this.getDefaultNumCtx(serverEnv),
    }) as LanguageModelV1 & { config: any };

    ollamaInstance.config.baseURL = baseURL;
    return ollamaInstance;
  };

  private getDefaultNumCtx(env?: Env): number {
    return env?.DEFAULT_NUM_CTX ? parseInt(env.DEFAULT_NUM_CTX as string, 10) : 32768;
  }
}
