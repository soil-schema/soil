import Foundation

@Suppress("unused")
public data class Article(
    val title: String,
    val overview: String,
    var body: String
) {

    public data class Writer(
        var body: String
    ) {}

    public class SearchArticlesEndpoint: ApiEndpoint<SearchArticlesEndpoint.Response> {

        override val path: String = "/articles/search"

        override val method: String = "GET"
        // get body function is unknown, please add serialization package on your soil.config.js
        // for example: insert "kotlin-serialization" into `kotlin.use`
        override func getBody(): String? = null
        // No decode method.

        public data class Response(
            val articles: List<Article>
        )
    }
}