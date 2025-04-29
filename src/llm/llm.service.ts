import { Injectable } from '@nestjs/common';

@Injectable()
export class LlmService {
  async chat(content: string) {
    const token = process.env.SILICONFLOW_KEY;
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    const body = {
      model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
      messages: [{ role: 'user', content: content }],
      stream: false,
      max_tokens: 16384,
    };
    const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      ...options,
      body: JSON.stringify(body),
    });
    return res.json();
  }
  async streamChat(content: string) {
    const token = process.env.SILICONFLOW_KEY;
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    const body = {
      // model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
      model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
      messages: [{ role: 'user', content: content }],
      stream: true,
      max_tokens: 16384,
    };
    const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      ...options,
      body: JSON.stringify(body),
    });
    return res.body ?? null;
  }
  async getEmbedding(text: string) {
    console.log(text);
    const token = process.env.SILICONFLOW_KEY;
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    const body = {
      model: 'BAAI/bge-m3',
      input: text,
    };
    const res = await fetch('https://api.siliconflow.cn/v1/embeddings', {
      ...options,
      body: JSON.stringify(body),
    });

    return res.json();
  }
}
