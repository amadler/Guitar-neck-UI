import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AIResponse } from '../models/ai-response.model';
import { aiConfig } from '../../ai-config';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private http = inject(HttpClient);


  generateResponse(input: string): Observable<AIResponse> {
    const endpoint = `${aiConfig.endpoint}/${aiConfig.model}:generateContent`;
    return this.http.post<AIResponse>(endpoint, {
      contents: [{ text: input }],
      generationConfig: {
        temperature: aiConfig.temperature,
        maxOutputTokens: aiConfig.maxTokens
      }
    }, {
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`
      }
    });
  }
}
