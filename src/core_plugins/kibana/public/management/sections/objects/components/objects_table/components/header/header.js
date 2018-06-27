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

import React, { Fragment } from 'react';

import {
  EuiSpacer,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTextColor,
  EuiButtonEmpty,
} from '@elastic/eui';

import { ReactI18n } from '@kbn/i18n';

const { FormattedMessage } = ReactI18n;

export const Header = ({
  onExportAll,
  onImport,
  onRefresh,
  totalCount,
}) => (
  <Fragment>
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="baseline">
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems="baseline" gutterSize="m" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle>
              <h1>
                <FormattedMessage
                  id="kbn.management.savedObjects.title"
                  defaultMessage="Saved Objects"
                />
              </h1>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTextColor color="subdued">
              <p>
                <FormattedMessage
                  id="kbn.management.savedObjects.count"
                  defaultMessage="{totalCount} in total"
                  values={{ totalCount }}
                />
              </p>
            </EuiTextColor>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems="baseline" gutterSize="m" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="exportAction"
              data-test-subj="exportAllObjects"
              onClick={onExportAll}
            >
              <FormattedMessage
                id="kbn.management.savedObjects.exportEverything"
                defaultMessage="Export Everything"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="importAction"
              data-test-subj="importObjects"
              onClick={onImport}
            >
              <FormattedMessage
                id="kbn.management.savedObjects.import"
                defaultMessage="Import"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="refresh"
              onClick={onRefresh}
            >
              <FormattedMessage
                id="kbn.management.savedObjects.refresh"
                defaultMessage="Refresh"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="m"/>
    <EuiText>
      <p>
        <EuiTextColor color="subdued">
          <FormattedMessage
            id="kbn.management.savedObjects.description"
            defaultMessage={`\
From here you can delete saved objects, such as saved searches.\
You can also edit the raw data of saved objects.\
Typically objects are only modified via their associated application,\
which is probably what you should use instead of this screen.`}
          />
        </EuiTextColor>
      </p>
    </EuiText>
    <EuiSpacer size="m"/>
  </Fragment>
);
