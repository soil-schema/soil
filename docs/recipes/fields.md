# Fields

`Field` is a property definition on entity or another object schema in soil, and have type definition string.

```
field <name>: <type-definition>
```

type definition string supports three types: primitive types, self defined type and reference type.

primitive types are:

|Name|Description|
|:---:|:---|
|`String`|-|
|`Integer`|-|
|`Number`|-|
|`Boolean`|`true` or `false`|

## Primitive Types

### soil

```soil
entity Person {
  field first_name: String
  field last_name: String
  field age: Integer
  field height: Number
  field weight: Number
  field lefty: Boolean
}
```

### Swift

|Soil|Swift|
|:---:|:---|
|`String`|`String`|
|`Integer`|`Int`|
|`Number`|`Double`|
|`Boolean`|`Bool`|

```swift
import Foundation

public final class Person: Decodable {

    public let firstName: String

    public let lastName: String

    public let age: Int

    public let height: Double

    public let weight: Double

    public let lefty: Bool
}
```

### mock

```json
{
  "first_name": "string",
  "last_name": "string",
  "age": 1,
  "height": 1,
  "weight": 1,
  "lefty": true
}
```

## Self Defined Type

Self defined type is a `Field` with `'*'` type definition string and has `schema` directive in its block.

### soil

```soil
entity Device {

  - Primitive fields
  field id: Integer
  field name: String

  - Self defined field
  field setting: * {
    - Define sub-schema with `schema` directive likes `entity` directive.
    schema {
      field type: String
    }
  }

  - Optional self defined field (in a word `nullable`)
  field mount_status: *? {
    schema {
      field timestamp: Date
      field slot: Integer
    }
  }
}
```

### Swift

Self defined types is converted inner `struct` in Swift.

```swift
import Foundation

public final class Device: Decodable {

    public let id: Int

    public let name: String

    public let setting: Setting

    public let mountStatus: MountStatus?

    public final class Setting: Decodable {

        public let type: String
    }

    public final class MountStatus: Decodable {

        public let timestamp: Date

        public let slot: Int
    }
}
```

### mock

```json
{
  "id": 1,
  "name": "string",
  "setting": {
    "type": "string"
  },
  "mount_status": null
}
```

## Reference Type

### soil

```soil
entity Article {

  field title: String
  field body: String

  - When field type is another entity name, it become reference type.
  field author: Author

  - Reference type supports inner directive and relative name.
  field comments: List<Comment>

  inner Comment {
    field commentee: String
    field body: String
  }
}

- [!] Not rendering on swift / mock sample code.
entity Author {
  field name: String
}
```

### Swift

```swift
import Foundation

public final class Article: Decodable {

    public let title: String

    public let body: String

    public let author: Author

    public let comments: Array<Comment>

    public final class Comment: Decodable {

        public let commentee: String

        public let body: String
    }
}
```

### mock

```json
{
  "title": "string",
  "body": "string",
  "author": {
    "name": "string"
  },
  "comments": [
    {
      "commentee": "string",
      "body": "string"
    }
  ]
}
```