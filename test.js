const AJV = require('ajv')
const addFormats = require('ajv-formats')
const fs = require('fs')
const glob = require('glob')
const tape = require('tape')
const yaml = require('js-yaml')

const ajv = new AJV()
addFormats(ajv)

const exerciseSchema = yaml.load(fs.readFileSync('./data/schemas/exercise.yml', 'utf8'))
const validateExercise = ajv.compile(exerciseSchema)

const recordFiles = glob.sync('data/exercises/*.yml')
const exercises = new Map()
for (const recordFile of recordFiles) {
  tape(recordFile, test => {
    let parsed
    test.doesNotThrow(() => {
      parsed = yaml.load(fs.readFileSync(recordFile, 'utf8'))
    }, 'valid YAML')
    exercises.set(parsed.name, parsed)
    validateExercise(parsed)
    test.deepEqual(validateExercise.errors, null, 'conforms to schema')
    test.end()
  })
}

tape('progressions', suite => {
  for (const [name, record] of exercises.entries()) {
    if (!Array.isArray(record.progressions)) continue
    tape(`${name} progressions`, test => {
      for (const progression of record.progressions) {
        test.assert(exercises.has(progression), progression)
      }
      test.end()
    })
  }
  suite.end()
})

const sourceSchema = yaml.load(fs.readFileSync('./data/schemas/source.yml', 'utf8'))
const validateSource = ajv.compile(sourceSchema)

const sourceFiles = glob.sync('data/sources/*.yml')
for (const sourceFile of sourceFiles) {
  let parsed
  tape(sourceFile, test => {
    parsed = yaml.load(fs.readFileSync(sourceFile, 'utf8'))
    validateSource(parsed)
    test.deepEqual(validateSource.errors, null, 'conforms to schema')
    test.end()
  })
}
