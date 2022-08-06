import Foundation

public final class Author: Decodable {

    public let id: Int

    /// Author's name
    /// 
    /// Description of name field
    /// @todo Sample Comment
    public var name: String

    public var records: Array<Record>

    public var contact: Contact

    public final class Contact: Decodable {

        public let tel: String?

        public let email: String?
    }

    /// Author's history / biography record
    public final class Record: Decodable {

        public let timestamp: Date

        public let body: String
    }

    public struct Writer: Encodable {

        /// Author's name
        /// 
        /// Description of name field
        /// @todo Sample Comment
        public var name: String

        public var records: Array<Record>

        public var contact: Contact

        /// - Parameters:
        ///   - name: Description of name field
        /// @todo Sample Comment
        ///   - records: {no comment}
        ///   - contact: {no comment}
        public init(name: String, records: Array<Record>, contact: Contact) {
            self.name = name
            self.records = records
            self.contact = contact
        }
    }

    /// List Authors
    public struct ListAuthorsEndpoint {

        /// ListAuthorsEndpoint.path: `/authors`
        public let path: String

        /// ListAuthorsEndpoint.method: `GET`
        public let method: String = "GET"
        

        init() {
            self.path = "/authors"
            
        }

        public var body: Void

        public struct Response: Decodable {

            public let authors: Array<Author>
        }
    }

    /// Register Author
    public struct RegisterAuthorEndpoint {

        /// RegisterAuthorEndpoint.path: `/authors`
        public let path: String

        /// RegisterAuthorEndpoint.method: `POST`
        public let method: String = "POST"
        

        public let body: RequestBody

        init(body: () -> RequestBody) {
            self.path = "/authors"
            
            self.body = body()
        }

        public struct RequestBody: Encodable {

            let author: Author.Writer

            /// - Parameters:
            ///   - author: {no comment}
            public init(author: Author.Writer) {
                self.author = author
            }
        }

        public struct Response: Decodable {

            public let authors: Author
        }
    }

    /// Update Author
    public struct UpdateAuthorEndpoint {

        /// UpdateAuthorEndpoint.path: `/authors/$id`
        public let path: String

        /// UpdateAuthorEndpoint.method: `PUT`
        public let method: String = "PUT"
        

        public let body: RequestBody

        /// - Parameters:
        ///   - id: {no comment}
        init(id: Integer
        body: () -> RequestBody) {
            self.path = "/authors/$id"
                .replacingOccurrences(of: "$id", with: "\(id)")
            
            self.body = body()
        }

        public struct RequestBody: Encodable {

            let author: Author.Writer

            /// - Parameters:
            ///   - author: {no comment}
            public init(author: Author.Writer) {
                self.author = author
            }
        }

        public struct Response: Decodable {

            public let author: Author
        }
    }

    public struct AuthorsFilterEndpoint {

        /// AuthorsFilterEndpoint.path: `/authors/$filter`
        public let path: String

        /// AuthorsFilterEndpoint.method: `GET`
        public let method: String = "GET"
        

        public enum FilterValueValue: String { case `over10`, `over5`, `all`, `latest` }

        /// - Parameters:
        ///   - filter: {no comment}
        init(filter: FilterValue) {
            self.path = "/authors/$filter"
                .replacingOccurrences(of: "$filter", with: filter.rawValue)
            
        }

        public var body: Void

        public struct Response: Decodable {

            public let authors: Array<Author>
        }
    }
}