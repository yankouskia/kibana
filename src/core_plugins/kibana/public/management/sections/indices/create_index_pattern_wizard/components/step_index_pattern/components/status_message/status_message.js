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

import React from 'react';

import {
  EuiText,
  EuiTextColor,
  EuiIcon,
} from '@elastic/eui';

import { ReactI18n } from '@kbn/i18n';

const { FormattedMessage } = ReactI18n;

export const StatusMessage = ({
  matchedIndices: {
    allIndices = [],
    exactMatchedIndices = [],
    partialMatchedIndices = []
  },
  isIncludingSystemIndices,
  query,
}) => {
  let statusIcon;
  let statusMessage;
  let statusColor;

  if (query.length === 0) {
    statusIcon = null;
    statusColor = 'default';

    if (allIndices.length > 1) {
      statusMessage = (
        <span>
          <FormattedMessage
            id="management.indices.createIndexPattern.step.status.match"
            defaultMessage="Your index pattern can match any of your {allIndices}, below."
            values={{ allIndices: (
              <strong><FormattedMessage
                id="management.indices.indexPattern.status.match.count"
                defaultMessage="{allIndicesLength, plural, one {# index} other {# indices}}"
                values={{ allIndicesLength: allIndices.length }}
              />
              </strong>) }}
          />
        </span>
      );
    }
    else if (!isIncludingSystemIndices) {
      statusMessage = (
        <span>
          <FormattedMessage
            id="management.indices.createIndexPattern.step.status.noSystemIndicesWithPrompt"
            defaultMessage="No Elasticsearch indices match your pattern.
            To view the matching system indices, toggle the switch in the upper right."
          />
        </span>
      );
    }
    else {
      // This should never really happen but let's handle it just in case
      statusMessage = (
        <span>
          <FormattedMessage
            id="management.indices.createIndexPattern.step.status.noSystemIndices"
            defaultMessage="No Elasticsearch indices match your pattern."
          />
        </span>
      );
    }
  }
  else if (exactMatchedIndices.length) {
    statusIcon = 'check';
    statusColor = 'secondary';
    statusMessage = (
      <span>
        &nbsp;
        <strong>
          <FormattedMessage
            id="management.indices.createIndexPattern.step.status.success"
            defaultMessage="Success!"
          />
        </strong>
        &nbsp;
        <FormattedMessage
          id="management.indices.createIndexPattern.step.status.success.description"
          defaultMessage="Your index pattern matches {exactMatchedIndices}."
          values={{
            exactMatchedIndices: (
              <strong>
                <FormattedMessage
                  id="management.indices.createIndexPattern.step.status.success.description.index"
                  defaultMessage="{indicesLength, plural, one {# index} other {# indices} }"
                  values={{ indicesLength: exactMatchedIndices.length }}
                />
              </strong>)
          }}
        />
      </span>
    );
  }
  else if (partialMatchedIndices.length) {
    statusIcon = null;
    statusColor = 'default';
    statusMessage = (
      <span>
        <FormattedMessage
          id="management.indices.createIndexPattern.step.status.partialMatch.label1"
          defaultMessage="Your index pattern doesn{apostrophe}t match any indices, but you have{space}"
          values={{ apostrophe: <span>&apos;</span>, space: <span>&nbsp;</span> }}
        />
        <strong>
          <FormattedMessage
            id="management.indices.createIndexPattern.step.status.partialMatch.label2"
            defaultMessage="{matchedIndicesLength, plural, one {# index} other {# indices}} "
            values={{ matchedIndicesLength: partialMatchedIndices.length }}
          />
        </strong>
        <FormattedMessage
          id="management.indices.createIndexPattern.step.status.partialMatch.label3"
          defaultMessage="which {matchedIndicesLength, plural, one {# looks} other {# look}} similar."
          values={{ matchedIndicesLength: partialMatchedIndices.length }}
        />
      </span>
    );
  }
  else if (allIndices.length) {
    statusIcon = null;
    statusColor = 'default';
    statusMessage = (
      <span>
        <FormattedMessage
          id="management.indices.createIndexPattern.step.status.notMatch"
          defaultMessage="The index pattern you{apostrophe}ve entered doesn{apostrophe}t match any indices.
          You can match any of your {allIndices}, below."
          values={{ apostrophe: <span>&apos;</span>, allIndices: (
            <strong><FormattedMessage
              id="management.indices.createIndexPattern.step.status.notMatch.allIndices"
              defaultMessage="{indicesLength} indices"
              values={{ indicesLength: allIndices.length }}
            />
            </strong>) }}
        />
      </span>
    );
  }

  return (
    <EuiText size="s">
      <EuiTextColor color={statusColor}>
        { statusIcon ? <EuiIcon type={statusIcon}/> : null }
        {statusMessage}
      </EuiTextColor>
    </EuiText>
  );
};
