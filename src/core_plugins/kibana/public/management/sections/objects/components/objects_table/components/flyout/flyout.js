/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { groupBy, take } from 'lodash';
import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiButtonEmpty,
  EuiButton,
  EuiText,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiSwitch,
  EuiFilePicker,
  EuiInMemoryTable,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingKibana,
  EuiCallOut,
  EuiSpacer,
  EuiLink,
} from '@elastic/eui';
import { ReactI18n } from '@kbn/i18n';
import { importFile } from '../../../../lib/import_file';
import {
  resolveSavedObjects,
  resolveSavedSearches,
  resolveIndexPatternConflicts,
  saveObjects,
} from '../../../../lib/resolve_saved_objects';
import { INCLUDED_TYPES } from '../../objects_table';

const { FormattedMessage, I18nContext } = ReactI18n;

const errorTypes = {
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
  FILE_INVALID_FORMAT_ERROR: 'FILE_INVALID_FORMAT_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
};

const loadingTypes = {
  SAVING_CONFLICTS: 'SAVING_CONFLICTS',
  RESOLVING_CONFLICTS: 'RESOLVING_CONFLICTS',
  ENSURING_SAVED_SEARCHES: 'ENSURING_SAVED_SEARCHES',
};

export class Flyout extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    done: PropTypes.func.isRequired,
    services: PropTypes.array.isRequired,
    newIndexPatternUrl: PropTypes.string.isRequired,
    indexPatterns: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      conflictedIndexPatterns: undefined,
      conflictedSavedObjectsLinkedToSavedSearches: undefined,
      conflictedSearchDocs: undefined,
      conflicts: undefined,
      error: undefined,
      file: undefined,
      importCount: 0,
      indexPatterns: undefined,
      isOverwriteAllChecked: true,
      isLoading: false,
      loadingType: undefined,
      wasImportSuccessful: false,
    };
  }

  componentDidMount() {
    this.fetchIndexPatterns();
  }

  fetchIndexPatterns = async () => {
    const indexPatterns = await this.props.indexPatterns.getFields([
      'id',
      'title',
    ]);
    this.setState({ indexPatterns });
  };

  changeOverwriteAll = () => {
    this.setState(state => ({
      isOverwriteAllChecked: !state.isOverwriteAllChecked,
    }));
  };

  setImportFile = ([file]) => {
    this.setState({ file });
  };

  import = async () => {
    const { services, indexPatterns } = this.props;
    const { file, isOverwriteAllChecked } = this.state;

    this.setState({ isLoading: true, error: undefined });

    let contents;

    try {
      contents = await importFile(file);
    } catch (e) {
      this.setState({
        isLoading: false,
        error: {
          type: errorTypes.FILE_PROCESSING_ERROR,
        },
      });
      return;
    }

    if (!Array.isArray(contents)) {
      this.setState({
        isLoading: false,
        error: {
          type: errorTypes.FILE_INVALID_FORMAT_ERROR,
        },
      });
      return;
    }

    contents = contents.filter(content =>
      INCLUDED_TYPES.includes(content._type)
    );

    const {
      conflictedIndexPatterns,
      conflictedSavedObjectsLinkedToSavedSearches,
      conflictedSearchDocs,
      importedObjectCount,
    } = await resolveSavedObjects(
      contents,
      isOverwriteAllChecked,
      services,
      indexPatterns
    );

    const byId = groupBy(conflictedIndexPatterns, ({ obj }) =>
      obj.searchSource.getOwn('index')
    );
    const conflicts = Object.entries(byId).reduce(
      (accum, [existingIndexPatternId, list]) => {
        accum.push({
          existingIndexPatternId,
          newIndexPatternId: undefined,
          list: list.map(({ doc }) => ({
            id: existingIndexPatternId,
            type: doc._type,
            name: doc._source.title,
          })),
        });
        return accum;
      },
      []
    );

    this.setState({
      conflictedIndexPatterns,
      conflictedSavedObjectsLinkedToSavedSearches,
      conflictedSearchDocs,
      conflicts,
      importCount: importedObjectCount,
      isLoading: false,
      wasImportSuccessful: conflicts.length === 0,
    });
  };

  get hasConflicts() {
    return this.state.conflicts && this.state.conflicts.length > 0;
  }

  get resolutions() {
    return this.state.conflicts.reduce(
      (accum, { existingIndexPatternId, newIndexPatternId }) => {
        if (newIndexPatternId) {
          accum.push({
            oldId: existingIndexPatternId,
            newId: newIndexPatternId,
          });
        }
        return accum;
      },
      []
    );
  }

  confirmImport = async () => {
    const {
      conflictedIndexPatterns,
      isOverwriteAllChecked,
      conflictedSavedObjectsLinkedToSavedSearches,
      conflictedSearchDocs,
    } = this.state;

    const { services, indexPatterns } = this.props;

    this.setState({
      error: undefined,
      isLoading: true,
      loadingType: undefined,
    });

    let importCount = this.state.importCount;

    if (this.hasConflicts) {
      try {
        const resolutions = this.resolutions;

        // Do not Promise.all these calls as the order matters
        this.setState({ loadingType: loadingTypes.RESOLVING_CONFLICTS });
        if (resolutions.length) {
          importCount += await resolveIndexPatternConflicts(
            resolutions,
            conflictedIndexPatterns,
            isOverwriteAllChecked
          );
        }
        this.setState({ loadingType: loadingTypes.SAVING_CONFLICTS });
        importCount += await saveObjects(
          conflictedSavedObjectsLinkedToSavedSearches,
          isOverwriteAllChecked
        );
        this.setState({
          loadingType: loadingTypes.ENSURING_SAVED_SEARCHES,
        });
        importCount += await resolveSavedSearches(
          conflictedSearchDocs,
          services,
          indexPatterns,
          isOverwriteAllChecked
        );
      } catch ({ message }) {
        this.setState({
          isLoading: false,
          loadingType: undefined,
          error: {
            type: errorTypes.SYSTEM_ERROR,
            message,
          },
        });
        return;
      }
    }

    this.setState({ isLoading: false, wasImportSuccessful: true, importCount });
  };

  onIndexChanged = (id, e) => {
    const value = e.target.value;
    this.setState(state => {
      const conflictIndex = state.conflicts.findIndex(
        conflict => conflict.existingIndexPatternId === id
      );
      if (conflictIndex === -1) {
        return state;
      }

      return {
        conflicts: [
          ...state.conflicts.slice(0, conflictIndex),
          {
            ...state.conflicts[conflictIndex],
            newIndexPatternId: value,
          },
          ...state.conflicts.slice(conflictIndex + 1),
        ],
      };
    });
  };

  renderConflicts() {
    const { conflicts } = this.state;

    if (!conflicts) {
      return null;
    }

    const getColumns = intl => [
      {
        field: 'existingIndexPatternId',
        name: intl.formatMessage({
          id: 'kbn.management.savedObjects.conflicts.columns.id.name',
          defaultMessage: 'ID'
        }),
        description: intl.formatMessage({
          id: 'kbn.management.savedObjects.conflicts.columns.id.description',
          defaultMessage: 'ID of the index pattern'
        }),
        sortable: true,
      },
      {
        field: 'list',
        name: intl.formatMessage({
          id: 'kbn.management.savedObjects.conflicts.columns.count.name',
          defaultMessage: 'Count'
        }),
        description: intl.formatMessage({
          id: 'kbn.management.savedObjects.conflicts.columns.count.description',
          defaultMessage: 'How many affected objects'
        }),
        render: list => {
          return <Fragment>{list.length}</Fragment>;
        },
      },
      {
        field: 'list',
        name: intl.formatMessage({
          id: 'kbn.management.savedObjects.conflicts.columns.affectedObjects.name',
          defaultMessage: 'Sample of affected objects'
        }),
        description: intl.formatMessage({
          id: 'kbn.management.savedObjects.conflicts.columns.affectedObjects.description',
          defaultMessage: 'Sample of affected objects'
        }),
        render: list => {
          return (
            <ul style={{ listStyle: 'none' }}>
              {take(list, 3).map((obj, key) => <li key={key}>{obj.name}</li>)}
            </ul>
          );
        },
      },
      {
        field: 'existingIndexPatternId',
        name: intl.formatMessage({
          id: 'kbn.management.savedObjects.conflicts.columns.newIndex.name',
          defaultMessage: 'New index pattern'
        }),
        render: id => {
          const options = this.state.indexPatterns.map(indexPattern => ({
            text: indexPattern.get('title'),
            value: indexPattern.id,
          }));

          const initialOption = {
            text: intl.formatMessage({
              id: 'kbn.management.savedObjects.conflicts.columns.newIndex.sampleText',
              defaultMessage: '-- Skip Import --'
            }),
            value: '',
          };

          options.unshift(initialOption);

          return (
            <EuiSelect
              data-test-subj="managementChangeIndexSelection"
              onChange={e => this.onIndexChanged(id, e)}
              options={options}
            />
          );
        },
      },
    ];

    const pagination = {
      pageSizeOptions: [5, 10, 25],
    };

    return (
      <I18nContext>
        {intl => (
          <EuiInMemoryTable
            items={conflicts}
            columns={getColumns(intl)}
            pagination={pagination}
          />
        )}
      </I18nContext>
    );
  }

  renderErrorMessage(error) {
    if (!error) {
      return null;
    }

    const { type, message } = error;

    switch (type) {
      case errorTypes.FILE_INVALID_FORMAT_ERROR:
        return (
          <FormattedMessage
            id="kbn.management.savedObjects.errors.fileInvalidFormat"
            defaultMessage="Saved objects file format is invalid and cannot be imported."
          />
        );
      case errorTypes.FILE_PROCESSING_ERROR:
        return (
          <FormattedMessage
            id="kbn.management.savedObjects.errors.fileProcessing"
            defaultMessage="The file could not be processed."
          />
        );
      case errorTypes.SYSTEM_ERROR:
        return message;
      default:
        return null;
    }
  }

  renderError() {
    const { error } = this.state;

    if (!error) {
      return null;
    }

    return (
      <Fragment>
        <EuiCallOut
          title={
            <FormattedMessage
              id="kbn.management.savedObjects.conflicts.title"
              defaultMessage="Sorry, there was an error"
            />
          }
          color="danger"
          iconType="cross"
        >
          <p>{this.renderErrorMessage(error)}</p>
        </EuiCallOut>
        <EuiSpacer size="s" />
      </Fragment>
    );
  }

  renderLoadingDetails(loadingType) {
    if (!loadingType) {
      return null;
    }

    switch (loadingType) {
      case loadingTypes.ENSURING_SAVED_SEARCHES:
        return (
          <FormattedMessage
            id="kbn.management.savedObjects.loading.ensuringSavedSearches"
            defaultMessage="Ensure saved searches are linked properly..."
          />
        );
      case loadingTypes.RESOLVING_CONFLICTS:
        return (
          <FormattedMessage
            id="kbn.management.savedObjects.loading.resolvingConflicts"
            defaultMessage="Resolving conflicts...'"
          />
        );
      case loadingTypes.SAVING_CONFLICTS:
        return (
          <FormattedMessage
            id="kbn.management.savedObjects.loading.savingConflicts"
            defaultMessage="Saving conflicts..."
          />
        );
      default:
        return null;
    }
  }

  renderBody() {
    const {
      isLoading,
      loadingType,
      isOverwriteAllChecked,
      wasImportSuccessful,
      importCount,
    } = this.state;

    if (isLoading) {
      return (
        <EuiFlexGroup justifyContent="spaceAround">
          <EuiFlexItem grow={false}>
            <EuiLoadingKibana size="xl" />
            <EuiSpacer size="m" />
            <EuiText>
              <p>{this.renderLoadingDetails(loadingType)}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    if (wasImportSuccessful) {
      return (
        <EuiCallOut
          title={
            <FormattedMessage
              id="kbn.management.savedObjects.import.success.title"
              defaultMessage="Import successful"
            />
          }
          color="success"
          iconType="check"
        >
          <p>
            <FormattedMessage
              id="kbn.management.savedObjects.import.success.details"
              defaultMessage="Successfully imported {importCount, plural, one {object} other {objects}}."
              values={{ importCount }}
            />
          </p>
        </EuiCallOut>
      );
    }

    if (this.hasConflicts) {
      return this.renderConflicts();
    }

    return (
      <EuiForm>
        <EuiFormRow
          label={
            <FormattedMessage
              id="kbn.management.savedObjects.flyout.import.chooseFile"
              defaultMessage="Please select a JSON file to import"
            />
          }
        >
          <EuiFilePicker
            initialPromptText={
              <FormattedMessage
                id="kbn.management.savedObjects.flyout.import.importFile"
                defaultMessage="Import"
              />
            }
            onChange={this.setImportFile}
          />
        </EuiFormRow>
        <EuiFormRow>
          <EuiSwitch
            name="overwriteAll"
            label={
              <FormattedMessage
                id="kbn.management.savedObjects.flyout.import.overwrite"
                defaultMessage="Automatically overwrite all saved objects?"
              />
            }
            data-test-subj="importSavedObjectsOverwriteToggle"
            checked={isOverwriteAllChecked}
            onChange={this.changeOverwriteAll}
          />
        </EuiFormRow>
      </EuiForm>
    );
  }

  renderFooter() {
    const { isLoading, wasImportSuccessful } = this.state;
    const { done, close } = this.props;

    let confirmButton;

    if (wasImportSuccessful) {
      confirmButton = (
        <EuiButton
          onClick={done}
          size="s"
          fill
          data-test-subj="importSavedObjectsDoneBtn"
        >
          <FormattedMessage
            id="kbn.management.savedObjects.flyout.import.done"
            defaultMessage="Done"
          />
        </EuiButton>
      );
    } else if (this.hasConflicts) {
      confirmButton = (
        <EuiButton
          onClick={this.confirmImport}
          size="s"
          fill
          isLoading={isLoading}
          data-test-subj="importSavedObjectsConfirmBtn"
        >
          <FormattedMessage
            id="kbn.management.savedObjects.flyout.import.confirmChanges"
            defaultMessage="Confirm all changes"
          />
        </EuiButton>
      );
    } else {
      confirmButton = (
        <EuiButton
          onClick={this.import}
          size="s"
          fill
          isLoading={isLoading}
          data-test-subj="importSavedObjectsImportBtn"
        >
          <FormattedMessage
            id="kbn.management.savedObjects.flyout.import.confirm"
            defaultMessage="Import"
          />
        </EuiButton>
      );
    }

    return (
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty onClick={close} size="s">
            <FormattedMessage
              id="kbn.management.savedObjects.flyout.import.cancel"
              defaultMessage="Cancel"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>{confirmButton}</EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  renderSubheader() {
    if (
      !this.hasConflicts ||
      this.state.isLoading ||
      this.state.wasImportSuccessful
    ) {
      return null;
    }

    return (
      <Fragment>
        <EuiSpacer size="s" />
        <EuiCallOut
          title={<FormattedMessage
            id="kbn.management.savedObjects.flyout.conflicts.description.title"
            defaultMessage="Index Pattern Conflicts"
          />}
          color="warning"
          iconType="help"
        >
          <p>
            <FormattedMessage
              id="kbn.management.savedObjects.flyout.conflicts.description.details"
              defaultMessage={`\
The following saved objects use index patterns that do not exist. \
Please select the index patterns you&apos;d like re-associated with \
them. You can {newIndexPatternLinkTitle} if necessary.
              `}
              values={{
                newIndexPatternLinkTitle: (
                  <EuiLink href={this.props.newIndexPatternUrl}>
                    <FormattedMessage
                      id="kbn.management.savedObjects.flyout.conflicts.description.linkTitle"
                      defaultMessage="create a new index pattern"
                    />
                  </EuiLink>
                ),
              }}
            />
          </p>
        </EuiCallOut>
      </Fragment>
    );
  }

  render() {
    const { close } = this.props;

    return (
      <EuiFlyout onClose={close}>
        <EuiFlyoutHeader>
          <EuiTitle>
            <h2>
              <FormattedMessage
                id="kbn.management.savedObjects.flyout.title"
                defaultMessage="Import saved objects"
              />
            </h2>
          </EuiTitle>
          {this.renderSubheader()}
        </EuiFlyoutHeader>

        <EuiFlyoutBody>
          {this.renderError()}
          {this.renderBody()}
        </EuiFlyoutBody>

        <EuiFlyoutFooter>{this.renderFooter()}</EuiFlyoutFooter>
      </EuiFlyout>
    );
  }
}
