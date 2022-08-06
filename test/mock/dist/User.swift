import Foundation

public final class User: Decodable {

    public let id: Int

    public var name: String

    public struct Writer: Encodable {

        public var name: String

        /// - Parameters:
        ///   - name: {no comment}
        public init(name: String) {
            self.name = name
        }
    }

    public struct UsersIdEndpoint {

        /// UsersIdEndpoint.path: `/users/$id`
        public let path: String

        /// UsersIdEndpoint.method: `GET`
        public let method: String = "GET"
        

        /// - Parameters:
        ///   - id: {no comment}
        init(id: Integer) {
            self.path = "/users/$id"
                .replacingOccurrences(of: "$id", with: "\(id)")
            
        }

        public var body: Void

        public struct Response: Decodable {

            public let user: User
        }
    }

    /// Register New User
    public struct RegisterNewUserEndpoint {

        /// RegisterNewUserEndpoint.path: `/users`
        public let path: String

        /// RegisterNewUserEndpoint.method: `POST`
        public let method: String = "POST"
        

        public let body: RequestBody

        init(body: () -> RequestBody) {
            self.path = "/users"
            
            self.body = body()
        }

        public struct RequestBody: Encodable {

            let user: User.Writer

            /// - Parameters:
            ///   - user: {no comment}
            public init(user: User.Writer) {
                self.user = user
            }
        }

        public struct Response: Decodable {

            public let user: User
        }
    }
}