import Foundation

@Suppress("unused")
public data class Comment(
    val id: Int,
    var body: String,
    var category: CategoryValue
) {

    public data class Writer(
        var body: String,
        var category: CategoryValue
    ) {}

    public class ArticlesArticleIdCommentsEndpoint(
        val article_id: Int
    ): ApiEndpoint<ArticlesArticleIdCommentsEndpoint.Response> {

        override val path: String = "/articles/$article_id/comments"
            .replace("\$article_id", article_id)

        override val method: String = "GET"
        // get body function is unknown, please add serialization package on your soil.config.js
        // for example: insert "kotlin-serialization" into `kotlin.use`
        override func getBody(): String? = null
        // No decode method.

        public data class Response(
            val comments: List<Comment>
        )
    }
}