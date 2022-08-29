# Basic Entity

`Entity` is a single resource of your REST Api.

`Field` is a property definition on entity or another object schema in soil.

## User Entity

### soil

```soil
entity User {
  field id: Integer
  field name: String
}
```

### Swift

```swift
import Foundation

public final class User: Decodable {

    public let id: Int

    public let name: String
}
```

### mock

```mock
{
  "id": 1,
  "name": "string"
}
```