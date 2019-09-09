import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default [
  {
    input: './src/index.js',
    output: { file: 'lib/index.js', format: 'cjs' },
    external: ['prop-types', 'react', 'redux', 'react-redux', 'reselect', 'kea'],
    plugins: [babel(), resolve(), commonjs({
      namedExports: {
        'react-is': ['isValidElementType']
      }
    })]
  }
]
