const AJV = require('ajv')
const fs = require('fs')
const glob = require('glob')
const tape = require('tape')
const yaml = require('js-yaml')

const schema = require('./schema')
const ajv = new AJV()
const validate = ajv.compile(schema)

const recordFiles = glob.sync('records/*.yml')
const records = new Map()
for (const recordFile of recordFiles) {
  tape(recordFile, test => {
    let parsed
    test.doesNotThrow(() => {
      parsed = yaml.load(fs.readFileSync(recordFile, 'utf8'))
    }, 'valid YAML')
    records.set(parsed.name, parsed)
    validate(parsed)
    test.deepEqual(validate.errors, null, 'conforms to schema')
    test.end()
  })
}

tape('progressions', suite => {
  for (const [name, record] of records.entries()) {
    if (!Array.isArray(record.progressions)) continue
    tape(`${name} progressions`, test => {
      for (const progression of record.progressions) {
        test.assert(records.has(progression), progression)
      }
      test.end()
    })
  }
  suite.end()
})
