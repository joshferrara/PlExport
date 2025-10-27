// Plex API Types

export interface PlexUser {
  id: string;
  uuid: string;
  username: string;
  title: string;
  email: string;
  thumb: string;
  authToken: string;
}

export interface PlexServer {
  name: string;
  host: string;
  address: string;
  port: number;
  machineIdentifier: string;
  version: string;
  accessToken: string;
}

export interface PlexLibrary {
  key: string;
  type: 'movie' | 'show' | 'artist' | 'album' | 'photo';
  title: string;
  agent: string;
  scanner: string;
  language: string;
  uuid: string;
  updatedAt: number;
  createdAt: number;
  scannedAt: number;
}

export interface PlexCollection {
  ratingKey: string;
  key: string;
  guid: string;
  type: string;
  title: string;
  subtype: string;
  summary: string;
  index: number;
  thumb: string;
  addedAt: number;
  updatedAt: number;
  childCount: number;
}

export interface PlexMovie {
  ratingKey: string;
  key: string;
  guid: string;
  studio: string;
  type: string;
  title: string;
  contentRating: string;
  summary: string;
  rating: number;
  year: number;
  tagline: string;
  thumb: string;
  art: string;
  duration: number;
  originallyAvailableAt: string;
  addedAt: number;
  updatedAt: number;
  Genre?: PlexTag[];
  Director?: PlexTag[];
  Writer?: PlexTag[];
  Country?: PlexTag[];
  Role?: PlexTag[];
}

export interface PlexTVShow {
  ratingKey: string;
  key: string;
  guid: string;
  studio: string;
  type: string;
  title: string;
  contentRating: string;
  summary: string;
  index: number;
  rating: number;
  year: number;
  thumb: string;
  art: string;
  banner: string;
  theme: string;
  duration: number;
  originallyAvailableAt: string;
  leafCount: number;
  viewedLeafCount: number;
  childCount: number;
  addedAt: number;
  updatedAt: number;
  Genre?: PlexTag[];
  Role?: PlexTag[];
}

export interface PlexMusicArtist {
  ratingKey: string;
  key: string;
  guid: string;
  type: string;
  title: string;
  summary: string;
  index: number;
  thumb: string;
  art: string;
  addedAt: number;
  updatedAt: number;
  Genre?: PlexTag[];
  Country?: PlexTag[];
}

export interface PlexMusicAlbum {
  ratingKey: string;
  key: string;
  parentRatingKey: string;
  guid: string;
  parentGuid: string;
  studio: string;
  type: string;
  title: string;
  parentTitle: string;
  summary: string;
  index: number;
  rating: number;
  year: number;
  thumb: string;
  art: string;
  parentThumb: string;
  originallyAvailableAt: string;
  addedAt: number;
  updatedAt: number;
  Genre?: PlexTag[];
}

export interface PlexTag {
  tag: string;
}

export interface PlexMediaContainer<T> {
  size: number;
  allowSync: boolean;
  identifier: string;
  librarySectionID: number;
  librarySectionTitle: string;
  librarySectionUUID: string;
  mediaTagPrefix: string;
  mediaTagVersion: number;
  Metadata?: T[];
  Directory?: T[];
}

export interface PlexAuthPin {
  id: number;
  code: string;
  product: string;
  trusted: boolean;
  clientIdentifier: string;
  location: {
    code: string;
    country: string;
  };
  expiresIn: number;
  createdAt: string;
  expiresAt: string;
  authToken?: string;
}

export type MediaItem = PlexMovie | PlexTVShow | PlexMusicArtist | PlexMusicAlbum;

// Session types
export interface SessionData {
  authToken: string;
  userId: string;
  username: string;
}
