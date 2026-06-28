import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MusicPatternApiService {
  private readonly API_URL = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getAvailableScales(): Observable<string[]> {
    return this.http.get<{scales: string[]}>(`${this.API_URL}/scales`).pipe(
      map(response => response.scales),
      catchError(this.handleError)
    );
  }

  getAvailableTriads(): Observable<string[]> {
    return this.http.get<{chords: string[]}>(`${this.API_URL}/chords`).pipe(
      map(response => response.chords),
      catchError(this.handleError)
    );
  }

  resolveScaleNotes(scaleName: string, rootNote: string): Observable<string[]> {
    const formattedName = this.formatName(scaleName);
    return this.http.get<{notes: string[]}>(`${this.API_URL}/scales/${formattedName}/${encodeURIComponent(rootNote)}`).pipe(
      map(response => response.notes),
      catchError(this.handleError)
    );
  }

  resolveChordNotes(triadType: string, rootNote: string): Observable<string[]> {
    const formattedName = this.formatName(triadType);
    return this.http.get<{notes: string[]}>(`${this.API_URL}/chords/${formattedName}/${encodeURIComponent(rootNote)}`).pipe(
      map(response => response.notes),
      catchError(this.handleError)
    );
  }

  private formatName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error(error.error?.error || 'An error occurred'));
  }
}
