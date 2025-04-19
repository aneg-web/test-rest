import { Component, OnInit } from '@angular/core';
import { FileService } from '../../services/file.service';
import { FileItem, FileListResponse } from '../../models/file';

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss']
})
export class FileManagerComponent implements OnInit {
  files: FileItem[] = [];
  pagination: any = null;
  loading = false;
  error = '';
  currentPage = 1;
  pageSize = 10;

  constructor(private fileService: FileService) { }

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading = true;
    this.error = '';

    this.fileService.getFiles(this.currentPage, this.pageSize).subscribe({
      next: (response: FileListResponse) => {
        this.files = response.files;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: error => {
        this.error = error.error?.message || 'Ошибка при загрузке файлов';
        this.loading = false;
      }
    });
  }

  onFileUploaded(event: any): void {
    this.loadFiles();
  }

  downloadFile(file: FileItem): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: error => {
        this.error = error.error?.message || 'Ошибка при скачивании файла';
      }
    });
  }

  deleteFile(file: FileItem): void {
    if (confirm(`Вы уверены, что хотите удалить файл ${file.originalName}?`)) {
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.loadFiles();
        },
        error: error => {
          this.error = error.error?.message || 'Ошибка при удалении файла';
        }
      });
    }
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.loadFiles();
  }

  getPageNumbers(): number[] {
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.currentPage;
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(currentPage - Math.floor(maxPages / 2), 1);
    let endPage = startPage + maxPages - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - maxPages + 1, 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Байт';

    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}