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
 * Random keywords for "随心听" feature
 * A mix of popular artists, genres, and music-related terms
 */
const RANDOM_KEYWORDS = [
  // Popular artists (Chinese)
  '周杰伦', '林俊杰', '陈奕迅', '薛之谦', '毛不易', '邓紫棋', '华晨宇',
  '李荣浩', '张杰', '张碧晨', '许嵩', '汪苏泷', 'Taylor Swift', 'Ed Sheeran',
  // Music genres and moods
  '流行', '摇滚', '民谣', '电子', '轻音乐', '古风', '爵士', 'R&B',
  '治愈', '伤感', '励志', '浪漫', '安静', '动感', '怀旧',
  // Music elements
  '钢琴曲', '吉他', '小提琴', '纯音乐', '翻唱', '现场版',
  // Time periods
  '经典老歌', '90年代', '00年代', '金曲',
];

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
      sourceId: result.id,
      sourceType: 'netease',
      urlCreatedAt: Date.now(),
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

  /**
   * Get a random song for "随心听" (Random Play) feature
   * Randomly selects a keyword, searches, and returns a playable track
   */
  async getRandomSong(): Promise<Track> {
    // Pick a random keyword
    const randomKeyword = RANDOM_KEYWORDS[Math.floor(Math.random() * RANDOM_KEYWORDS.length)];
    console.log('[随心听] Searching with keyword:', randomKeyword);

    // Search with the random keyword
    const results = await this.search(randomKeyword, 50);

    if (results.length === 0) {
      throw new Error('未找到可播放的歌曲，请重试');
    }

    // Filter out VIP-only songs (fee=1) and shuffle
    const playableResults = results.filter((r) => r.fee !== 1);

    if (playableResults.length === 0) {
      throw new Error('当前搜索结果均为VIP歌曲，请重试');
    }

    // Shuffle and try to find a playable song
    const shuffled = playableResults.sort(() => Math.random() - 0.5);

    // Try up to 5 songs in case some URLs are unavailable
    const maxAttempts = Math.min(5, shuffled.length);

    for (let i = 0; i < maxAttempts; i++) {
      const result = shuffled[i];
      try {
        const track = await this.searchResultToTrack(result);
        const trackWithCover = await this.ensureTrackAlbumCover(track, result.id);
        console.log('[随心听] Found song:', track.name, '-', track.artist);
        return trackWithCover;
      } catch (err) {
        console.log('[随心听] Song not playable, trying next:', result.name);
        continue;
      }
    }

    throw new Error('未找到可播放的歌曲，请重试');
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
