import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileListResponse, FileResponse } from '../models/file';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:3000/file';

  constructor(private http: HttpClient) { }

  getFiles(page: number = 1, listSize: number = 10): Observable<FileListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('list_size', listSize.toString());

    return this.http.get<FileListResponse>(`${this.apiUrl}/list`, { params });
  }

  getFileInfo(fileId: string): Observable<FileResponse> {
    return this.http.get<FileResponse>(`${this.apiUrl}/${fileId}`);
  }

  uploadFile(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const request = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true
    });

    return this.http.request(request);
  }

  updateFile(fileId: string, newFile: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', newFile);

    const request = new HttpRequest('PUT', `${this.apiUrl}/update/${fileId}`, formData, {
      reportProgress: true
    });

    return this.http.request(request);
  }

  deleteFile(fileId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${fileId}`);
  }

  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${fileId}`, {
      responseType: 'blob'
    });
  }
}