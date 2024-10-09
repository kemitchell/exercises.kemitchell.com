import AJV from 'ajv'
import addFormats from 'ajv-formats'
import { readFileSync } from 'fs'
import { globSync } from 'glob'
import test from 'node:test'
import assert from 'node:assert'
import yaml from 'js-yaml'

const ajv = new AJV()
addFormats(ajv)

const exerciseSchema = yaml.load(readFileSync('./data/schemas/exercise.yml', 'utf8'))
const validateExercise = ajv.compile(exerciseSchema)

const recordFiles = globSync('data/exercises/*.yml')
const exercises = new Map()
for (const recordFile of recordFiles) {
  test(recordFile, test => {
    let parsed
    assert.doesNotThrow(() => {
      parsed = yaml.load(readFileSync(recordFile, 'utf8'))
    }, 'valid YAML')
    exercises.set(parsed.name, parsed)
    validateExercise(parsed)
    assert.deepEqual(validateExercise.errors, null, 'conforms to schema')
  })
}

test('progressions', async suite => {
  for (const [name, record] of exercises.entries()) {
    if (!Array.isArray(record.progressions)) continue
    await suite.test(`${name} progressions`, test => {
      for (const progression of record.progressions) {
        assert(exercises.has(progression), progression)
      }
    })
  }
})

const sourceSchema = yaml.load(readFileSync('./data/schemas/source.yml', 'utf8'))
const validateSource = ajv.compile(sourceSchema)

const sourceFiles = globSync('data/sources/*.yml')
for (const sourceFile of sourceFiles) {
  let parsed
  test(sourceFile, test => {
    parsed = yaml.load(readFileSync(sourceFile, 'utf8'))
    validateSource(parsed)
    assert.deepEqual(validateSource.errors, null, 'conforms to schema')
  })
}
