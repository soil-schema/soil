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

## Standard CRUD

### soil

```soil
entity Note {
  field id: Integer
  mutable field body: String

  endpoint GET /notes {
    name list
    success {
      field notes: List<Note>
    }
  }

  endpoint GET /notes/$id {
    name fetch
    success {
      field note: Note
    }
  }

  endpoint POST /notes {
    name create
    request {
      field note: Note
    }
    success {
      field note: Note
    }
  }

  endpoint PUT /notes/$id {
    name update
    request {
      field note: Note
    }
    success {
      field note: Note
    }
  }

  endpoint DELETE /notes/$id {
    name destroy
  }
}
```

### Swift

```swift
import Foundation

public final class Note: Decodable {

    public let id: Int

    public var body: String

    public class Writer: Encodable {

        public var body: String

        /// - Parameters:
        ///   - body: {no comment}
        public init(body: String) {
            self.body = body
        }
    }

    public struct ListEndpoint {

        /// ListEndpoint.path: `/notes`
        public let path: String

        /// ListEndpoint.method: `GET`
        public let method: String = "GET"

        public init() {
            self.path = "/notes"
        }

        public var body: Void

        public struct Response: Decodable {

            public let notes: Array<Note>
        }
    }

    public struct FetchEndpoint {

        /// FetchEndpoint.path: `/notes/$id`
        public let path: String

        /// FetchEndpoint.method: `GET`
        public let method: String = "GET"

        /// - Parameters:
        ///   - id: {no comment}
        public init(id: Int) {
            self.path = "/notes/$id"
                .replacingOccurrences(of: "$id", with: "\(id)")
        }

        public var body: Void

        public struct Response: Decodable {

            public let note: Note
        }
    }

    public struct CreateEndpoint {

        /// CreateEndpoint.path: `/notes`
        public let path: String

        /// CreateEndpoint.method: `POST`
        public let method: String = "POST"

        public let body: RequestBody

        public init(body: () -> RequestBody) {
            self.path = "/notes"
            self.body = body()
        }

        public struct RequestBody: Encodable {

            let note: Note.Writer

            /// - Parameters:
            ///   - note: {no comment}
            public init(note: Note.Writer) {
                self.note = note
            }
        }

        public struct Response: Decodable {

            public let note: Note
        }
    }

    public struct UpdateEndpoint {

        /// UpdateEndpoint.path: `/notes/$id`
        public let path: String

        /// UpdateEndpoint.method: `PUT`
        public let method: String = "PUT"

        public let body: RequestBody

        /// - Parameters:
        ///   - id: {no comment}
        public init(id: Int, body: () -> RequestBody) {
            self.path = "/notes/$id"
                .replacingOccurrences(of: "$id", with: "\(id)")
            self.body = body()
        }

        public struct RequestBody: Encodable {

            let note: Note.Writer

            /// - Parameters:
            ///   - note: {no comment}
            public init(note: Note.Writer) {
                self.note = note
            }
        }

        public struct Response: Decodable {

            public let note: Note
        }
    }

    public struct DestroyEndpoint {

        /// DestroyEndpoint.path: `/notes/$id`
        public let path: String

        /// DestroyEndpoint.method: `DELETE`
        public let method: String = "DELETE"

        /// - Parameters:
        ///   - id: {no comment}
        public init(id: Int) {
            self.path = "/notes/$id"
                .replacingOccurrences(of: "$id", with: "\(id)")
        }

        public var body: Void

        public typealias Response = Void
    }
}
```

### mock

```json
{
  "id": 1,
  "body": "string"
}
```