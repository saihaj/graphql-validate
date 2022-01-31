#!/usr/bin/env node
import { Command } from 'commander'
import { Source } from '@graphql-tools/utils'
import { GraphQLError, SourceLocation, validate } from 'graphql'
import { loadDocuments, loadSchema } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { JsonFileLoader } from '@graphql-tools/json-file-loader'
import { UrlLoader } from '@graphql-tools/url-loader'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import chalk from 'chalk'
import { version } from '../package.json'


const GRAPHQL_ERROR_GUIDE_LINKS_MAP: [rule_message_regex: RegExp, link: string][] = [
  [/Variable "(.*)" cannot be non-input type "(.*)"/, 'https://thegraph.com/docs/en/#UniqueArgumentNamesRule'],
  [/Cannot query field "(.*)" on type "(.*)"/, 'https://thegraph.com/docs/en/#FieldsOnCorrectTypeRule'],
  [/Fragment cannot condition on non composite type "(.*)"/, 'https://thegraph.com/docs/en/#FragmentsOnCompositeTypesRule'],
  [/Unknown directive "(.*)"/, 'https://thegraph.com/docs/en/#KnownDirectivesRule'],
  [/Directive "(.*)" may not be used on (.*)\./, 'https://thegraph.com/docs/en/#KnownDirectivesRule'],
  [/Unknown fragment "(.*)"/, 'https://thegraph.com/docs/en/#KnownFragmentNamesRule'],
  [/Unknown type "(.*)"/, 'https://thegraph.com/docs/en/#KnownTypeNamesRule'],
  [/This anonymous operation must be the only defined operation/, 'https://thegraph.com/docs/en/#LoneAnonymousOperationRule'],
  [/Cannot spread fragment "(.*)" within itself/, 'https://thegraph.com/docs/en/#NoFragmentCyclesRule'],
  [/Variable "(.*)" is not defined/, 'https://thegraph.com/docs/en/#NoUndefinedVariablesRule'],
  [/Fragment "(.*)" is never used/, 'https://thegraph.com/docs/en/#NoUnusedFragmentsRule'],
  [/Variable "(.*)" is never used/, 'https://thegraph.com/docs/en/#NoUnusedVariablesRule'],
  [/Fields "(.*)" conflict because (.*)\. Use different aliases on the fields to fetch both if this was intentional\./, 'https://thegraph.com/docs/en/#OverlappingFieldsCanBeMergedRule'],
  [/Fragment cannot be spread here as objects/, 'https://thegraph.com/docs/en/#PossibleFragmentSpreadsRule'],
  [/Cannot extend non-(.*) type "(.*)"/, 'https://thegraph.com/docs/en/#PossibleTypeExtensionsRule'],
  [/Field "(.*)" argument "(.*)" of type "(.*)" is required, but it was not provided/, 'https://thegraph.com/docs/en/#ProvidedRequiredArgumentsRule'],
  [/Field "(.*)" must not have a selection since type "(.*)" has no subfields./, 'https://thegraph.com/docs/en/#ScalarLeafsRule'],
  [/Field "(.*)" of type "(.*)" must have a selection of subfields. Did you mean "(.*) { ... }"/, 'https://thegraph.com/docs/en/#ScalarLeafsRule'],
  [/Subscription "(.*)" must select only one top level field/, 'https://thegraph.com/docs/en/#SingleFieldSubscriptionsRule'],
  [/Anonymous Subscription must select only one top level field/, 'https://thegraph.com/docs/en/#SingleFieldSubscriptionsRule'],
  [/Subscription "(.*)" must not select an introspection top level field/, 'https://thegraph.com/docs/en/#SingleFieldSubscriptionsRule'],
  [/Anonymous Subscription must not select an introspection top level field/, 'https://thegraph.com/docs/en/#SingleFieldSubscriptionsRule'],
  [/Argument "(.*)" can only be defined once/, 'https://thegraph.com/docs/en/#UniqueArgumentDefinitionNamesRule'],
  [/There can be only one argument named "(.*)"/, 'https://thegraph.com/docs/en/#UniqueArgumentNamesRule'],
  [/Directive "(.*)" already exists in the schema. It cannot be redefined/, 'https://thegraph.com/docs/en/#UniqueDirectiveNamesRule'],
  [/There can be only one directive named "(.*)"/, 'https://thegraph.com/docs/en/#UniqueDirectiveNamesRule'],
  [/The directive "(.*)" can only be used once at this location/, 'https://thegraph.com/docs/en/#UniqueDirectivesPerLocationRule'],
  [/Enum value "(.*)" already exists in the schema. It cannot also be defined in this type extension/, 'https://thegraph.com/docs/en/#UniqueEnumValueNamesRule'],
  [/Enum value "(.*)" can only be defined once/, 'https://thegraph.com/docs/en/#UniqueEnumValueNamesRule'],
  [/Field "(.*)" already exists in the schema. It cannot also be defined in this type extension/, 'https://thegraph.com/docs/en/#UniqueFieldDefinitionNamesRule'],
  [/Field "(.*)" can only be defined once/, 'https://thegraph.com/docs/en/#UniqueFieldDefinitionNamesRule'],
  [/There can be only one fragment named "(.*)"/, 'https://thegraph.com/docs/en/#UniqueFragmentNamesRule'],
  [/There can be only one input field named "(.*)"/, 'https://thegraph.com/docs/en/#UniqueInputFieldNamesRule'],
  [/There can be only one operation named "(.*)"/, 'https://thegraph.com/docs/en/#UniqueOperationNamesRule'],
  [/Type for (.*) already defined in the schema. It cannot be redefined"/, 'https://thegraph.com/docs/en/#UniqueOperationTypesRule'],
  [/There can be only one (.*) type in schema"/, 'https://thegraph.com/docs/en/#UniqueOperationTypesRule'],
  [/Type "(.*)" already exists in the schema. It cannot also be defined in this type definition"/, 'https://thegraph.com/docs/en/#UniqueTypeNamesRule'],
  [/There can be only one type named "(.*)"/, 'https://thegraph.com/docs/en/#UniqueTypeNamesRule'],
  [/There can be only one variable named "(.*)"/, 'https://thegraph.com/docs/en/#UniqueVariableNamesRule'],
  [/Variable "(.*)" cannot be non-input type "(.*)"/, 'https://thegraph.com/docs/en/#VariablesAreInputTypesRule'],
  [/Variable "(.*)" of type "(.*)" used in position expecting type "(.*)"/, 'https://thegraph.com/docs/en/#VariablesInAllowedPositionRule'],
]

const logError = (document: Source, location: SourceLocation, error: GraphQLError): void => {
  const errorGuideLink = GRAPHQL_ERROR_GUIDE_LINKS_MAP.find(([regexp]) => regexp.test(error.message))

  const str = `${chalk.red(error.message)}
  ${chalk.yellow(document.location)}${chalk.yellow('#')}${chalk.yellow(
    location.line,
  )}:${chalk.yellow(location.column)}
  ${errorGuideLink ? `\n More information at ${errorGuideLink[1]}` : ''}
          `

  log(str)
}

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
        logError(document, location, error)
      })
    })
  })
}

const main = async () => {
  program
    .name('validate-operations')
    .description('CLI to validate GraphQL operations against a schema')
    .version(version)
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
