import React, { ChangeEvent } from 'react';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions, MySecureJsonData> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  const onHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        hostname: event.target.value,
      },
    });
  };

  const onUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        username: event.target.value,
      },
    });
  }

  // Secure field (only sent to the backend)
  const onPasshashChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        passhash: event.target.value,
      },
    });
  };

  const onResetPasshash = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiKey: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        passhash: '',
      },
    });
  };

  const onCacheTimeOutChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        hostname: event.target.value,
      },
    });
  };

  return (
    <>
      <InlineField label="Hostname" labelWidth={14} interactive tooltip={'Json field returned to frontend'}>
        <Input
          id="config-editor-hostname"
          onChange={onHostChange}
          value={jsonData.hostname}
          placeholder="Enter the host, e.g. your-prtg-host"
          width={60}
        />
      </InlineField>
      <InlineField label="Username" labelWidth={14} interactive tooltip={'Json field returned to frontend'}>
        <Input
          id="config-editor-username"
          onChange={onUsernameChange}
          value={jsonData.username}
          placeholder="Enter your username"
          width={60}
        />  
      </InlineField>
      <InlineField label="Passhash" labelWidth={14} interactive tooltip={'Secure json field (backend only)'}>
        <SecretInput
          required
          id="config-editor-prtg-passhash"
          isConfigured={secureJsonFields.passhash}
          value={secureJsonData?.passhash}
          placeholder="Enter your passhash"
          width={50}
          onReset={onResetPasshash}
          onChange={onPasshashChange}
        />
      </InlineField>
      <InlineField label="Cache Time" labelWidth={14} interactive tooltip={'Json field returned to frontend'}>
        <Input
          id="config-editor-cache-timeout"
          onChange={onCacheTimeOutChange}
          value={jsonData.cacheTimeOut}
          placeholder="Enter the cache timeout in seconds"
          width={60}
        />    
      </InlineField>
    </>
  );
}
