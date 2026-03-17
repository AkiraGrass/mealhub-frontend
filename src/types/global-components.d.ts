import 'vue';

declare module 'vue' {
  // Allow 3rd-party component libraries (e.g., ant-design-vue) to augment GlobalComponents
  // without TypeScript complaining about missing index signatures.
  export interface GlobalComponents {
    [element: string]: any;
  }
}

export {};
