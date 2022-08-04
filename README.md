# soil

soil is schema language for REST and JSON api and swift / ~~kotlin~~ client code generator.

- [x] Short schema based REST api.
- [ ] Small and flexible client code.
- [ ] Write and run api testing scenario.

Other tools are more good if you want:

- **Speed**: don't use JSON, use [protobuf](https://developers.google.com/protocol-buffers).
- **GraphQL**: soil is not supporting GraphQL.
- **Complex api**: use [Open API Schema](https://www.openapis.org/) and around tools.

# .soil file

## Entity

Your REST resource is called Entity in soil.
For example, `User` resource on your REST api can is defined with .soil file.

```soil
entity User {

  field id: Integer
  mutable field name: String
}
```

- `entity`: start of Entity.
- `User`: entity name.
- `field id: Integer`: `User` entity has `id` property and it's Integer type.
- `mutable field name: String`: `User` entity has `name` **mutable** property and it's String type.

Single .soil file has multiple entity directive.

## Endpoint

Entity has mapped any endpoints on REST api.
You describe these on entity directive in .soil file.

```
entity User {

  ...

  endpoint GET /users {
    success {
      field users: List<User>
    }
  }
}
```

- `endpoint GET /users`: Endpoint. This endpoint accessed by GET method and `/users` path.
- `success` directive: successful response (status code 2xx) schema. like entity directive.

## Request and writer entity

In the REST api, most of the time there are two types of resource fields: writable and read-only.
In the POST and PUT methods, only the values of writable fields should be sent.
soil handles this difference by separating " read-time Entity" and "write-time Entity".

```soil
entity User {

  field id: Integer
  mutable field name: String
}
```

If entity has `mutable` or `writer` field, entity has write-time mode.
For example, this `User` entity exports as Swift code.

```swift
public final class User: Decodable {

    public let id: Int

    public let name: String

    public struct Writer: Encodable {

        public var name: String

        /// - Parameters:
        ///   - name: {no comment}
        public init(name: String) {
            self.name = name
        }
    }
}
```

`User` is read-time entity, `User.Writer` is write-time entity.

## Subtypes

soil supports tow ways to define subtype in the Entity.

### 1. use anonymous type `field` and `schema` directive

```soil
entity Book {
  field title: String
  field author: * { # `*` is anonymous type
    schema {
      field name: String
    }
  }
}
```

soil detect `Book` entity, and generate `Book.Author` (dynamic naming) inner entity.

### 2. use `inner` directive.

```soil
entity Book {
  field title: String
  field author: Author
  
  inner Author {
    field name: String
  }
}
```

soil detect `Book` entity and `Book.Author` inner entity.

# Installation

soil is written by nodejs.

```
$ npm install -g soil-schema
```

# Swift

soil supports Swift code generation.
Generated code has no dependencies, use your api request / response client class.

You run soil command in your cli, export swift code.

```
$ npx soil build
```

## with SoilSwift package

Instead of writing your own code, you can use [soil-swift](https://github.com/niaeashes/soil-swift).

```js soil.config.js
module.exports = {
  swift: {
    use: 'soil-swift',
  },
}
```
