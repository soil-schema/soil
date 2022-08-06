import Foundation

public final class Comment: Decodable {

    public let id: Int

    public var body: String

    public var category: CategoryValue

    public enum CategoryValue: String, Codable {
        case opinion = "opinion"
        case review = "review"
        case comment = "comment"
    }

    public struct Writer: Encodable {

        public var body: String

        public var category: CategoryValue

        /// - Parameters:
        ///   - body: {no comment}
        ///   - category: {no comment}
        public init(body: String, category: CategoryValue) {
            self.body = body
            self.category = category
        }
    }

    public struct ArticlesArticleIdCommentsEndpoint {

        /// ArticlesArticleIdCommentsEndpoint.path: `/articles/$article_id/comments`
        public let path: String

        /// ArticlesArticleIdCommentsEndpoint.method: `GET`
        public let method: String = "GET"
        

        /// - Parameters:
        ///   - articleId: {no comment}
        init(articleId: Integer) {
            self.path = "/articles/$article_id/comments"
                .replacingOccurrences(of: "$article_id", with: "\(articleId)")
            
        }

        public var body: Void

        public struct Response: Decodable {

            public let comments: Array<Comment>
        }
    }
}