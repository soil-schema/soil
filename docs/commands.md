# Setup Request

## `@request-body-from`

```
@request-body-from <filename>
```

Creates RequestBody from a source file. If you specify a binary file, you can upload it via RequestBody.

- `multipart/form-data` format is **NOT** yet supported.
- Works only in setup directive.

```soil
entity Photo {
  field url: URL

  endpoint POST /photos {
    name upload
    request mime:image/jpeg
    success {
      field photo: Photo
    }
  }
}

scenario Upload Photo {
  - Send binary via request body with `Content-Type: image/jpeg` HTTP Header.
  Photo.upload {
    setup {
      @request-body-from ./path/to/mock-image.jpeg
    }
  }
}
```
