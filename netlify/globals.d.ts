declare const Netlify: any;
declare module "@netlify/blobs" {
  export function getDeployStore(...args: any[]): any;
  export function getStore(...args: any[]): any;
}
