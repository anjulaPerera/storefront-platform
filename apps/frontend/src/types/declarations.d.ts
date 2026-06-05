// Allows TypeScript to accept CSS side-effect imports
declare module "*.css" {
  const styles: Record<string, string>;
  export default styles;
}

// Allows CSS Module imports
declare module "*.module.css" {
  const styles: Record<string, string>;
  export default styles;
}
