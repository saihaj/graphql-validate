# `@graphql-validate`

With the power of GraphQL-Tools and GraphQL-JS, we are able to provide a smooth experience for validation your GraphQL operations during development, or in CI.

`@graphql-validate/cli` is a simple CLI tools that helps you validate GraphQL operations against a given schema. To use it you can

Usage:

```bash
Usage: @graphql-validate/cli [options]

CLI to validate GraphQL operations against a schema

Options:
  -V, --version                        output the version number
  -s, --schema <schema>                Path to the schema file or URL to fetch the schema from
  -o, --operation <operation>          Path to the operation files (default: "**/*.graphql")
  -r, --rules <Rule1,Rule2,...,RuleN>  The list of rules to apply for the validation
  -h, --help                           display help for command
```

You can load schema from a [local file](https://www.graphql-tools.com/docs/schema-loading#graphql-file-loader) or a [remote url](https://www.graphql-tools.com/docs/schema-loading#url-loader).

For operations it supports following extensions `[graphql](https://www.graphql-tools.com/docs/schema-loading#graphql-file-loader), [ts,js](https://www.graphql-tools.com/docs/schema-loading#code-file-loader)`
