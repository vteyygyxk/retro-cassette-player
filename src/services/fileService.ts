/**
 * Retro Cassette Player - File Service
 * Handles file drag-and-drop, file selection, format validation, and metadata parsing
 */

import { parseBuffer } from 'music-metadata';
import type { Track, PlayerError } from '../types';
import { PlayerErrorType } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported audio format configuration
 */
export interface AudioFormat {
  extension: string;
  mimeType: string;
}

export interface ImageFormat {
  extension: string;
  mimeType: string;
}

/**
 * Audio metadata extracted from file
 */
export interface AudioMetadata {
  title: string;
  artist?: string;
  album?: string;
  year?: number;
  picture?: {
    format: string;
    data: string;
  };
  duration: number;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: PlayerError;
}

/**
 * File load result
 */
export interface FileLoadResult {
  track: Track;
  metadata: AudioMetadata;
}

/**
 * Callback for file load progress
 */
export type FileLoadProgressCallback = (progress: number) => void;

/**
 * Callback for file load error
 */
export type FileLoadErrorCallback = (error: PlayerError) => void;

// ============================================================================
// Constants
// ============================================================================

/**
 * Supported audio formats
 */
export const SUPPORTED_AUDIO_FORMATS: AudioFormat[] = [
  { extension: '.mp3', mimeType: 'audio/mpeg' },
  { extension: '.wav', mimeType: 'audio/wav' },
  { extension: '.ogg', mimeType: 'audio/ogg' },
  { extension: '.flac', mimeType: 'audio/flac' },
];

export const SUPPORTED_IMAGE_FORMATS: ImageFormat[] = [
  { extension: '.jpg', mimeType: 'image/jpeg' },
  { extension: '.jpeg', mimeType: 'image/jpeg' },
  { extension: '.png', mimeType: 'image/png' },
  { extension: '.webp', mimeType: 'image/webp' },
];

/**
 * Supported MIME types set for quick lookup
 */
const SUPPORTED_MIME_TYPES = new Set(
  SUPPORTED_AUDIO_FORMATS.map((f) => f.mimeType.toLowerCase())
);

const SUPPORTED_IMAGE_MIME_TYPES = new Set(
  SUPPORTED_IMAGE_FORMATS.map((f) => f.mimeType.toLowerCase())
);

/**
 * Supported extensions set for quick lookup
 */
const SUPPORTED_EXTENSIONS = new Set(
  SUPPORTED_AUDIO_FORMATS.map((f) => f.extension.toLowerCase())
);

const SUPPORTED_IMAGE_EXTENSIONS = new Set(
  SUPPORTED_IMAGE_FORMATS.map((f) => f.extension.toLowerCase())
);

// ============================================================================
// File Service Class
// ============================================================================

/**
 * FileService provides file handling capabilities for the audio player.
 * It handles drag-and-drop, file selection, format validation, and metadata parsing.
 */
export class FileService {
  private onProgressCallback: FileLoadProgressCallback | null = null;
  private onErrorCallback: FileLoadErrorCallback | null = null;

  // ========================================
  // Public API - Format Validation
  // ========================================

  /**
   * Check if a file extension is supported
   * @param filename - The filename or extension to check
   */
  isExtensionSupported(filename: string): boolean {
    const ext = this.getFileExtension(filename).toLowerCase();
    return SUPPORTED_EXTENSIONS.has(ext);
  }

  /**
   * Check if a MIME type is supported
   * @param mimeType - The MIME type to check
   */
  isMimeTypeSupported(mimeType: string): boolean {
    return SUPPORTED_MIME_TYPES.has(mimeType.toLowerCase());
  }

  /**
   * Check if an image helper file is supported
   * @param file - The file to check
   */
  isSupportedImageFile(file: File): boolean {
    const mimeType = file.type.toLowerCase();
    if (mimeType && SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
      return true;
    }

    const ext = this.getFileExtension(file.name).toLowerCase();
    return SUPPORTED_IMAGE_EXTENSIONS.has(ext);
  }

  /**
   * Validate a file for supported format
   * @param file - The file to validate
   */
  validateFile(file: File): FileValidationResult {
    // Check by MIME type first
    if (file.type && this.isMimeTypeSupported(file.type)) {
      return { valid: true };
    }

    // Fallback to extension check
    if (this.isExtensionSupported(file.name)) {
      return { valid: true };
    }

    // File format not supported
    return {
      valid: false,
      error: {
        type: PlayerErrorType.UNSUPPORTED_FORMAT,
        message: '不支持的文件格式，请选择MP3、WAV、OGG或FLAC文件',
        detail: `File: ${file.name}, Type: ${file.type || 'unknown'}`,
        recoverable: true,
      },
    };
  }

