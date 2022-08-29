# Enum

Enumeration in soil is defined with 'Enum' type definition string on the `field` definition body.

```
field <name>: Enum
```

## Simple Enum

`Enum` is a variant of self defined type, and it requires `enum` property in `field` block.

### soil

```soil
entity Post {
  field title: String
  field body: String

  field status: Enum {
    enum [publish, draft]
  }

}
```

### Swift

```swift
import Foundation

public final class Post: Decodable {

    public let title: String

    public let body: String

    public let status: StatusValue

    public enum StatusValue: String, Codable {
        case publish = "publish"
        case draft = "draft"
    }
}
```

### mock

```json
{
  "title": "string",
  "body": "string",
  "status": "publish"
}
```