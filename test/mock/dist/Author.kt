import Foundation

@Suppress("unused")
public data class Author(
    val id: Int,
    var name: String,
    var records: List<Record>,
    var contact: Contact
) {

    public data class Writer(
        var name: String,
        var records: List<Record>,
        var contact: Contact
    ) {}

    public class ListAuthorsEndpoint: ApiEndpoint<ListAuthorsEndpoint.Response> {

        override val path: String = "/authors"

        override val method: String = "GET"
        // get body function is unknown, please add serialization package on your soil.config.js
        // for example: insert "kotlin-serialization" into `kotlin.use`
        override func getBody(): String? = null
        // No decode method.

        public data class Response(
            val authors: List<Author>
        )
    }

    public class RegisterAuthorEndpoint(
        val body: () -> RequestBody
    ): ApiEndpoint<RegisterAuthorEndpoint.Response> {

        override val path: String = "/authors"

        override val method: String = "POST"
        // get body function is unknown, please add serialization package on your soil.config.js
        // for example: insert "kotlin-serialization" into `kotlin.use`
        override func getBody(): String? = null
        // No decode method.

        public data class RequestBody(
            val author: Author
        )

        public data class Response(
            val authors: Author
        )
    }

    public class UpdateAuthorEndpoint(
        val id: Int,
        val body: () -> RequestBody
    ): ApiEndpoint<UpdateAuthorEndpoint.Response> {

        override val path: String = "/authors/$id"
            .replace("\$id", id)

        override val method: String = "PUT"
        // get body function is unknown, please add serialization package on your soil.config.js
        // for example: insert "kotlin-serialization" into `kotlin.use`
        override func getBody(): String? = null
        // No decode method.

        public data class RequestBody(
            val author: Author
        )

        public data class Response(
            val author: Author
        )
    }

    public class AuthorsFilterEndpoint(
        val filter: FilterValue
    ): ApiEndpoint<AuthorsFilterEndpoint.Response> {

        override val path: String = "/authors/$filter"
            .replace("\$filter", filter)

        override val method: String = "GET"
        // get body function is unknown, please add serialization package on your soil.config.js
        // for example: insert "kotlin-serialization" into `kotlin.use`
        override func getBody(): String? = null
        // No decode method.

        public data class Response(
            val authors: List<Author>
        )
    }
}