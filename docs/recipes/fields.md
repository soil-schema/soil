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

## Primitive types

### soil

```soil
entity Person {
  field firstName: String
  field lastName: String
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

    public let firstname: String

    public let lastname: String

    public let age: Int

    public let height: Double

    public let weight: Double

    public let lefty: Bool
}
```

### mock

```json
{
  "firstName": "string",
  "lastName": "string",
  "age": 1,
  "height": 1,
  "weight": 1,
  "lefty": true
}
```