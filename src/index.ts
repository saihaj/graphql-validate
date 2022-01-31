#!/usr/bin/env node
import { Command } from 'commander'
import { validate } from 'graphql'
import { loadDocuments, loadSchema } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { JsonFileLoader } from '@graphql-tools/json-file-loader'
import { UrlLoader } from '@graphql-tools/url-loader'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import chalk from 'chalk'

const log = console.log

const program = new Command()

/**
 * Validate operations against a schema
 * @param {string} schemaPath
 * @param {string} documentPath
 */
const validateOperations = async (schemaPath: string, documentPath: string) => {
  // This allows us to load schema from a remote URL or from a local file
  const schema = await loadSchema(schemaPath, {
    loaders: [new UrlLoader(), new GraphQLFileLoader(), new JsonFileLoader()],
  })

  // This allows to load documents from a local `.graphql` file or from code files
  const documents = await loadDocuments(documentPath, {
    loaders: [new GraphQLFileLoader(), new CodeFileLoader()],
  })

  documents.forEach((document) => {
    const errors = validate(schema, document.document!)

    if (errors.length <= 0) {
      log(
        chalk.green(`✔ Awesome! All operations in ${documentPath} are valid!`),
      )
      return
    }

    errors.forEach((error) => {
      error.locations!.forEach((location) => {
        const str = `${chalk.red(error.message)}
${chalk.yellow(document.location)}${chalk.yellow('#')}${chalk.yellow(
          location.line,
        )}:${chalk.yellow(location.column)}
        `
        log(str)
      })
    })
  })
}

const main = async () => {
  program
    .name('validate-operations')
    .description('CLI to validate GraphQL operations against a schema')
    .version('0.0.1')
    .requiredOption(
      '-s, --schema <schema>',
      'Path to the schema file or URL to fetch the schema from',
    )
    .option(
      '-o, --operation <operation>',
      'Path to the operation files',
      '**/*.graphql',
    )
    .parse(process.argv)

  const schema = program.opts().schema
  const operation = program.opts().operation

  await validateOperations(schema, operation)
}

main().catch((e) => console.error(e))
