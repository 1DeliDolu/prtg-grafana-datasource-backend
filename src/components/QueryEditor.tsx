import React, { useState, useEffect, useCallback } from 'react';
import { Select, InlineField, Stack, FieldSet } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { PRTGDataSource } from '../datasource';
import { PRTGQuery, PRTGDataSourceConfig } from '../types';

type Props = QueryEditorProps<PRTGDataSource, PRTGQuery, PRTGDataSourceConfig>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  // Selection lists
  const [groups, setGroups] = useState<SelectableValue<string>[]>([]);
  const [devices, setDevices] = useState<SelectableValue<string>[]>([]);
  const [sensors, setSensors] = useState<SelectableValue<string>[]>([]);
  const [channels, setChannels] = useState<SelectableValue<string>[]>([]);
  const [loading, setLoading] = useState({ groups: false, devices: false, sensors: false, channels: false });

  // Query object
  const target = query;

  // 🟢 Fetch Group List
  const fetchGroups = useCallback(async () => {
    setLoading((prev) => ({ ...prev, groups: true }));
    try {
      const groupData = await datasource.api.performGroupSuggestQuery();
      setGroups(groupData.map((g) => ({ label: g.group, value: g.group })));
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    }
    setLoading((prev) => ({ ...prev, groups: false }));
  }, [datasource]);

  // 🟢 Fetch Device List
  const fetchDevices = useCallback(async (group: string) => {
    if (!group) return;
    setLoading((prev) => ({ ...prev, devices: true }));
    try {
      const deviceData = await datasource.api.performDeviceSuggestQuery(group);
      setDevices(deviceData.map((d) => ({ label: d.device, value: d.device })));
    } catch (error) {
      console.error('Failed to fetch device data:', error);
    }
    setLoading((prev) => ({ ...prev, devices: false }));
  }, [datasource]);

  // 🟢 Fetch Sensor List
  const fetchSensors = useCallback(async (device: string) => {
    if (!device) return;
    setLoading((prev) => ({ ...prev, sensors: true }));
    try {
      const sensorData = await datasource.api.performSensorSuggestQuery(device);
      setSensors(sensorData.map((s) => ({ label: s.sensor, value: s.sensor })));
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
    }
    setLoading((prev) => ({ ...prev, sensors: false }));
  }, [datasource]);

  // 🟢 Fetch Channel List
  const fetchChannels = useCallback(async (sensor: string) => {
    if (!sensor) return;
    setLoading((prev) => ({ ...prev, channels: true }));
    try {
      const channelData = await datasource.api.performChannelSuggestQuery(undefined, undefined, sensor);
      setChannels(channelData.map((c) => ({ label: c.channel, value: c.channel })));
    } catch (error) {
      console.error('Failed to fetch channel data:', error);
    }
    setLoading((prev) => ({ ...prev, channels: false }));
  }, [datasource]);

  // 🟢 Fetch group data on component mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // 🟢 Handle user selections
  const handleGroupChange = (value: SelectableValue<string>) => {
    onChange({ ...target, groupSelection: { name: value.value || '' }, deviceSelection: { name: '' }, sensorSelection: { name: '' }, channelSelection: { name: '' } });
    fetchDevices(value.value || '');
    setSensors([]);
    setChannels([]);
    onRunQuery();
  };

  const handleDeviceChange = (value: SelectableValue<string>) => {
    onChange({ ...target, deviceSelection: { name: value.value || '' }, sensorSelection: { name: '' }, channelSelection: { name: '' } });
    fetchSensors(value.value || '');
    setChannels([]);
    onRunQuery();
  };

  const handleSensorChange = (value: SelectableValue<string>) => {
    onChange({ ...target, sensorSelection: { name: value.value || '' }, channelSelection: { name: '' } });
    fetchChannels(value.value || '');
    onRunQuery();
  };

  const handleChannelChange = (value: SelectableValue<string>) => {
    onChange({ ...target, channelSelection: { name: value.value || '' } });
    onRunQuery();
  };

  return (
    <Stack direction="column" gap={2}>
      <FieldSet label="PRTG Query Options">
        <Stack direction="row" gap={4}>
          <InlineField label="Group" labelWidth={20} grow>
            <Select options={groups} value={target.groupSelection?.name} onChange={handleGroupChange} width={40} isLoading={loading.groups} isClearable placeholder="Select Group" />
          </InlineField>

          <InlineField label="Device" labelWidth={20} grow>
            <Select options={devices} value={target.deviceSelection?.name} onChange={handleDeviceChange} width={40} isLoading={loading.devices} isDisabled={!target.groupSelection?.name} isClearable placeholder="Select Device" />
          </InlineField>
        </Stack>

        <Stack direction="row" gap={4}>
          <InlineField label="Sensor" labelWidth={20} grow>
            <Select options={sensors} value={target.sensorSelection?.name} onChange={handleSensorChange} width={40} isLoading={loading.sensors} isDisabled={!target.deviceSelection?.name} isClearable placeholder="Select Sensor" />
          </InlineField>

          <InlineField label="Channel" labelWidth={20} grow>
            <Select options={channels} value={target.channelSelection?.name} onChange={handleChannelChange} width={40} isLoading={loading.channels} isDisabled={!target.sensorSelection?.name} isClearable placeholder="Select Channel" />
          </InlineField>
        </Stack>
      </FieldSet>
    </Stack>
  );
}
