# soil

soil is schema language for REST and JSON api and swift / kotlin client code generator.

- Short schema based REST api.
- Small and flexible code generation.
- Write and run api testing scenarios.

Other tools are more good if you want:

- **Speed**: don't use JSON, use [protobuf](https://developers.google.com/protocol-buffers).
- **GraphQL**: soil is not supporting GraphQL.
- **Complex api**: use [Open API Schema](https://www.openapis.org/) and around tools.

# .soil file

## Entity

Your REST resource is called `Entity` and defined by `entity` keyword in soil.
For example, `User` resource on your REST api can is defined with .soil file.

```soil
entity User {

  field id: Integer
  mutable field name: String
}
```

- `entity`: start of Entity.
- `User`: entity name.
- `field id: Integer`: `User` entity has `id` Integer property.
- `mutable field name: String`: `User` entity has `name` **mutable** String property.

Single .soil file can contain multiple `entity` directives.

- Recipe: [Basic Entity](docs/recipes/basic-entity.md)

## Endpoint

Entity has mapped any endpoints on REST api.
Each `entity` directives can contain any `endpoint` directives.

```soil
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
- `success` directive: successful response (status code 2xx) schema. like `entity` directive.
- Recipe: [Basic Endpoint](docs/recipes/basic-endpoint.md)

## Request and writer entity

In the REST api, most of the time there are two types of resource fields: writable and read-only.
In the POST and PUT methods, only the values of writable fields should be sent.
soil handles this difference by separating "read-time Entity" and "write-time Entity".

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

    public var name: String

    public struct Writer: Encodable {

        public let name: String

        /// - Parameters:
        ///   - name: {no comment}
        public init(name: String) {
            self.name = name
        }
    }
}
```

`User` is read-time entity, `User.Writer` is write-time entity.

## Others

Each recipe presents a specific sample of soil schema detailed features.

- [Field](docs/recipes/fields.md)
- [Query](docs/recipes/query.md)
- [Enum](docs/recipes/enum.md)

# Installation

soil is written by nodejs and managed by npm.

```bash
$ npm install -g soil-schema
```

# Scenario runner

soil scneario runner helps you test REST api.

```bash
$ npx soil replay
```

## Write scenario file

```soil test-scenario.soil
scenario Test Scenario {
  GET /sample
}
```

soil http request to `GET /sample` endpoint.

## Parameter overrides

```
scenario Comment {
  GET /articles/search {
    query = Search Query Parameter
  }
  POST /comments {
    body = Comment body
  }
}
```

## Identifier endpoint

Use `id` directive in endpoint block, endpoint is identified by id string.
You use endpoint reference that join by dot notation entity name and endpoint id in scenario block.

```soil
entity User {
  field id: Int
  mutable field name: String

  POST /users {
    id register
    request {
      field user: User
    }
    success {
      field user: User
    }
  }
}

scenario Register User {
  User.register { # Actually it uses `POST /users` endpoint.
    name = User Name
  }
}
```

## `api` config

soil can be configured for your REST Api in the `api` section of `soil.config.js`.

|key|description|default
|:---|:---|:---
|api.base|Base URL for scenario runner. e.g. `https://api.example.com/v1`. Required for `replay` sub-command.|`undefined`
|api.booleanQuery|`Boolean` type parsing and stringify strategy.|`'set-only-true'`
|api.headers|Custom headers collection used by scenario runner.|`{}`

# Code Generation

You run soil generate command in your cli with target name, export code.

```
$ npx soil generate -g [target]
```

Supported targets are:

- Swift (`swift`)
- Kotlin (`kotlin`)

## Swift

soil supports Swift code generation.
Generated code has no dependencies, use your api request / response client class.

```
$ npx soil generate -g swift
```

### with SoilSwift package

Instead of writing your own code, you can use [soil-swift](https://github.com/niaeashes/soil-swift).

```js soil.config.js
module.exports = {
  swift: {
    use: ['soil-swift'],
  },
}
```

## Kotlin

soil supports Kotlin code generation.

```
$ npx soil generate -g kotlin
```
