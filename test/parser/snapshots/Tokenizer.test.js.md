# Snapshot report for `test/parser/Tokenizer.test.js`

The actual snapshot is saved in `Tokenizer.test.js.snap`.

Generated by [AVA](https://avajs.dev).

## comment and description entity

> Snapshot 1

    [
      Token {
        column: 1,
        errors: [],
        line: 2,
        offset: 1,
        semantic: 'comment.line',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '- Comment line',
      },
      Token {
        column: 1,
        errors: [],
        line: 4,
        offset: 17,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '# Summary',
      },
      Token {
        column: 1,
        errors: [],
        line: 5,
        offset: 27,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '#',
      },
      Token {
        column: 1,
        errors: [],
        line: 6,
        offset: 29,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '# Description',
      },
      Token {
        column: 1,
        errors: [],
        line: 7,
        offset: 43,
        semantic: 'keyword.directive.entity',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'entity',
      },
      Token {
        column: 8,
        errors: [],
        line: 7,
        offset: 50,
        semantic: 'entity.name.entity',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'BlankEntity',
      },
      Token {
        column: 20,
        errors: [],
        line: 7,
        offset: 62,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 21,
        errors: [],
        line: 7,
        offset: 63,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
    ]

## complete case

> Snapshot 1

    [
      Token {
        column: 1,
        errors: [],
        line: 2,
        offset: 1,
        semantic: 'comment.line',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '- This is complete case mock',
      },
      Token {
        column: 1,
        errors: [],
        line: 4,
        offset: 31,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '# Person summary',
      },
      Token {
        column: 1,
        errors: [],
        line: 5,
        offset: 48,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '#',
      },
      Token {
        column: 1,
        errors: [],
        line: 6,
        offset: 50,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '# Additional description for person',
      },
      Token {
        column: 1,
        errors: [],
        line: 7,
        offset: 86,
        semantic: 'keyword.directive.entity',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'entity',
      },
      Token {
        column: 8,
        errors: [],
        line: 7,
        offset: 93,
        semantic: 'entity.name.entity',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Person',
      },
      Token {
        column: 15,
        errors: [],
        line: 7,
        offset: 100,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 3,
        errors: [],
        line: 8,
        offset: 104,
        semantic: 'keyword.directive.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'field',
      },
      Token {
        column: 9,
        errors: [],
        line: 8,
        offset: 110,
        semantic: 'entity.name.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'id',
      },
      Token {
        column: 11,
        errors: [],
        line: 8,
        offset: 112,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 13,
        errors: [],
        line: 8,
        offset: 114,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Int',
      },
      Token {
        column: 3,
        errors: [],
        line: 9,
        offset: 120,
        semantic: 'keyword.annotation.mutable.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'mutable',
      },
      Token {
        column: 11,
        errors: [],
        line: 9,
        offset: 128,
        semantic: 'keyword.directive.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'field',
      },
      Token {
        column: 17,
        errors: [],
        line: 9,
        offset: 134,
        semantic: 'entity.name.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 21,
        errors: [],
        line: 9,
        offset: 138,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 23,
        errors: [],
        line: 9,
        offset: 140,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'String',
      },
      Token {
        column: 3,
        errors: [],
        line: 11,
        offset: 150,
        semantic: 'keyword.directive.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'endpoint',
      },
      Token {
        column: 12,
        errors: [],
        line: 11,
        offset: 159,
        semantic: 'keyword.other.http-method.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'GET',
      },
      Token {
        column: 16,
        errors: [],
        line: 11,
        offset: 163,
        semantic: 'string.http-path.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '/persons',
      },
      Token {
        column: 25,
        errors: [],
        line: 11,
        offset: 172,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 5,
        errors: [],
        line: 12,
        offset: 178,
        semantic: 'keyword.property.name',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 10,
        errors: [],
        line: 12,
        offset: 183,
        semantic: 'string.property.name',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'list',
      },
      Token {
        column: 5,
        errors: [],
        line: 13,
        offset: 192,
        semantic: 'keyword.directive.success',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'success',
      },
      Token {
        column: 13,
        errors: [],
        line: 13,
        offset: 200,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 7,
        errors: [],
        line: 14,
        offset: 208,
        semantic: 'keyword.directive.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'field',
      },
      Token {
        column: 13,
        errors: [],
        line: 14,
        offset: 214,
        semantic: 'entity.name.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'persons',
      },
      Token {
        column: 20,
        errors: [],
        line: 14,
        offset: 221,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 22,
        errors: [],
        line: 14,
        offset: 223,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'List<Person>',
      },
      Token {
        column: 5,
        errors: [],
        line: 15,
        offset: 240,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 16,
        offset: 244,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 18,
        offset: 249,
        semantic: 'keyword.directive.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'endpoint',
      },
      Token {
        column: 12,
        errors: [],
        line: 18,
        offset: 258,
        semantic: 'keyword.other.http-method.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'GET',
      },
      Token {
        column: 16,
        errors: [],
        line: 18,
        offset: 262,
        semantic: 'string.http-path.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '/persons/$id',
      },
      Token {
        column: 29,
        errors: [],
        line: 18,
        offset: 275,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 5,
        errors: [],
        line: 19,
        offset: 281,
        semantic: 'keyword.property.name',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 10,
        errors: [],
        line: 19,
        offset: 286,
        semantic: 'string.property.name',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'find',
      },
      Token {
        column: 5,
        errors: [],
        line: 20,
        offset: 295,
        semantic: 'keyword.directive.parameter',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'parameter',
      },
      Token {
        column: 15,
        errors: [],
        line: 20,
        offset: 305,
        semantic: 'entity.name.parameter',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'id',
      },
      Token {
        column: 17,
        errors: [],
        line: 20,
        offset: 307,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 19,
        errors: [],
        line: 20,
        offset: 309,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Person.id',
      },
      Token {
        column: 5,
        errors: [],
        line: 21,
        offset: 323,
        semantic: 'keyword.directive.success',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'success',
      },
      Token {
        column: 13,
        errors: [],
        line: 21,
        offset: 331,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 7,
        errors: [],
        line: 22,
        offset: 339,
        semantic: 'keyword.directive.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'field',
      },
      Token {
        column: 13,
        errors: [],
        line: 22,
        offset: 345,
        semantic: 'entity.name.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'person',
      },
      Token {
        column: 19,
        errors: [],
        line: 22,
        offset: 351,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 21,
        errors: [],
        line: 22,
        offset: 353,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Person',
      },
      Token {
        column: 5,
        errors: [],
        line: 23,
        offset: 364,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 24,
        offset: 368,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 26,
        offset: 373,
        semantic: 'keyword.directive.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'endpoint',
      },
      Token {
        column: 12,
        errors: [],
        line: 26,
        offset: 382,
        semantic: 'keyword.other.http-method.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'POST',
      },
      Token {
        column: 17,
        errors: [],
        line: 26,
        offset: 387,
        semantic: 'string.http-path.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '/persons',
      },
      Token {
        column: 26,
        errors: [],
        line: 26,
        offset: 396,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 5,
        errors: [],
        line: 27,
        offset: 402,
        semantic: 'keyword.property.name',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 10,
        errors: [],
        line: 27,
        offset: 407,
        semantic: 'string.property.name',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'register',
      },
      Token {
        column: 5,
        errors: [],
        line: 28,
        offset: 420,
        semantic: 'keyword.directive.request',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'request',
      },
      Token {
        column: 13,
        errors: [],
        line: 28,
        offset: 428,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 7,
        errors: [],
        line: 29,
        offset: 436,
        semantic: 'keyword.directive.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'field',
      },
      Token {
        column: 13,
        errors: [],
        line: 29,
        offset: 442,
        semantic: 'entity.name.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'person',
      },
      Token {
        column: 19,
        errors: [],
        line: 29,
        offset: 448,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 21,
        errors: [],
        line: 29,
        offset: 450,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Person',
      },
      Token {
        column: 5,
        errors: [],
        line: 30,
        offset: 461,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 5,
        errors: [],
        line: 31,
        offset: 467,
        semantic: 'keyword.directive.success',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'success',
      },
      Token {
        column: 13,
        errors: [],
        line: 31,
        offset: 475,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 7,
        errors: [],
        line: 32,
        offset: 483,
        semantic: 'keyword.directive.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'field',
      },
      Token {
        column: 13,
        errors: [],
        line: 32,
        offset: 489,
        semantic: 'entity.name.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'person',
      },
      Token {
        column: 19,
        errors: [],
        line: 32,
        offset: 495,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 21,
        errors: [],
        line: 32,
        offset: 497,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Person',
      },
      Token {
        column: 5,
        errors: [],
        line: 33,
        offset: 508,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 34,
        offset: 512,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 36,
        offset: 517,
        semantic: 'keyword.directive.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'endpoint',
      },
      Token {
        column: 12,
        errors: [],
        line: 36,
        offset: 526,
        semantic: 'keyword.other.http-method.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'GET',
      },
      Token {
        column: 16,
        errors: [],
        line: 36,
        offset: 530,
        semantic: 'string.http-path.endpoint',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '/persons/search',
      },
      Token {
        column: 32,
        errors: [],
        line: 36,
        offset: 546,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 5,
        errors: [],
        line: 37,
        offset: 552,
        semantic: 'keyword.property.name',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 10,
        errors: [],
        line: 37,
        offset: 557,
        semantic: 'string.property.name',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'search',
      },
      Token {
        column: 5,
        errors: [],
        line: 38,
        offset: 568,
        semantic: 'keyword.directive.query',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'query',
      },
      Token {
        column: 11,
        errors: [],
        line: 38,
        offset: 574,
        semantic: 'entity.name.query',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'q',
      },
      Token {
        column: 12,
        errors: [],
        line: 38,
        offset: 575,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 14,
        errors: [],
        line: 38,
        offset: 577,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'String',
      },
      Token {
        column: 5,
        errors: [],
        line: 39,
        offset: 588,
        semantic: 'keyword.directive.success',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'success',
      },
      Token {
        column: 13,
        errors: [],
        line: 39,
        offset: 596,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 7,
        errors: [],
        line: 40,
        offset: 604,
        semantic: 'keyword.directive.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'field',
      },
      Token {
        column: 13,
        errors: [],
        line: 40,
        offset: 610,
        semantic: 'entity.name.field',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'persons',
      },
      Token {
        column: 20,
        errors: [],
        line: 40,
        offset: 617,
        semantic: 'keyword.operator.definition.type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ':',
      },
      Token {
        column: 22,
        errors: [],
        line: 40,
        offset: 619,
        semantic: 'type',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'List<Person>',
      },
      Token {
        column: 5,
        errors: [],
        line: 41,
        offset: 636,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 42,
        offset: 640,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 1,
        errors: [],
        line: 43,
        offset: 642,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 1,
        errors: [],
        line: 45,
        offset: 645,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '# "Register Person" scenario summary',
      },
      Token {
        column: 1,
        errors: [],
        line: 46,
        offset: 682,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '#',
      },
      Token {
        column: 1,
        errors: [],
        line: 47,
        offset: 684,
        semantic: 'comment.line.description',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '# Additional description for this scenario',
      },
      Token {
        column: 1,
        errors: [],
        line: 48,
        offset: 727,
        semantic: 'keyword.directive.scenario',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'scenario',
      },
      Token {
        column: 10,
        errors: [],
        line: 48,
        offset: 736,
        semantic: 'entity.name.scenario',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Register Person',
      },
      Token {
        column: 26,
        errors: [],
        line: 48,
        offset: 752,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 3,
        errors: [],
        line: 49,
        offset: 756,
        semantic: 'function.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '@inspect',
      },
      Token {
        column: 3,
        errors: [],
        line: 50,
        offset: 767,
        semantic: 'function.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '@set-var',
      },
      Token {
        column: 12,
        errors: [],
        line: 50,
        offset: 776,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 18,
        errors: [],
        line: 50,
        offset: 782,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'value',
      },
      Token {
        column: 3,
        errors: [],
        line: 51,
        offset: 790,
        semantic: 'function.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '@set-var',
      },
      Token {
        column: 11,
        errors: [],
        line: 51,
        offset: 798,
        semantic: 'punctuation.parameters.open.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '(',
      },
      Token {
        column: 12,
        errors: [],
        line: 51,
        offset: 799,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 18,
        errors: [],
        line: 51,
        offset: 805,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'value',
      },
      Token {
        column: 23,
        errors: [],
        line: 51,
        offset: 810,
        semantic: 'punctuation.parameters.close.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ')',
      },
      Token {
        column: 3,
        errors: [],
        line: 52,
        offset: 814,
        semantic: 'keyword.other.http-method',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'POST',
      },
      Token {
        column: 8,
        errors: [],
        line: 52,
        offset: 819,
        semantic: 'string.http-path',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '/persons',
      },
      Token {
        column: 17,
        errors: [],
        line: 52,
        offset: 828,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 5,
        errors: [],
        line: 53,
        offset: 834,
        semantic: 'entity.name.variable.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 10,
        errors: [],
        line: 53,
        offset: 839,
        semantic: 'keyword.operator.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '=',
      },
      Token {
        column: 12,
        errors: [],
        line: 53,
        offset: 841,
        semantic: 'parameter.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Dante Alighieri',
      },
      Token {
        column: 5,
        errors: [],
        line: 54,
        offset: 867,
        semantic: 'string.unquoted',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'after',
      },
      Token {
        column: 11,
        errors: [],
        line: 54,
        offset: 867,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 7,
        errors: [],
        line: 55,
        offset: 875,
        semantic: 'function.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '@set-var',
      },
      Token {
        column: 16,
        errors: [],
        line: 55,
        offset: 884,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'id',
      },
      Token {
        column: 20,
        errors: [],
        line: 55,
        offset: 888,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '$response.person.id',
      },
      Token {
        column: 5,
        errors: [],
        line: 56,
        offset: 912,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 57,
        offset: 916,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 58,
        offset: 920,
        semantic: 'keyword.other.http-method',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'POST',
      },
      Token {
        column: 8,
        errors: [],
        line: 58,
        offset: 925,
        semantic: 'string.http-path',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '/persons',
      },
      Token {
        column: 17,
        errors: [],
        line: 58,
        offset: 934,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 5,
        errors: [],
        line: 59,
        offset: 940,
        semantic: 'entity.name.variable.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 10,
        errors: [],
        line: 59,
        offset: 945,
        semantic: 'keyword.operator.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '=',
      },
      Token {
        column: 12,
        errors: [],
        line: 59,
        offset: 947,
        semantic: 'parameter.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '"Beatrice"',
      },
      Token {
        column: 5,
        errors: [],
        line: 60,
        offset: 968,
        semantic: 'string.unquoted',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'after',
      },
      Token {
        column: 11,
        errors: [],
        line: 60,
        offset: 968,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 7,
        errors: [],
        line: 61,
        offset: 976,
        semantic: 'function.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '@set-var',
      },
      Token {
        column: 16,
        errors: [],
        line: 61,
        offset: 985,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'id',
      },
      Token {
        column: 20,
        errors: [],
        line: 61,
        offset: 989,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '$response.person.id',
      },
      Token {
        column: 5,
        errors: [],
        line: 62,
        offset: 1013,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 63,
        offset: 1017,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 3,
        errors: [],
        line: 64,
        offset: 1021,
        semantic: 'keyword.other.http-method',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'GET',
      },
      Token {
        column: 7,
        errors: [],
        line: 64,
        offset: 1025,
        semantic: 'string.http-path',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '/persons/$id',
      },
      Token {
        column: 3,
        errors: [],
        line: 65,
        offset: 1040,
        semantic: 'entity.reference.request',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Person.search',
      },
      Token {
        column: 17,
        errors: [],
        line: 65,
        offset: 1054,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 5,
        errors: [],
        line: 66,
        offset: 1060,
        semantic: 'comment.line',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '- GET /persons/search',
      },
      Token {
        column: 5,
        errors: [],
        line: 67,
        offset: 1086,
        semantic: 'entity.name.variable.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'q',
      },
      Token {
        column: 7,
        errors: [],
        line: 67,
        offset: 1088,
        semantic: 'keyword.operator.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '=',
      },
      Token {
        column: 9,
        errors: [],
        line: 67,
        offset: 1090,
        semantic: 'parameter.assignment',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Dante',
      },
      Token {
        column: 3,
        errors: [],
        line: 68,
        offset: 1098,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
      Token {
        column: 1,
        errors: [],
        line: 69,
        offset: 1100,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
    ]

## commands

> Snapshot 1

    [
      Token {
        column: 1,
        errors: [],
        line: 2,
        offset: 1,
        semantic: 'keyword.directive.scenario',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'scenario',
      },
      Token {
        column: 10,
        errors: [],
        line: 2,
        offset: 10,
        semantic: 'entity.name.scenario',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'Register Person',
      },
      Token {
        column: 26,
        errors: [],
        line: 2,
        offset: 26,
        semantic: 'punctuation.block.open',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '{',
      },
      Token {
        column: 3,
        errors: [],
        line: 3,
        offset: 30,
        semantic: 'function.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '@inspect',
      },
      Token {
        column: 3,
        errors: [],
        line: 4,
        offset: 41,
        semantic: 'function.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '@set-var',
      },
      Token {
        column: 12,
        errors: [],
        line: 4,
        offset: 50,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 18,
        errors: [],
        line: 4,
        offset: 56,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'value',
      },
      Token {
        column: 3,
        errors: [],
        line: 5,
        offset: 64,
        semantic: 'function.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '@set-var',
      },
      Token {
        column: 11,
        errors: [],
        line: 5,
        offset: 72,
        semantic: 'punctuation.parameters.open.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '(',
      },
      Token {
        column: 12,
        errors: [],
        line: 5,
        offset: 73,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'name',
      },
      Token {
        column: 18,
        errors: [],
        line: 5,
        offset: 79,
        semantic: 'string.unquote.parameter.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: 'value',
      },
      Token {
        column: 23,
        errors: [],
        line: 5,
        offset: 84,
        semantic: 'punctuation.parameters.close.command',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: ')',
      },
      Token {
        column: 1,
        errors: [],
        line: 6,
        offset: 86,
        semantic: 'punctuation.block.close',
        subtokens: [],
        uri: 'file:///tmp/test.soil',
        value: '}',
      },
    ]
