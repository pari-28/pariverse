/// <reference types="vite/client" />

declare module '*?url' {
  const content: string;
  export default content;
}

declare module '*.mjs' {
  const content: any;
  export default content;
}
