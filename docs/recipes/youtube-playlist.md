# YouTube Playlist

This is test case for YouTube Playlists on YouTube API V3 by Google.

- https://developers.google.com/youtube/v3/docs/playlists

## YouTube Playlist Entity

### soil

- Define playlist resource as soil entity.
- Define list endpoint `GET /playlists`.

References:

- https://developers.google.com/youtube/v3/docs/playlists#resource-representation
- https://developers.google.com/youtube/v3/docs/playlists/list

```soil
entity Playlist {
  field kind: String {
    - constant "youtube#playlist"
  }
  - etag: etag
  field id: String

  field snippet: * {
    schema {
      field published_at: Timestamp
      field channel_id: String
      field title: String
      field description: String
      field thumbnails: Map<String, *> {
        schema {
          field url: String
          field width: Integer
          field height: Integer
        }
      }
      field channel_title: String
      field default_language: String
      field localized: * {
        schema {
          field title: String
          field description: String
        }
      }
    }
  }

  field status: * {
    schema {
      field privacy_status: Enum {
        enum [private, public, unlisted]
      }
    }
  }

  field content_details: * {
    schema {
      field item_count: Integer - unsigned integer
    }
  }

  field player: * {
    schema {
      field embed_html: String
    }
  }

  field localizations: Map<String, *> {
    schema {
      field title: String
      field description: String
    }
  }

  endpoint GET /playlists {
    success {
    field kind: String {
      - constant "youtube#playlistListResponse"
    }
    - etag: etag
    field next_page_token: String
    field prev_page_token: String
    field page_info: * {
      schema {
        field total_results: Integer
        field results_per_page: Integer
      }
    }
    field items: List<Playlist>
  }
}
```

### Swift

```swift
import Foundation

public final class Playlist: Decodable {

    public let kind: String

    public let id: String

    public let snippet: Snippet

    public let status: Status

    public let contentDetails: ContentDetail

    public let player: Player

    public let localizations: Dictionary<String, Localization>

    public final class Snippet: Decodable {

        public let publishedAt: Date

        public let channelId: String

        public let title: String

        public let description: String

        public let thumbnails: Dictionary<String, Thumbnail>

        public let channelTitle: String

        public let defaultLanguage: String

        public let localized: Localized

        public final class Thumbnail: Decodable {

            public let url: String

            public let width: Int

            public let height: Int
        }

        public final class Localized: Decodable {

            public let title: String

            public let description: String
        }
    }

    public final class Status: Decodable {

        public let privacyStatus: PrivacyStatusValue

        public enum PrivacyStatusValue: String, Codable {
            case private = "private"
            case public = "public"
            case unlisted = "unlisted"
        }
    }

    public final class ContentDetail: Decodable {

        public let itemCount: Int
    }

    public final class Player: Decodable {

        public let embedHtml: String
    }

    public final class Localization: Decodable {

        public let title: String

        public let description: String
    }

    public final class PageInfo: Decodable {

        public let totalResults: Int

        public let resultsPerPage: Int
    }

    public struct PlaylistsEndpoint {

        /// PlaylistsEndpoint.path: `/playlists`
        public let path: String

        /// PlaylistsEndpoint.method: `GET`
        public let method: String = "GET"

        public init() {
            self.path = "/playlists"
        }

        public var body: Void

        public struct Response: Decodable {

            public let kind: String

            public let nextPageToken: String

            public let prevPageToken: String

            public let pageInfo: PageInfo

            public let items: Array<Playlist>
        }
    }
}
```

### soil

```json
{
  "kind": "string",
  "id": "string",
  "snippet": {
    "channel_id": "string",
    "title": "string",
    "description": "string",
    "thumbnails": {
      "key": {
        "url": "string",
        "width": 1,
        "height": 1
      }
    },
    "channel_title": "string",
    "default_language": "string",
    "localized": {
      "title": "string",
      "description": "string"
    }
  },
  "status": {
    "privacy_status": "private"
  },
  "content_details": {
    "item_count": 1
  },
  "player": {
    "embed_html": "string"
  },
  "localizations": {
    "key": {
      "title": "string",
      "description": "string"
    }
  }
}
```