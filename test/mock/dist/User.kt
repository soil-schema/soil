import Foundation

@Suppress("unused")
public data class User(
    val id: Int,
    var name: String
) {

    public data class Writer(
        var name: String
    ) {}

    public class UsersIdEndpoint(
        val id: Int
    ): ApiEndpoint<UsersIdEndpoint.Response> {

        override val path: String = "/users/$id"
            .replace("\$id", id)

        override val method: String = "GET"
        // get body function is unknown, please add serialization package on your soil.config.js
        // for example: insert "kotlin-serialization" into `kotlin.use`
        override func getBody(): String? = null
        // No decode method.

        public data class Response(
            val user: User
        )
    }

    public class RegisterNewUserEndpoint(
        val body: () -> RequestBody
    ): ApiEndpoint<RegisterNewUserEndpoint.Response> {

        override val path: String = "/users"

        override val method: String = "POST"
        // get body function is unknown, please add serialization package on your soil.config.js
        // for example: insert "kotlin-serialization" into `kotlin.use`
        override func getBody(): String? = null
        // No decode method.

        public data class RequestBody(
            val user: User
        )

        public data class Response(
            val user: User
        )
    }
}