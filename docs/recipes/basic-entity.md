# Basic Entity

`Entity` is a single resource of your REST Api.

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