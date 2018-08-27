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

import * as i18n from '../core';

export type I18nServiceType = (
  id: string,
  options: { values: { [key: string]: string }; defaultMessage: string }
) => string;

export class I18nProvider implements angular.IServiceProvider {
  public addMessages = i18n.addMessages;
  public getMessages = i18n.getMessages;
  public setLocale = i18n.setLocale;
  public getLocale = i18n.getLocale;
  public setDefaultLocale = i18n.setDefaultLocale;
  public getDefaultLocale = i18n.getDefaultLocale;
  public setFormats = i18n.setFormats;
  public getFormats = i18n.getFormats;
  public getRegisteredLocales = i18n.getRegisteredLocales;
  public init = i18n.init;
  public $get = (): I18nServiceType => i18n.translate;
}
