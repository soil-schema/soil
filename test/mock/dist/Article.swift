import Foundation

public final class Article: Decodable {

    public let title: String

    public let overview: String

    public var body: String

    public struct Writer: Encodable {

        public var body: String

        /// - Parameters:
        ///   - body: {no comment}
        public init(body: String) {
            self.body = body
        }
    }

    /// Search Articles
    public struct SearchArticlesEndpoint {

        /// SearchArticlesEndpoint.path: `/articles/search`
        public let path: String

        /// SearchArticlesEndpoint.method: `GET`
        public let method: String = "GET"

        public private(set) var queryData: Dictionary<String, String> = [:]

        public var q: String {
            didSet {
                self.queryData["q"] = newValue
            }
        }

        public var sort: SortValue? = nil {
            didSet {
                guard let newValue = newValue else {
                    self.queryData.removeValue(forKey: "sort")
                }
                self.queryData["sort"] = newValue
            }
        }

        public enum SortValue: String {
            case created_at
            case modified_at
            case title
            case score
        }

        init(q: String) {
            self.path = "/articles/search"
            self.q = q
            self.queryData["q"] = q
        }

        public var body: Void

        public struct Response: Decodable {

            public let articles: Array<Article>
        }
    }
}