  /**
   * Validate multiple files
   * @param files - Array of files to validate
   * @returns Object with valid files and errors
   */
  validateFiles(files: File[]): {
    validFiles: File[];
    errors: PlayerError[];
  } {
    const validFiles: File[] = [];
    const errors: PlayerError[] = [];

    for (const file of files) {
      if (this.isSupportedImageFile(file)) {
        validFiles.push(file);
        continue;
      }

      const result = this.validateFile(file);
      if (result.valid) {
        validFiles.push(file);
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    return { validFiles, errors };
  }

  // ========================================
  // Public API - File Loading
  // ========================================

  /**
   * Load a single audio file and extract metadata
   * @param file - The audio file to load
   */
  async loadFile(file: File, imageCoverMap: Map<string, string> = new Map()): Promise<FileLoadResult> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw validation.error;
    }

    try {
      // Parse metadata
      const metadata = await this.parseMetadata(file);

      // Create track object
      const track: Track = {
        id: this.generateTrackId(file),
        name: metadata.title || this.getFileNameWithoutExtension(file.name),
        artist: metadata.artist,
        album: metadata.album,
        duration: metadata.duration,
        albumCover: metadata.picture?.data ?? imageCoverMap.get(this.getNormalizedBaseName(file.name)),
        audioUrl: URL.createObjectURL(file),
        file,
      };

      return { track, metadata };
    } catch (error) {
      const playerError: PlayerError = {
        type: PlayerErrorType.LOAD_FAILED,
        message: '文件加载失败，请重试',
        detail: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true,
      };
      throw playerError;
    }
  }

  /**
   * Load multiple audio files
   * @param files - Array of audio files to load
   */
  async loadFiles(files: File[]): Promise<FileLoadResult[]> {
    const audioFiles = files.filter((file) => this.validateFile(file).valid);
    const imageCoverMap = await this.buildImageCoverMap(
      files.filter((file) => this.isSupportedImageFile(file))
    );
    const results: FileLoadResult[] = [];
    const errors: PlayerError[] = [];

    for (let i = 0; i < audioFiles.length; i++) {
      try {
        const result = await this.loadFile(audioFiles[i], imageCoverMap);
        results.push(result);

        // Report progress
        if (this.onProgressCallback) {
          this.onProgressCallback((i + 1) / audioFiles.length);
        }
      } catch (error) {
        if (this.onErrorCallback && error && typeof error === 'object' && 'type' in error) {
          errors.push(error as PlayerError);
          this.onErrorCallback(error as PlayerError);
        }
      }
    }

    return results;
  }

  // ========================================
  // Public API - Metadata Parsing
  // ========================================

  /**
   * Parse audio metadata from a file
   * @param file - The audio file to parse
   */
  async parseMetadata(file: File): Promise<AudioMetadata> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    try {
      const metadata = await parseBuffer(uint8Array, file.type);

      // Extract picture if available
      let picture: { format: string; data: string } | undefined;
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        const base64 = this.arrayBufferToBase64(pic.data);
        picture = {
          format: pic.format,
          data: `data:${pic.format};base64,${base64}`,
        };
      }

      // Get duration from format or calculate
      const duration = metadata.format.duration || 0;

