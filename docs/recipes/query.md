# Query

`query` directive places in `endpoint` directive block. It defines URL query string key and value for the endpoint.

```
[required] query <name>: <type-definition>
```

`query` is optional in default. for example: `query filter: String` is actually parsed optional string (likes `String?`). If you want to define required query, use `required` annotation for `query` directive.

## Search with q query string API

### soil

```soil
entity Book {
  field title: String

  endpoint GET /books/search {
    query q: String
    query sort: Enum {
      enum [asc, desc]
    }
    success {
      field books: List<Book>
    }
  }
}
```

### Swift

```swift
import Foundation

public final class Book: Decodable {

    public let title: String

    public struct BooksSearchEndpoint {

        /// BooksSearchEndpoint.path: `/books/search`
        public let path: String

        /// BooksSearchEndpoint.method: `GET`
        public let method: String = "GET"

        public private(set) var queryData: Dictionary<String, String> = [:]

        public var q: String? = nil {
            didSet {
                guard let q = q else {
                    self.queryData.removeValue(forKey: "q")
                    return
                }
                self.queryData["q"] = q
            }
        }

        public var sort: SortValue? = nil {
            didSet {
                guard let sort = sort else {
                    self.queryData.removeValue(forKey: "sort")
                    return
                }
                self.queryData["sort"] = sort.rawValue
            }
        }

        public enum SortValue: String, Codable {
            case asc = "asc"
            case desc = "desc"
        }

        public init() {
            self.path = "/books/search"
        }

        public var body: Void

        public struct Response: Decodable {

            public let books: Array<Book>
        }
    }
}
```

### mock

```json
{
  "title": "string"
}
```

## Auto Query Stringify

### soil

```soil
entity Shop {
  field name: String
  field latitude: Number
  field longitude: Number
  field open: Boolean

  endpoint GET /shops {
    query latitude: Number
    query longitude: Number
    query open: Boolean
    success {
      field shops: List<Shop>
    }
  }
}
```

### Swift

```swift
import Foundation

public final class Shop: Decodable {

    public let name: String

    public let latitude: Double

    public let longitude: Double

    public let open: Bool

    public struct ShopsEndpoint {

        /// ShopsEndpoint.path: `/shops`
        public let path: String

        /// ShopsEndpoint.method: `GET`
        public let method: String = "GET"

        public private(set) var queryData: Dictionary<String, String> = [:]

        public var latitude: Double? = nil {
            didSet {
                guard let latitude = latitude else {
                    self.queryData.removeValue(forKey: "latitude")
                    return
                }
                self.queryData["latitude"] = "\(latitude)"
            }
        }

        public var longitude: Double? = nil {
            didSet {
                guard let longitude = longitude else {
                    self.queryData.removeValue(forKey: "longitude")
                    return
                }
                self.queryData["longitude"] = "\(longitude)"
            }
        }

        public var open: Bool? = nil {
            didSet {
                guard let open = open, open == true else {
                    self.queryData.removeValue(forKey: "open")
                    return
                }
                self.queryData["open"] = "1"
            }
        }

        public init() {
            self.path = "/shops"
        }

        public var body: Void

        public struct Response: Decodable {

            public let shops: Array<Shop>
        }
    }
}
```

### mock

```json
{
  "name": "string",
  "latitude": 1,
  "longitude": 1,
  "open": true
}
```

### Boolean Query Stringify

Boolean stringify handles different way depending on `api.booleanQuery` setting.

|`api.booleanQuery`|Description|
|`not-accepted`|if a soil schema has Boolean query parameter, crash soil command.|
|`numeric`|true sets query value `"1"`, false sets query value `"0"`.|
|`stringify`|Boolean value convert to string like `"true"` or `"false"`.|
|`set-only-true`|true sets query value `"1"`, but false remove key from query string.|
|`only-key`|true sets key but no-value likes `?key`. false remove key from query string.|