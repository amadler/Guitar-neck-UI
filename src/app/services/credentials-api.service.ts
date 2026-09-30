import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface CredentialsStatus {
  configured: boolean;
}

@Injectable({ providedIn: 'root' })
export class CredentialsApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  saveOpenRouterKey(apiKey: string): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.baseUrl}/api/credentials/openrouter`, { apiKey })
    );
  }

  getOpenRouterStatus(): Promise<CredentialsStatus> {
    return firstValueFrom(
      this.http.get<CredentialsStatus>(`${this.baseUrl}/api/credentials/openrouter/status`)
    );
  }

  deleteOpenRouterKey(): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/api/credentials/openrouter`)
    );
  }
}