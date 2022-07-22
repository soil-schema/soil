import test from 'ava'
import '../src/extension.js'

test('"sample".classify', t => {
  t.is('sample'.classify(), 'Sample')
})

test('"sample_code".classify', t => {
  t.is('sample_code'.classify(), 'SampleCode')
})

test('"sample-code".classify', t => {
  t.is('sample-code'.classify(), 'SampleCode')
})

test('"sample code".classify', t => {
  t.is('sample code'.classify(), 'SampleCode')
})

test('"SAMPLE CODE".classify', t => {
  t.is('SAMPLE CODE'.classify(), 'SampleCode')
})