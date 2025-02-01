import { getTemplateSrv, TemplateSrv } from '@grafana/runtime';
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  FieldType,
  createDataFrame,
  AnnotationSupport,
  LoadingState,
} from '@grafana/data';
import { PRTGDataSourceSettings, TestDataSourceResponse } from './types/interface.datasource';
import { PRTGQuery, PRTGDataSourceConfig, PRTGApiConfig, PRTGAnnotationQuery } from './types';
import { PRTGQueryItem } from './types/interfaces'; 

import _ from 'lodash';
import { PRTGApi } from './Api';

export class PRTGDataSource extends DataSourceApi<PRTGQuery, PRTGDataSourceConfig> {
  static readonly pluginId = 'prtg-grafana-datasource';

  readonly api: PRTGApi;
  readonly templateSrv: TemplateSrv;
  readonly baseUrl: string;
  readonly username: string;
  readonly passhash: string;

  constructor(instanceSettings: PRTGDataSourceSettings) {
    super(instanceSettings);
    
    this.baseUrl = `https://${instanceSettings.jsonData.hostname}/api/`;
    this.username = instanceSettings.jsonData.username || '';
    this.passhash = instanceSettings.jsonData.passhash || '';

    const config: PRTGApiConfig = {
      baseUrl: `https://${instanceSettings.jsonData.hostname}/api/`,
      username: instanceSettings.jsonData.username || '',
      passwordHash: instanceSettings.jsonData.passhash || '',
      cacheTimeout: instanceSettings.jsonData.cacheTimeout || 300,
      enableTimeZoneAdjust: instanceSettings.jsonData.tzAutoAdjust || false,
      timeout: instanceSettings.jsonData.timeout || 30000,
    };

    this.api = new PRTGApi(config);
    this.templateSrv = getTemplateSrv();
  }

  async query(options: DataQueryRequest<PRTGQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const fromTime = range!.from.valueOf();
    const toTime = range!.to.valueOf();

    try {
      const promises = options.targets.map(async (target) => {
        if (!target.valueSelection?.name) {
          return null;
        }

        try {
          const sensorName = target.sensorSelection?.name;
          if (!sensorName) {
            return null;
          }

          const sensorInfo = await this.api.getSensorInfo(sensorName);
          const sensorId = sensorInfo.objid;
          if (!sensorId) {
            return null;
          }

          const queryItems: PRTGQueryItem[] = [{
            sensorId: sensorId,
            channelId: target.channelSelection?.name,
            name: target.valueSelection?.name
          }];

          const response = await this.api.performQuerySuggestQuery(fromTime, toTime, queryItems);
          const histData = response.histdata;

          if (!Array.isArray(histData) || histData.length === 0) {return null};

          const selectedValues = target.valueSelection.name
            .split(',')
            .map((v) => v.trim())
            .filter((v) => Object.keys(histData[0]).includes(v));

          const times = histData.map((item) => new Date(item.datetime).getTime());

          const fields = [
            { name: 'Time', type: FieldType.time, values: times, config: {} },
            ...selectedValues.map((metric) => ({
              name: metric,
              type: FieldType.number,
              values: histData.map((item) => parseFloat(String(item[metric])) || null),
              config: { displayName: metric },
            })),
          ];

          return createDataFrame({ refId: target.refId, fields });
        } catch (error) {
          console.error(`Query failed for target ${target.refId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      return { data: results.filter(Boolean), state: LoadingState.Done };
    } catch (error) {
      console.error('Query failed:', error);
      return { data: [], state: LoadingState.Error };
    }
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    try {
      const apiVersion = await this.api.getVersion();
      const authTest = await this.api.testAuth();
      if (!authTest) {
        return { status: 'error', message: 'Authentication failed' };
      }
      return { status: 'success', message: `Connected to PRTG ${apiVersion}` };
    } catch (error) {
      return { status: 'error', message: 'Connection failed' };
    }
  }

  annotations: AnnotationSupport<PRTGQuery> = {
    prepareQuery: (anno: PRTGAnnotationQuery) => {
      if (!anno.annotation.sensorId) return undefined;
      return {
        refId: 'annotations',
        queryType: 'metrics',
        sensorSelection: { name: anno.annotation.sensorId.toString() },
        groupSelection: { name: '*' },
        deviceSelection: { name: '*' },
        channelSelection: { name: '*' },
      } as PRTGQuery;
    },
  };
}
