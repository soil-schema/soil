import test from "ava";
import DuplicatedNameError from "../src/errors/DuplicatedNameError.js";
import Schema from "../src/graph/Schema.js";

test('error with duplicated entity', t => {
  const schema = new Schema({})
  t.throws(() => {
    schema.prepare([
      { name: 'Author' },
      { name: 'Author' },
    ])
  }, { instanceOf: DuplicatedNameError })
})