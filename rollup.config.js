import nodeResolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

const extensions = ['.ts']
const noDeclarationFiles = { compilerOptions: { declaration: false } }

const makeExternalPredicate = externalArr => {
  if (externalArr.length === 0) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return id => pattern.test(id)
}

export default [
  // CommonJS
  {
    input: 'src/index.ts',
    output: { file: 'lib/temper.js', format: 'cjs', indent: false },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ]),
    plugins: [
      nodeResolve({
        extensions
      }),
      typescript({ useTsconfigDeclarationDir: true }),
      babel({
        extensions,
        babelHelpers: 'bundled'
      }),
      commonjs()
    ]
  },

  // ES
  {
    input: 'src/index.ts',
    output: { file: 'es/temper.js', format: 'es', indent: false },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ]),
    plugins: [
      nodeResolve({
        extensions
      }),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      babel({
        extensions,
        babelHelpers: 'bundled'
      }),
      commonjs()
    ]
  },

  // ES for Browsers
  {
    input: 'src/index.ts',
    output: { file: 'es/temper.mjs', format: 'es', indent: false },
    plugins: [
      nodeResolve({
        extensions
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      babel({
        extensions,
        exclude: 'node_modules/**',
        babelHelpers: 'bundled'
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        }
      }),
      commonjs()
    ]
  },

  // UMD Development
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/temper.js',
      format: 'umd',
      name: 'Temperjs',
      indent: false
    },
    plugins: [
      nodeResolve({
        extensions
      }),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      babel({
        extensions,
        exclude: 'node_modules/**',
        babelHelpers: 'bundled'
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('development')
      }),
      commonjs()
    ]
  },

  // UMD Production
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/temper.min.js',
      format: 'umd',
      name: 'Temperjs',
      indent: false
    },
    plugins: [
      nodeResolve({
        extensions
      }),
      typescript({ tsconfigOverride: noDeclarationFiles }),
      babel({
        extensions,
        exclude: 'node_modules/**',
        babelHelpers: 'bundled'
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        }
      }),
      commonjs()
    ]
  }
]
