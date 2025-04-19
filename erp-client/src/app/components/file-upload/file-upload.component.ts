import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @Output() fileUploaded = new EventEmitter<any>();
  
  selectedFile: File | null = null;
  loading = false;
  progress = 0;
  error = '';
  success = '';

  constructor(private fileService: FileService) { }

  ngOnInit(): void {
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] ?? null;
    this.progress = 0;
    this.error = '';
    this.success = '';
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.error = 'Пожалуйста, выберите файл для загрузки';
      return;
    }

    this.loading = true;
    this.progress = 0;
    this.error = '';
    this.success = '';

    this.fileService.uploadFile(this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.success = 'Файл успешно загружен';
          this.loading = false;
          this.selectedFile = null;
          this.fileUploaded.emit(event.body);
          const fileInput = document.getElementById('file') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        }
      },
      error: error => {
        this.error = error.error?.message || 'Ошибка при загрузке файла';
        this.loading = false;
        this.progress = 0;
      }
    });
  }
}