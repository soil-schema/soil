# Swift Code Generation

## Swift Config: endpoint.mimeTypeMember

### config

```json
{
  "swift": {
    "endpoint": {
      "mimeTypeMember": "dataType"
    }
  }
}
```

### soil

```soil
entity UserImage {

  endpoint POST /user_images {
    request mime:image/jpeg
  }
}
```

### Swift

```swift
import Foundation

public final class UserImage: Codable {

    public init() {
    }

    public struct UserImagesEndpoint {

        /// UserImagesEndpoint.path: `/user_images`
        public let path: String

        /// UserImagesEndpoint.method: `POST`
        public let method: String = "POST"

        public var dataType: String? { "image/jpeg" }

        public init(body: Data) {
            self.path = "/user_images"
            self.body = body
        }

        public var body: Data

        public typealias Response = Void
    }
}
```