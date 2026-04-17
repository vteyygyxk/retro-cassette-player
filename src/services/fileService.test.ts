/**
 * Retro Cassette Player - File Service Tests
 * Unit tests for file handling, validation, and metadata parsing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileService, getFileService, resetFileService, SUPPORTED_AUDIO_FORMATS } from './fileService';
import { PlayerErrorType } from '../types';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock File object with specified properties
 */
function createMockFile(
  name: string,
  type: string = '',
  size: number = 1024
): File {
  return new File(['x'.repeat(size)], name, { type });
}

/**
 * Create a mock audio file with valid format
 */
function createMockMp3File(): File {
  return createMockFile('test-song.mp3', 'audio/mpeg');
}

/**
 * Create a mock WAV file
 */
function createMockWavFile(): File {
  return createMockFile('test-audio.wav', 'audio/wav');
}

/**
 * Create a mock OGG file
 */
function createMockOggFile(): File {
  return createMockFile('test-music.ogg', 'audio/ogg');
}

/**
 * Create a mock FLAC file
 */
function createMockFlacFile(): File {
  return createMockFile('test-track.flac', 'audio/flac');
}

/**
 * Create a mock unsupported file
 */
function createMockUnsupportedFile(): File {
  return createMockFile('document.pdf', 'application/pdf');
}

function createMockImageFile(name: string = 'test-song.jpg', type: string = 'image/jpeg'): File {
  return createMockFile(name, type);
}

// ============================================================================
// Tests
// ============================================================================

