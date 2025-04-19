import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, AuthResponse, TokenResponse } from '../models/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  private getUserFromStorage(): User | null {
    const userId = localStorage.getItem('userId');
    return userId ? { id: userId } : null;
  }

  register(user: User): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, user)
      .pipe(
        tap(response => {
          if (response.success && response.accessToken) {
            this.setSession(response, user.id);
          }
        })
      );
  }

  login(user: User): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, user)
      .pipe(
        tap(response => {
          if (response.success && response.accessToken) {
            this.setSession(response, user.id);
          }
        })
      );
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<TokenResponse>(`${this.apiUrl}/signin/new_token`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.success && response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
          }
        })
      );
  }

  getUserInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/info`);
  }

  logout(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/logout`)
      .pipe(
        tap(() => {
          this.clearSession();
          this.router.navigate(['/login']);
        })
      );
  }

  private setSession(authResult: AuthResponse, userId: string): void {
    localStorage.setItem('accessToken', authResult.accessToken!);
    if (authResult.refreshToken) {
      localStorage.setItem('refreshToken', authResult.refreshToken);
    }
    localStorage.setItem('userId', userId);
    this.currentUserSubject.next({ id: userId });
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}