import { msg } from "/p/the8020/admin-db/i18n/messages.ts";
import { choiceHelp, field, z } from "/p/the8020/db/fields.ts";

export const catalogStateLabels: Record<string, ReturnType<typeof msg>> = {
  active: msg("view.active"),
  retired: msg("view.retired"),
  uncatalogued: msg("view.uncatalogued"),
  synchronized: msg("choices.synchronized"),
  error: msg("choices.error"),
  drift: msg("choices.drift"),
  source_commit_mismatch: msg("choices.source_commit_mismatch"),
  present: msg("choices.present"),
  changed: msg("view.changed"),
  commit_mismatch: msg("choices.commit_mismatch"),
  missing: msg("choices.missing"),
  unknown: msg("choices.unknown"),
  unavailable: msg("view.unavailable"),
  new: msg("view.new"),
  deleted: msg("choices.deleted"),
};

const synchronizationState = field(z.string(), {
  label: msg("view.last_sync_result"),
  description: msg("catalog.the_result_of_the_most_recent_attempt"),
  valueHelp: choiceHelp(z.string(), [
    catalogStateLabels.synchronized!,
    catalogStateLabels.retired!,
    catalogStateLabels.error!,
    catalogStateLabels.drift!,
    catalogStateLabels.uncatalogued!,
  ]),
});

