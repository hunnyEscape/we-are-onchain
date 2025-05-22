// r3f-jsx.d.ts
/// <reference types="@react-three/fiber" />

// Make the `@react-three/fiber/jsx-runtime` module available to TS
declare module '@react-three/fiber/jsx-runtime' {
  // Re-export everything from the main package
  export * from '@react-three/fiber';
}
