export interface FileItem {
    id: string;
    filename: string;
    originalName: string;
    extension: string;
    mimeType: string;
    size: number;
    uploadDate: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface FileListResponse {
    success: boolean;
    pagination: {
      totalFiles: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
    files: FileItem[];
    error?: any;
  }
  
  export interface FileResponse {
    success: boolean;
    message?: string;
    file?: FileItem;
    error?: any;
  }