export const catalogInfo = z.object({
  tableName: field(z.string(), {
    label: msg("view.table"),
    description: msg("catalog.the_table_name_within_its_owning_package"),
  }),
  state: field(z.string(), {
    label: msg("catalog.state"),
    description: msg(
      "catalog.whether_this_structure_is_active_retired_missing",
    ),
    valueHelp: choiceHelp(z.string(), [
      catalogStateLabels.active!,
      catalogStateLabels.retired!,
      msg("view.missing_from_database"),
      catalogStateLabels.uncatalogued!,
    ]),
  }),
  synchronization: synchronizationState,
  definitionChange: field(z.string(), {
    label: msg("catalog.change"),
    description: msg("catalog.how_the_activated_table_source_differs_from"),
    valueHelp: choiceHelp(z.string(), [
      catalogStateLabels.new!,
      catalogStateLabels.changed!,
      catalogStateLabels.source_commit_mismatch!,
      catalogStateLabels.deleted!,
    ]),
  }),
  definitionState: field(z.string(), {
    label: msg("catalog.activated_definition"),
    description: msg(
      "catalog.whether_the_activated_table_definition_is_available",
    ),
    valueHelp: choiceHelp(z.string(), [
      catalogStateLabels.present!,
      catalogStateLabels.changed!,
      catalogStateLabels.commit_mismatch!,
      catalogStateLabels.missing!,
      catalogStateLabels.unknown!,
      catalogStateLabels.error!,
      catalogStateLabels.unavailable!,
    ]),
  }),
  differenceStatus: field(z.string(), {
    label: msg("catalog.status"),
    description: msg("catalog.whether_a_compared_structure_agrees_or_needs"),
    valueHelp: choiceHelp(z.string(), ["OK", msg("view.attention")]),
  }),
  synchronizedAt: field(z.string(), {
    label: msg("view.last_synchronized"),
    description: msg("catalog.when_the_table_was_most_recently_synchronized"),
  }),
  attention: field(z.string(), {
    label: msg("view.attention"),
    description: msg("catalog.schema_or_inspection_problems_to_review_before"),
  }),
  columnName: field(z.string(), {
    label: msg("catalog.field"),
    description: msg("catalog.the_field_name_used_in_sql_queries"),
  }),
  logicalType: field(z.string(), {
    label: msg("catalog.logical_type"),
    description: msg(
      "catalog.the_package_defined_value_type_including_decimal",
    ),
    valueHelp: choiceHelp(z.string(), [
      "text",
      "boolean",
      "integer",
      "float",
      "decimal",
      "datetime",
      "bytes",
      "json",
      "enum",
    ]),
  }),
  databaseType: field(z.string(), {
    label: msg("catalog.database_type"),
    description: msg("catalog.the_physical_type_currently_used_by_the"),
  }),
  required: field(z.string(), {
    label: msg("catalog.required"),
    description: msg("catalog.whether_this_field_must_contain_a_value"),
    valueHelp: choiceHelp(z.string(), [msg("view.yes"), msg("choices.no")]),
  }),
  defaultValue: field(z.string(), {
    label: msg("catalog.default"),
    description: msg("catalog.the_value_supplied_by_the_table_definition"),
  }),
  databaseDefault: field(z.string(), {
    label: msg("catalog.database_default"),
    description: msg(
      "catalog.the_default_expression_currently_configured_in_the",
    ),
  }),
  constraints: field(z.string(), {
    label: msg("catalog.constraints"),
    description: msg("catalog.rules_such_as_primary_key_unique_or"),
  }),
  reference: field(z.string(), {
    label: msg("catalog.reference"),
    description: msg("catalog.the_related_table_and_field_referenced_by"),
  }),
  indexName: field(z.string(), {
    label: msg("catalog.index"),
    description: msg("catalog.the_name_of_the_index_used_to"),
  }),
  indexColumns: field(z.string(), {
    label: msg("catalog.fields"),
    description: msg("catalog.the_fields_in_this_index_in_index"),
  }),
  unique: field(z.string(), {
    label: msg("catalog.unique"),
    description: msg("catalog.whether_this_index_rejects_rows_with_duplicate"),
    valueHelp: choiceHelp(z.string(), [msg("view.yes"), msg("choices.no")]),
  }),
  difference: field(z.string(), {
    label: msg("catalog.difference"),
    description: msg(
      "catalog.a_difference_between_the_activated_definition_deployed",
    ),
  }),
  schemaState: field(synchronizationState, {
    label: msg("catalog.database_schema"),
    description: msg("catalog.whether_the_physical_database_agrees_with_the"),
  }),
  fields: field(z.string(), {
    label: msg("catalog.fields"),
    description: msg("catalog.the_number_of_active_and_retired_fields"),
  }),
  expression: field(z.string(), {
    label: msg("view.database_check"),
    description: msg(
      "catalog.an_expression_the_database_checks_when_inserting",
    ),
  }),
  change: field(z.string(), {
    label: msg("catalog.change"),
    description: msg(
      "catalog.how_the_activated_source_definition_differs_from",
    ),
    valueHelp: choiceHelp(z.string(), [
      catalogStateLabels.new!,
      msg("view.removed"),
      msg("view.same"),
      catalogStateLabels.changed!,
      catalogStateLabels.unavailable!,
    ]),
  }),
  activated: field(z.string(), {
    label: msg("catalog.activated_definition"),
    description: msg(
      "catalog.the_definition_evaluated_from_the_currently_activated",
    ),
  }),
  deployed: field(z.string(), {
    label: msg("catalog.deployed_definition"),
    description: msg(
      "catalog.the_definition_most_recently_synchronized_into_the",
    ),
  }),
  database: field(z.string(), {
    label: msg("catalog.database"),
    description: msg("catalog.the_field_or_index_as_it_currently"),
  }),
  result: field(z.string(), {
    label: msg("catalog.result"),
    description: msg("catalog.whether_the_compared_definitions_agree_or_how"),
  }),
  operation: field(z.string(), {
    label: msg("catalog.operation"),
    description: msg("catalog.the_database_operation_that_will_run_after"),
    valueHelp: choiceHelp(z.string(), [
      msg("view.retired_fields"),
      msg("program.retired_table"),
    ]),
  }),
  affected: field(z.string(), {
    label: msg("catalog.permanently_remove"),
    description: msg("catalog.the_table_or_retired_fields_whose_stored"),
  }),
  warning: field(z.string(), {
    label: msg("catalog.warning"),
    description: msg("catalog.the_data_loss_consequence_of_confirming_this"),
  }),
  activeColumns: field(z.number(), {
    label: msg("view.active_fields"),
    description: msg("catalog.number_of_fields_in_the_deployed_active"),
  }),
  retiredColumns: field(z.number(), {
    label: msg("view.retired_fields"),
    description: msg("catalog.number_of_retired_fields_retained_in_the"),
  }),
  confirmed: field(z.boolean(), {
    label: msg("catalog.i_understand_that_this_data_cannot_be"),
    description: msg(
      "catalog.confirm_only_after_reviewing_the_exact_structures",
    ),
  }),
});
