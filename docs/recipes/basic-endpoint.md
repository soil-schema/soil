# Basic Endpoint

`Endpoint` is HTTP Endpoint definition on the `Entity`.

## User Endpoints

### soil

```soil
entity Comment {
  field body: String

  - Endpoints always in `entity` directive.
  endpoint GET /comments {
    success {
      field comments: List<Comment>
    }
  }
}
```

### Swift

```swift
import Foundation

public final class Comment: Decodable {

    public let body: String

    public struct CommentsEndpoint {

        /// CommentsEndpoint.path: `/comments`
        public let path: String

        /// CommentsEndpoint.method: `GET`
        public let method: String = "GET"

        public init() {
            self.path = "/comments"
        }

        public var body: Void

        public struct Response: Decodable {

            public let comments: Array<Comment>
        }
    }
}
```

### mock

```json
{
  "body": "string"
}
```