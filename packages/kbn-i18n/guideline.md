# I18n Guideline


## Best practices

- For placeholder's message the id should end with `_placeholder`.

  ```js
  <EuiFieldText
      name="indexPatternId"
      placeholder={intl.formatMessage({
        id: 'kbn.management.indexPattern.create.stepTime.options.pattern_placeholder',
        defaultMessage: 'custom-index-pattern-id' })}
  />
  ```
  
- For `aria-label` attribute's message the id should end with `_aria`.

  ```js
  <div 
      class="col-md-2 sidebar-container" 
      role="region" 
      aria-label="{{'kbn.management.indexPattern.edit.header_aria' | i18n: {defaultMessage: 'Index patterns'} }}">
      ...
  </div>
  ```
  
- To follow `eslint` rules for long default messages use backslashes in interpolated string.

  ```js  
  <FormattedMessage
      id="management.indexPattern.create.step.status.noSystemIndicesWithPrompt"
      defaultMessage={`No Elasticsearch indices match your pattern. To view the matching system indices, \
  toggle the switch in the upper right.`}
  />
  ```
  Please make sure that there are no spaces and tabs on the next line after backslash.
  

  