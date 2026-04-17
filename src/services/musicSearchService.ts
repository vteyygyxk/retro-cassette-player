/**
 * Music Search Service - Online music search via Netease Music API
 * Uses Vite dev server proxy to bypass CORS restrictions in development
 */

import type { Track, MusicSearchResult, MusicUrlResult } from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * API base URL - uses Vite proxy in development, direct API in production
 */
const isDev = import.meta.env.DEV;
const API_BASE = isDev ? '/api/netease' : 'https://music.163.com/api';

/**
 * Request timeout in milliseconds
 */
const REQUEST_TIMEOUT = 15000;

// ============================================================================
// Types
// ============================================================================

export interface NeteaseSearchSong {
  id: number;
  name: string;
  artists: { name: string; id: number }[];
  album: {
    name: string;
    id: number;
    picUrl?: string;
  };
  duration: number;
  fee: number;
}

export interface NeteaseUrlData {
  id: number;
  url: string | null;
  br: number;
  size: number;
  code: number;
  fee: number;
  type: string | null;
}

// ============================================================================
// Music Search Service
// ============================================================================

export class MusicSearchService {
  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }

      // Provide helpful error messages
      if (error.message.includes('Failed to fetch')) {
        if (!isDev) {
          throw new Error('在线搜索仅在开发模式下可用。\n请使用本地音频文件，或启动开发服务器。');
        }
        throw new Error('网络连接失败，请检查网络设置');
      }

      throw error;
    }
  }

  /**
   * Search for songs by keyword
   */
  async search(keyword: string, limit: number = 30): Promise<MusicSearchResult[]> {
    if (!keyword.trim()) return [];

    try {
      const params = new URLSearchParams({
        s: keyword,
        type: '1',
        limit: limit.toString(),
      });

      const url = `${API_BASE}/search/get?${params}`;
      const response = await this.fetchWithTimeout(url);
      const data = await response.json();
      const songs: NeteaseSearchSong[] = data?.result?.songs;

      if (!Array.isArray(songs)) {
        return [];
      }

      return songs.map((song) => ({
        id: song.id,
        name: song.name || '未知曲目',
        artist: song.artists?.map((a) => a.name).join(' / ') || '未知艺术家',
        album: song.album?.name || '',
        duration: song.duration || 0,
        fee: song.fee, // 0=free, 1=VIP, 8=free low quality
      }));
    } catch (error: any) {
      throw new Error(error.message || '搜索失败，请稍后重试');
    }
  }

  /**
   * Get the play URL for a song
   */
  async getSongUrl(id: number): Promise<MusicUrlResult | null> {
    const idsParam = encodeURIComponent(JSON.stringify([id]));
    const apiUrl = `${API_BASE}/song/enhance/player/url?id=${id}&ids=${idsParam}&br=320000`;

    try {
      const response = await this.fetchWithTimeout(apiUrl);

      if (!response.ok) return null;

      const data = await response.json();
      const urlData: NeteaseUrlData | undefined = data?.data?.[0];

      if (!urlData?.url) {
        return null;
      }

      // Convert HTTP to HTTPS to avoid mixed content issues
      let audioUrl = urlData.url;
      if (audioUrl.startsWith('http://')) {
        audioUrl = audioUrl.replace('http://', 'https://');
      }

      console.log('[DEBUG] Got audio URL:', audioUrl?.substring(0, 100));

      return {
        id: urlData.id,
        url: audioUrl,
        br: urlData.br || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Convert external audio URL to proxy URL if needed (for CORS bypass)
   */
  getProxiedAudioUrl(originalUrl: string): string {
    // The CDN supports CORS, just need to ensure HTTPS
    if (originalUrl.startsWith('http://')) {
      return originalUrl.replace('http://', 'https://');
    }
    return originalUrl;
  }

  /**
   * Get song detail including album cover
   */
  async getSongDetail(id: number): Promise<{ albumCover?: string } | null> {
    const idsParam = encodeURIComponent(JSON.stringify([id]));
    const url = `${API_BASE}/song/detail?ids=${idsParam}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) return null;

      const data = await response.json();
      const song = data?.songs?.[0];

      if (!song) return null;

      let albumCover = song.album?.picUrl || undefined;
      if (albumCover?.startsWith('http://')) {
        albumCover = albumCover.replace('http://', 'https://');
      }

      return { albumCover };
    } catch {
      return null;
    }
  }

  /**
   * Convert a search result to a Track object
   */
  async searchResultToTrack(result: MusicSearchResult): Promise<Track> {
    const [urlResult, detail] = await Promise.all([
      this.getSongUrl(result.id),
      this.getSongDetail(result.id),
    ]);

    if (!urlResult?.url) {
      throw new Error(`"${result.name}" 为 VIP 歌曲，无法播放`);
    }

    // Convert URL to proxied URL if needed for CORS bypass
    const audioUrl = this.getProxiedAudioUrl(urlResult.url);

    return {
      id: `online-${result.id}-${Date.now()}`,
      name: result.name,
      artist: result.artist,
      album: result.album || undefined,
      duration: result.duration / 1000,
      audioUrl: audioUrl,
      albumCover: detail?.albumCover,
    };
  }

  /**
   * Ensure an online track has album cover data before entering player state
   */
  async ensureTrackAlbumCover(track: Track, songId: number): Promise<Track> {
    if (track.albumCover) {
      return track;
    }

    const detail = await this.getSongDetail(songId);
    if (!detail?.albumCover) {
      return track;
    }

    return {
      ...track,
      albumCover: detail.albumCover,
    };
  }
}

// ============================================================================
// Singleton
// ============================================================================

let musicSearchServiceInstance: MusicSearchService | null = null;

export function getMusicSearchService(): MusicSearchService {
  if (!musicSearchServiceInstance) {
    musicSearchServiceInstance = new MusicSearchService();
  }
  return musicSearchServiceInstance;
}

export function resetMusicSearchService(): void {
  musicSearchServiceInstance = null;
}
