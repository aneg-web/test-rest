import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/files']);
    }
  }

  ngOnInit(): void {
    // Инициализация формы с валидацией
    this.loginForm = this.formBuilder.group({
      id: ['', [
        Validators.required,
        Validators.pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|\+?[0-9]{10,15})$/)
      ]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/files']);
      },
      error: error => {
        this.error = error.error?.message || 'Ошибка при входе в систему';
        this.loading = false;
      }
    });
  }
}