      return {
        title: metadata.common.title || '',
        artist: metadata.common.artist,
        album: metadata.common.album,
        year: metadata.common.year,
        picture,
        duration,
      };
    } catch (error) {
      // If metadata parsing fails, return basic info
      console.warn('Failed to parse metadata:', error);
      return {
        title: this.getFileNameWithoutExtension(file.name),
        duration: 0,
      };
    }
  }

  // ========================================
  // Public API - Drag and Drop
  // ========================================

  /**
   * Handle drag over event
   * @param event - Drag event
   */
  handleDragOver(event: DragEvent): boolean {
    event.preventDefault();
    event.stopPropagation();

    // Check if files are being dragged
    if (event.dataTransfer?.types.includes('Files')) {
      event.dataTransfer.dropEffect = 'copy';
      return true;
    }

    return false;
  }

  /**
   * Handle drop event and extract audio files
   * @param event - Drop event
   */
  async handleDrop(event: DragEvent): Promise<File[]> {
    event.preventDefault();
    event.stopPropagation();

    const files: File[] = [];

    if (event.dataTransfer?.files) {
      const fileList = Array.from(event.dataTransfer.files);
      const { validFiles } = this.validateFiles(fileList);
      files.push(...validFiles);
    }

    return files;
  }

  /**
   * Setup drag and drop handlers on an element
   * @param element - The DOM element to setup drag and drop on
   * @param onFilesDropped - Callback when files are dropped
   */
  setupDragDrop(
    element: HTMLElement,
    onFilesDropped: (files: File[]) => void
  ): () => void {
    const handleDragOver = (e: DragEvent) => {
      this.handleDragOver(e);
    };

    const handleDrop = async (e: DragEvent) => {
      const files = await this.handleDrop(e);
      if (files.length > 0) {
        onFilesDropped(files);
      }
    };

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    // Return cleanup function
    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }

  // ========================================
  // Public API - File Selection
  // ========================================

  /**
   * Open file picker dialog
   * @param multiple - Whether to allow multiple file selection
   */
  async openFilePicker(multiple: boolean = true): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;
      input.accept = [
        ...SUPPORTED_AUDIO_FORMATS.map((f) => f.extension),
        ...SUPPORTED_IMAGE_FORMATS.map((f) => f.extension),
      ].join(',');

      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        if (target.files) {
          const files = Array.from(target.files);
          const { validFiles } = this.validateFiles(files);
          resolve(validFiles);
        } else {
          resolve([]);
        }
      };

      input.oncancel = () => {
        resolve([]);
      };

      input.click();
    });
  }

  /**
   * Create a file input handler for React component
   * @param onFilesSelected - Callback when files are selected
   * @param _multiple - Whether to allow multiple file selection (unused but kept for API consistency)
   */
  createFileInputHandler(
    onFilesSelected: (files: File[]) => void,
    _multiple: boolean = true
  ): (event: React.ChangeEvent<HTMLInputElement>) => void {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      if (target.files) {
        const files = Array.from(target.files);
        const { validFiles, errors } = this.validateFiles(files);

        // Report errors
        errors.forEach((error) => {
          if (this.onErrorCallback) {
            this.onErrorCallback(error);
          }
        });

        if (validFiles.length > 0) {
          onFilesSelected(validFiles);
        }
      }

      // Reset input value to allow selecting the same file again
      target.value = '';
    };
  }

  // ========================================
  // Public API - Event Callbacks
  // ========================================

  /**
   * Set callback for load progress events
   * @param callback - Function to call on progress update
   */
  onProgress(callback: FileLoadProgressCallback): void {
    this.onProgressCallback = callback;
  }

  /**
   * Set callback for error events
   * @param callback - Function to call on error
   */
  onError(callback: FileLoadErrorCallback): void {
    this.onErrorCallback = callback;
  }

  // ========================================
  // Public API - Utility
  // ========================================

  /**
   * Get supported formats info
   */
  getSupportedFormats(): AudioFormat[] {
    return [...SUPPORTED_AUDIO_FORMATS];
  }

  /**
   * Revoke object URL to free memory
   * @param url - The object URL to revoke
   */
  revokeObjectUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(lastDot) : '';
  }

  /**
   * Get filename without extension
   */
  private getFileNameWithoutExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(0, lastDot) : filename;
  }

  /**
   * Generate unique track ID
   */
  private generateTrackId(_file: File): string {
    return `track-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private getNormalizedBaseName(filename: string): string {
    return this.getFileNameWithoutExtension(filename).toLowerCase();
  }

  private async buildImageCoverMap(files: File[]): Promise<Map<string, string>> {
    const coverMap = new Map<string, string>();

    for (const file of files) {
      const key = this.getNormalizedBaseName(file.name);
      if (coverMap.has(key)) {
        continue;
      }

      coverMap.set(key, await this.readFileAsDataUrl(file));
    }

    return coverMap;
  }

  private async readFileAsDataUrl(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = this.arrayBufferToBase64(new Uint8Array(arrayBuffer));
    const mimeType = file.type || 'application/octet-stream';
    return `data:${mimeType};base64,${base64}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let fileServiceInstance: FileService | null = null;

/**
 * Get the singleton file service instance
 */
export function getFileService(): FileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new FileService();
  }
  return fileServiceInstance;
}

/**
 * Reset the file service instance (useful for testing)
 */
export function resetFileService(): void {
  fileServiceInstance = null;
}
