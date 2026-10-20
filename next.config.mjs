/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    '@vladmandic/human', '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-converter', '@tensorflow/tfjs-backend-wasm', 'sharp',
  ],
  outputFileTracingIncludes: {
    '/api/face-login/*': [
      './lib/face-login/runtime.cjs', './lib/face-login/policy.mjs',
      './node_modules/@vladmandic/human/dist/human.node-wasm.js',
      './node_modules/@vladmandic/human/dist/human.node.js',
      './node_modules/@vladmandic/human/package.json',
      './node_modules/@vladmandic/human/models/blazeface.json',
      './node_modules/@vladmandic/human/models/blazeface.bin',
      './node_modules/@vladmandic/human/models/facemesh.json',
      './node_modules/@vladmandic/human/models/facemesh.bin',
      './node_modules/@vladmandic/human/models/iris.json',
      './node_modules/@vladmandic/human/models/iris.bin',
      './node_modules/@vladmandic/human/models/faceres.json',
      './node_modules/@vladmandic/human/models/faceres.bin',
      './node_modules/@vladmandic/human/models/antispoof.json',
      './node_modules/@vladmandic/human/models/antispoof.bin',
      './node_modules/@vladmandic/human/models/liveness.json',
      './node_modules/@vladmandic/human/models/liveness.bin',
      './node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm',
    ],
  },
}
export default nextConfig
