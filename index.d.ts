// Reference: https://www.typescriptlang.org/play
declare const LocalDependenciesPlugin: {
    new (options?: {
        production: boolean;
        watch: boolean;
    }): {
        apply(compiler: any): void;
    };
};
export { LocalDependenciesPlugin };
