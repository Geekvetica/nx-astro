export interface ComponentGeneratorSchema {
  /**
   * Component name
   */
  name: string;

  /**
   * The name of the Astro project
   */
  project: string;

  /**
   * Directory path within src/components where the component will be placed
   */
  directory?: string;

  /**
   * Add an export to src/components/index.ts
   * @default false
   */
  export?: boolean;

  /**
   * Skip formatting files after generation
   * @default false
   */
  skipFormat?: boolean;
}