describe('FileService', () => {
  let fileService: FileService;

  beforeEach(() => {
    resetFileService();
    fileService = getFileService();
  });

  // ========================================
  // Format Validation Tests
  // ========================================

  describe('Format Validation', () => {
    describe('isExtensionSupported', () => {
      it('should return true for .mp3 extension', () => {
        expect(fileService.isExtensionSupported('song.mp3')).toBe(true);
        expect(fileService.isExtensionSupported('.mp3')).toBe(true);
        expect(fileService.isExtensionSupported('SONG.MP3')).toBe(true);
      });

      it('should return true for .wav extension', () => {
        expect(fileService.isExtensionSupported('audio.wav')).toBe(true);
        expect(fileService.isExtensionSupported('.wav')).toBe(true);
      });

      it('should return true for .ogg extension', () => {
        expect(fileService.isExtensionSupported('music.ogg')).toBe(true);
        expect(fileService.isExtensionSupported('.ogg')).toBe(true);
      });

      it('should return true for .flac extension', () => {
        expect(fileService.isExtensionSupported('track.flac')).toBe(true);
        expect(fileService.isExtensionSupported('.flac')).toBe(true);
      });

      it('should return false for unsupported extensions', () => {
        expect(fileService.isExtensionSupported('document.pdf')).toBe(false);
        expect(fileService.isExtensionSupported('image.png')).toBe(false);
        expect(fileService.isExtensionSupported('video.mp4')).toBe(false);
        expect(fileService.isExtensionSupported('data.json')).toBe(false);
      });

      it('should return false for files without extension', () => {
        expect(fileService.isExtensionSupported('README')).toBe(false);
        expect(fileService.isExtensionSupported('')).toBe(false);
      });
    });

    describe('isMimeTypeSupported', () => {
      it('should return true for audio/mpeg MIME type', () => {
        expect(fileService.isMimeTypeSupported('audio/mpeg')).toBe(true);
        expect(fileService.isMimeTypeSupported('AUDIO/MPEG')).toBe(true);
      });

      it('should return true for audio/wav MIME type', () => {
        expect(fileService.isMimeTypeSupported('audio/wav')).toBe(true);
      });

      it('should return true for audio/ogg MIME type', () => {
        expect(fileService.isMimeTypeSupported('audio/ogg')).toBe(true);
      });

      it('should return true for audio/flac MIME type', () => {
        expect(fileService.isMimeTypeSupported('audio/flac')).toBe(true);
      });

      it('should return false for unsupported MIME types', () => {
        expect(fileService.isMimeTypeSupported('application/pdf')).toBe(false);
        expect(fileService.isMimeTypeSupported('image/png')).toBe(false);
        expect(fileService.isMimeTypeSupported('video/mp4')).toBe(false);
      });
    });

    describe('validateFile', () => {
      it('should validate MP3 file by MIME type', () => {
        const file = createMockMp3File();
        const result = fileService.validateFile(file);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should validate WAV file by MIME type', () => {
        const file = createMockWavFile();
        const result = fileService.validateFile(file);
        expect(result.valid).toBe(true);
      });

      it('should validate OGG file by MIME type', () => {
        const file = createMockOggFile();
        const result = fileService.validateFile(file);
        expect(result.valid).toBe(true);
      });

      it('should validate FLAC file by MIME type', () => {
        const file = createMockFlacFile();
        const result = fileService.validateFile(file);
        expect(result.valid).toBe(true);
      });

      it('should validate file by extension when MIME type is missing', () => {
        const file = createMockFile('song.mp3', ''); // Empty MIME type
        const result = fileService.validateFile(file);
        expect(result.valid).toBe(true);
      });

      it('should reject unsupported file format', () => {
        const file = createMockUnsupportedFile();
        const result = fileService.validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe(PlayerErrorType.UNSUPPORTED_FORMAT);
        expect(result.error?.recoverable).toBe(true);
      });
    });

    describe('validateFiles', () => {
      it('should separate valid and invalid files', () => {
        const files = [
          createMockMp3File(),
          createMockImageFile(),
          createMockUnsupportedFile(),
          createMockWavFile(),
        ];
        const result = fileService.validateFiles(files);

        expect(result.validFiles).toHaveLength(3);
        expect(result.errors).toHaveLength(1);
      });

      it('should return all files as valid when all are supported', () => {
        const files = [
          createMockMp3File(),
          createMockWavFile(),
          createMockOggFile(),
        ];
        const result = fileService.validateFiles(files);

        expect(result.validFiles).toHaveLength(3);
        expect(result.errors).toHaveLength(0);
      });

      it('should return all files as invalid when none are supported', () => {
        const files = [
          createMockUnsupportedFile(),
          createMockFile('doc.pdf', 'application/pdf'),
        ];
        const result = fileService.validateFiles(files);

        expect(result.validFiles).toHaveLength(0);
        expect(result.errors).toHaveLength(2);
      });

      it('should treat supported image files as valid helper files', () => {
        const files = [createMockImageFile('cover.png', 'image/png')];
        const result = fileService.validateFiles(files);

        expect(result.validFiles).toHaveLength(1);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle empty array', () => {
        const result = fileService.validateFiles([]);
        expect(result.validFiles).toHaveLength(0);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  // ========================================
  // File Loading Tests
  // ========================================

  describe('File Loading', () => {
    describe('loadFile', () => {
      it('should reject unsupported file format', async () => {
        const file = createMockUnsupportedFile();
        await expect(fileService.loadFile(file)).rejects.toMatchObject({
          type: PlayerErrorType.UNSUPPORTED_FORMAT,
        });
      });

      it('should create track with filename as title when no metadata', async () => {
        const file = createMockMp3File();
        const result = await fileService.loadFile(file);

        expect(result.track).toBeDefined();
        expect(result.track.name).toBe('test-song');
        expect(result.track.id).toBeDefined();
        expect(result.track.audioUrl).toBeDefined();
      });

      it('should create object URL for audio file', async () => {
        const file = createMockMp3File();
        const result = await fileService.loadFile(file);

        expect(result.track.audioUrl).toMatch(/^blob:/);
      });
    });

    describe('loadFiles', () => {
      it('should load multiple valid files', async () => {
        const files = [createMockMp3File(), createMockWavFile()];
        const results = await fileService.loadFiles(files);

        expect(results).toHaveLength(2);
        expect(results[0].track.name).toBeDefined();
        expect(results[1].track.name).toBeDefined();
      });

      it('should skip invalid files and continue loading', async () => {
        const files = [
          createMockMp3File(),
          createMockUnsupportedFile(),
          createMockWavFile(),
        ];
        const results = await fileService.loadFiles(files);

        // Should only have 2 valid results
        expect(results).toHaveLength(2);
      });

      it('should report progress during loading', async () => {
        const progressCallback = vi.fn();
        fileService.onProgress(progressCallback);

        const files = [createMockMp3File(), createMockWavFile()];
        await fileService.loadFiles(files);

        expect(progressCallback).toHaveBeenCalled();
      });

      it('should use a same-name image as fallback album cover when metadata has no picture', async () => {
        const parseMetadataSpy = vi.spyOn(fileService, 'parseMetadata');
        parseMetadataSpy
          .mockResolvedValueOnce({
            title: 'test-song',
            duration: 180,
          })
          .mockResolvedValueOnce({
            title: 'cover',
            duration: 0,
          });

        const results = await fileService.loadFiles([
          createMockMp3File(),
          createMockImageFile('test-song.jpg', 'image/jpeg'),
        ]);

        expect(results).toHaveLength(1);
        expect(results[0].track.albumCover).toMatch(/^data:image\/jpeg;base64,/);
      });

      it('should keep embedded album cover instead of replacing it with fallback image', async () => {
        const parseMetadataSpy = vi.spyOn(fileService, 'parseMetadata');
        parseMetadataSpy
          .mockResolvedValueOnce({
            title: 'test-song',
            duration: 180,
            picture: {
              format: 'image/png',
              data: 'data:image/png;base64,embedded',
            },
          })
          .mockResolvedValueOnce({
            title: 'cover',
            duration: 0,
          });

        const results = await fileService.loadFiles([
          createMockMp3File(),
          createMockImageFile('test-song.png', 'image/png'),
        ]);

        expect(results).toHaveLength(1);
        expect(results[0].track.albumCover).toBe('data:image/png;base64,embedded');
      });

      it('should ignore image-only files when creating playlist tracks', async () => {
        const results = await fileService.loadFiles([
          createMockImageFile('cover.jpg', 'image/jpeg'),
        ]);

        expect(results).toEqual([]);
      });
    });
  });

  // ========================================
  // Drag and Drop Tests
  // ========================================

  describe('Drag and Drop', () => {
    describe('handleDragOver', () => {
      it('should prevent default and return true for file drag', () => {
        const event = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { types: ['Files'], dropEffect: '' },
        } as unknown as DragEvent;

        const result = fileService.handleDragOver(event);

        expect(result).toBe(true);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should return false for non-file drag', () => {
        const event = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { types: ['text/plain'], dropEffect: '' },
        } as unknown as DragEvent;

        const result = fileService.handleDragOver(event);

        expect(result).toBe(false);
      });
    });

    describe('handleDrop', () => {
      it('should extract valid audio files from drop event', async () => {
        const files = [createMockMp3File(), createMockWavFile()];
        const event = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files },
        } as unknown as DragEvent;

        const result = await fileService.handleDrop(event);

        expect(result).toHaveLength(2);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should filter out unsupported files from drop', async () => {
        const files = [createMockMp3File(), createMockUnsupportedFile()];
        const event = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files },
        } as unknown as DragEvent;

        const result = await fileService.handleDrop(event);

        expect(result).toHaveLength(1);
      });

      it('should handle empty drop', async () => {
        const event = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [] },
        } as unknown as DragEvent;

        const result = await fileService.handleDrop(event);

        expect(result).toHaveLength(0);
      });
    });

    describe('setupDragDrop', () => {
      it('should setup event listeners on element', () => {
        const element = {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as HTMLElement;

        const cleanup = fileService.setupDragDrop(element, () => {});

        expect(element.addEventListener).toHaveBeenCalledWith('dragover', expect.any(Function));
        expect(element.addEventListener).toHaveBeenCalledWith('drop', expect.any(Function));

        // Test cleanup
        cleanup();
        expect(element.removeEventListener).toHaveBeenCalled();
      });
    });
  });

  // ========================================
  // File Selection Tests
  // ========================================

  describe('File Selection', () => {
    describe('openFilePicker', () => {
      it('should create file input with correct attributes', async () => {
        // Mock the click to immediately trigger onchange
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tag) => {
          const element = originalCreateElement(tag);
          if (tag === 'input') {
            // Simulate immediate file selection
            Object.defineProperty(element, 'files', {
              value: [createMockMp3File()],
              writable: false,
            });
            setTimeout(() => {
              element.dispatchEvent(new Event('change'));
            }, 0);
          }
          return element;
        });

        const files = await fileService.openFilePicker();

        expect(files).toBeDefined();
      });
    });

    describe('createFileInputHandler', () => {
      it('should create handler that extracts valid files', () => {
        const onFilesSelected = vi.fn();
        const handler = fileService.createFileInputHandler(onFilesSelected, true);

        const files = [createMockMp3File(), createMockWavFile()];
        const event = {
          target: {
            files,
            value: 'test',
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        handler(event);

        expect(onFilesSelected).toHaveBeenCalledWith(files);
      });

      it('should filter out invalid files', () => {
        const onFilesSelected = vi.fn();
        const handler = fileService.createFileInputHandler(onFilesSelected, true);

        const files = [createMockMp3File(), createMockUnsupportedFile()];
        const event = {
          target: {
            files,
            value: 'test',
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        handler(event);

        expect(onFilesSelected).toHaveBeenCalledWith([files[0]]);
      });

      it('should reset input value after selection', () => {
        const onFilesSelected = vi.fn();
        const handler = fileService.createFileInputHandler(onFilesSelected, true);

        const target = {
          files: [createMockMp3File()],
          value: 'test',
        } as unknown as HTMLInputElement;

        const event = {
          target,
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        handler(event);

        expect(target.value).toBe('');
      });
    });
  });

  // ========================================
  // Utility Tests
  // ========================================

  describe('Utility Methods', () => {
    describe('getSupportedFormats', () => {
      it('should return array of supported formats', () => {
        const formats = fileService.getSupportedFormats();

        expect(formats).toHaveLength(4);
        expect(formats).toEqual(SUPPORTED_AUDIO_FORMATS);
      });

      it('should return a copy of the formats array', () => {
        const formats1 = fileService.getSupportedFormats();
        const formats2 = fileService.getSupportedFormats();

        expect(formats1).not.toBe(formats2); // Different references
        expect(formats1).toEqual(formats2); // Same content
      });
    });

    describe('revokeObjectUrl', () => {
      it('should revoke blob URLs', () => {
        const url = 'blob:http://localhost/test';
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        fileService.revokeObjectUrl(url);

        expect(revokeSpy).toHaveBeenCalledWith(url);
        revokeSpy.mockRestore();
      });

      it('should not revoke non-blob URLs', () => {
        const url = 'http://localhost/test.mp3';
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        fileService.revokeObjectUrl(url);

        expect(revokeSpy).not.toHaveBeenCalled();
        revokeSpy.mockRestore();
      });
    });
  });

  // ========================================
  // Singleton Tests
  // ========================================

  describe('Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = getFileService();
      const instance2 = getFileService();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getFileService();
      resetFileService();
      const instance2 = getFileService();

      expect(instance1).not.toBe(instance2);
    });
  });
});
