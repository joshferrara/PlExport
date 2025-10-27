import axios, { AxiosInstance } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import type {
  PlexAuthPin,
  PlexUser,
  PlexServer,
  PlexLibrary,
  PlexCollection,
  PlexMediaContainer,
  MediaItem,
} from '@/types/plex';

const PLEX_API_URL = 'https://plex.tv/api/v2';
const PLEX_TV_URL = 'https://plex.tv';

export class PlexClient {
  private client: AxiosInstance;
  private authToken?: string;

  constructor(authToken?: string) {
    this.authToken = authToken;
    this.client = axios.create({
      headers: {
        'Accept': 'application/json',
        ...(authToken && { 'X-Plex-Token': authToken }),
      },
    });
  }

  // Authentication Methods
  async requestPin(clientIdentifier: string): Promise<PlexAuthPin> {
    const response = await this.client.post(
      `${PLEX_API_URL}/pins`,
      {
        strong: true,
      },
      {
        headers: {
          'X-Plex-Product': process.env.NEXT_PUBLIC_PLEX_PRODUCT || 'PlExport',
          'X-Plex-Client-Identifier': clientIdentifier,
        },
      }
    );
    return response.data;
  }

  async checkPin(pinId: number, clientIdentifier: string): Promise<PlexAuthPin> {
    const response = await this.client.get(`${PLEX_API_URL}/pins/${pinId}`, {
      headers: {
        'X-Plex-Client-Identifier': clientIdentifier,
        'X-Plex-Product': process.env.NEXT_PUBLIC_PLEX_PRODUCT || 'PlExport',
      },
    });
    return response.data;
  }

  async getUser(authToken: string): Promise<PlexUser> {
    const response = await this.client.get(`${PLEX_TV_URL}/users/account`, {
      headers: {
        'X-Plex-Token': authToken,
      },
    });

    // Parse XML response
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const parsed = parser.parse(response.data);
    const user = parsed.user;

    return {
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      title: user.title,
      email: user.email,
      thumb: user.thumb,
      authToken: user.authenticationToken || user.authToken,
    };
  }

  async getServers(authToken: string): Promise<PlexServer[]> {
    try {
      const resourcesResponse = await this.client.get(
        `${PLEX_TV_URL}/api/v2/resources`,
        {
          headers: {
            'X-Plex-Token': authToken,
            'Accept': 'application/json',
            'X-Plex-Product': process.env.NEXT_PUBLIC_PLEX_PRODUCT || 'PlExport',
            'X-Plex-Client-Identifier': process.env.NEXT_PUBLIC_PLEX_CLIENT_IDENTIFIER || 'plexport',
          },
          params: {
            includeHttps: 1,
            includeRelay: 0,
          },
        }
      );

      if (!resourcesResponse.data || !Array.isArray(resourcesResponse.data)) {
        return [];
      }

      return resourcesResponse.data
        .filter((resource: any) => resource.provides === 'server')
        .map((server: any) => ({
          name: server.name,
          host: server.connections?.[0]?.uri || '',
          address: server.connections?.[0]?.address || '',
          port: server.connections?.[0]?.port || 32400,
          machineIdentifier: server.clientIdentifier,
          version: server.productVersion,
          accessToken: server.accessToken,
        }));
    } catch (error) {
      console.error('Error fetching servers:', error);
      // Return empty array if no servers found instead of throwing
      return [];
    }
  }

  // Library Methods
  async getLibraries(serverUrl: string, authToken: string): Promise<PlexLibrary[]> {
    const response = await this.client.get(`${serverUrl}/library/sections`, {
      headers: {
        'X-Plex-Token': authToken,
      },
    });

    return response.data.MediaContainer.Directory || [];
  }

  async getLibraryContent<T extends MediaItem>(
    serverUrl: string,
    authToken: string,
    sectionKey: string,
    type?: string
  ): Promise<PlexMediaContainer<T>> {
    const response = await this.client.get(
      `${serverUrl}/library/sections/${sectionKey}/all`,
      {
        headers: {
          'X-Plex-Token': authToken,
        },
        params: type ? { type } : {},
      }
    );

    return response.data.MediaContainer;
  }

  async getCollections(
    serverUrl: string,
    authToken: string,
    sectionKey: string
  ): Promise<PlexCollection[]> {
    const response = await this.client.get(
      `${serverUrl}/library/sections/${sectionKey}/collections`,
      {
        headers: {
          'X-Plex-Token': authToken,
        },
      }
    );

    return response.data.MediaContainer.Metadata || [];
  }

  async getCollectionItems<T extends MediaItem>(
    serverUrl: string,
    authToken: string,
    collectionKey: string
  ): Promise<T[]> {
    const response = await this.client.get(`${serverUrl}${collectionKey}`, {
      headers: {
        'X-Plex-Token': authToken,
      },
    });

    return response.data.MediaContainer.Metadata || [];
  }

  async getPlaylists(
    serverUrl: string,
    authToken: string,
    playlistType?: string
  ): Promise<PlexCollection[]> {
    const response = await this.client.get(`${serverUrl}/playlists`, {
      headers: {
        'X-Plex-Token': authToken,
      },
      params: playlistType ? { playlistType } : {},
    });

    return response.data.MediaContainer.Metadata || [];
  }

  async getPlaylistItems<T extends MediaItem>(
    serverUrl: string,
    authToken: string,
    playlistKey: string
  ): Promise<T[]> {
    const response = await this.client.get(`${serverUrl}${playlistKey}/items`, {
      headers: {
        'X-Plex-Token': authToken,
      },
    });

    return response.data.MediaContainer.Metadata || [];
  }

  // Search Methods
  async searchLibrary<T extends MediaItem>(
    serverUrl: string,
    authToken: string,
    sectionKey: string,
    query: string
  ): Promise<T[]> {
    const response = await this.client.get(
      `${serverUrl}/library/sections/${sectionKey}/all`,
      {
        headers: {
          'X-Plex-Token': authToken,
        },
        params: {
          'title': query,
        },
      }
    );

    return response.data.MediaContainer.Metadata || [];
  }
}

export default PlexClient;
