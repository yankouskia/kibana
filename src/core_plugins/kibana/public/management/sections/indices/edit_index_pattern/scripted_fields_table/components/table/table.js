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

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
  EuiInMemoryTable,
} from '@elastic/eui';

import { ReactI18n } from '@kbn/i18n';

const { I18nContext } = ReactI18n;

export class Table extends PureComponent {
  static propTypes = {
    indexPattern: PropTypes.object.isRequired,
    items: PropTypes.array.isRequired,
    editField: PropTypes.func.isRequired,
    deleteField: PropTypes.func.isRequired,
  }

  renderFormatCell = (value) => {
    const { indexPattern } = this.props;

    const title = indexPattern.fieldFormatMap[value] && indexPattern.fieldFormatMap[value].type
      ? indexPattern.fieldFormatMap[value].type.title
      : '';

    return (
      <span>{title}</span>
    );
  }

  render() {
    const {
      items,
      editField,
      deleteField,
    } = this.props;

    const getColumns = intl => ([{
      field: 'displayName',
      name: intl.formatMessage({ id: 'management.indexPattern.edit.scripted.table.name.label', defaultMessage: 'Name' }),
      description: intl.formatMessage({
        id: 'management.indexPattern.edit.scripted.table.name.detail', defaultMessage: 'Name of the field' }),
      dataType: 'string',
      sortable: true,
      width: '38%',
    }, {
      field: 'lang',
      name: intl.formatMessage({ id: 'management.indexPattern.edit.scripted.table.lang.label', defaultMessage: 'Lang' }),
      description: intl.formatMessage({
        id: 'management.indexPattern.edit.scripted.table.lang.detail',
        defaultMessage: 'Language used for the field' }),
      dataType: 'string',
      sortable: true,
      'data-test-subj': 'scriptedFieldLang',
    }, {
      field: 'script',
      name: intl.formatMessage({ id: 'management.indexPattern.edit.scripted.table.script.label', defaultMessage: 'Script' }),
      description: intl.formatMessage({
        id: 'management.indexPattern.edit.scripted.table.script.detail', defaultMessage: 'Script for the field' }),
      dataType: 'string',
      sortable: true,
    }, {
      field: 'name',
      name: intl.formatMessage({ id: 'management.indexPattern.edit.scripted.table.format.label', defaultMessage: 'Format' }),
      description: intl.formatMessage({
        id: 'management.indexPattern.edit.scripted.table.format.detail', defaultMessage: 'Format used for the field' }),
      render: this.renderFormatCell,
      sortable: false,
    }, {
      name: '',
      actions: [{
        name: intl.formatMessage({ id: 'management.indexPattern.edit.scripted.table.edit.label', defaultMessage: 'Edit' }),
        description: intl.formatMessage({
          id: 'management.indexPattern.edit.scripted.table.edit.detail', defaultMessage: 'Edit this field' }),
        icon: 'pencil',
        onClick: editField,
      }, {
        name: intl.formatMessage({ id: 'management.indexPattern.edit.scripted.table.delete.label', defaultMessage: 'Delete' }),
        description: intl.formatMessage({
          id: 'management.indexPattern.edit.scripted.table.delete.detail', defaultMessage: 'Delete this field' }),
        icon: 'trash',
        color: 'danger',
        onClick: deleteField,
      }],
      width: '40px',
    }]);

    const pagination = {
      initialPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
    };

    return (
      <I18nContext>
        {intl => {
          const columns = getColumns(intl);

          return (<EuiInMemoryTable
            items={items}
            columns={columns}
            pagination={pagination}
            sorting={true}
          />);
        }}
      </I18nContext>
    );
  }
}
