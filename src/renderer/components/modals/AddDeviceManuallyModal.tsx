import { useState, useEffect } from "react";
import { Modal, Button, Input, Loading, MultiSelect } from "../ui";
import { useGroups, useDevices } from "../../hooks";
import { useAppContext } from "../../context/AppContext";
import type { ScannedDevice } from "@/types/api";

interface AddDeviceManuallyModalProps {
  open: boolean;
  onClose: () => void;
  prefillDevice?: ScannedDevice | null;
}

export function AddDeviceManuallyModal({
  open,
  onClose,
  prefillDevice,
}: AddDeviceManuallyModalProps) {
  const {
    groups,
    loading: groupsLoading,
    addDeviceToGroup,
    getGroupsForDevice,
  } = useGroups();
  const { addDevice } = useDevices();
  const {
    selectedGroupIdsForManualDevice,
    setSelectedGroupIdsForManualDevice,
  } = useAppContext();

  const [deviceName, setDeviceName] = useState("");
  const [deviceIp, setDeviceIp] = useState("");
  const [deviceMac, setDeviceMac] = useState("");
  const [deviceManufacturer, setDeviceManufacturer] = useState("");
  const [deviceFriendlyName, setDeviceFriendlyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill form and group selection when modal opens with a scanned device
  useEffect(() => {
    const prefill = async () => {
      if (open && prefillDevice) {
        setDeviceName(prefillDevice.name || prefillDevice.hostname || "");
        setDeviceIp(prefillDevice.ip || "");
        setDeviceMac(prefillDevice.mac || "");
        setDeviceManufacturer(prefillDevice.manufacturer || "");
        setDeviceFriendlyName("");
        // If the device has an id, try to prefill group selection
        if ("id" in prefillDevice && prefillDevice.id) {
          const groups = await getGroupsForDevice(prefillDevice.id);
          setSelectedGroupIdsForManualDevice(new Set(groups.map((g) => g.id)));
        } else {
          setSelectedGroupIdsForManualDevice(new Set());
        }
      }
    };
    prefill();
  }, [
    open,
    prefillDevice,
    getGroupsForDevice,
    setSelectedGroupIdsForManualDevice,
  ]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setDeviceName("");
      setDeviceIp("");
      setDeviceMac("");
      setDeviceManufacturer("");
      setDeviceFriendlyName("");
      setSelectedGroupIdsForManualDevice(new Set());
      setErrors({});
    }
  }, [open, setSelectedGroupIdsForManualDevice]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!deviceName.trim()) {
      newErrors.name = "Device name is required";
    }

    if (!deviceIp.trim()) {
      newErrors.ip = "IP address is required";
    } else {
      // Basic IP validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(deviceIp.trim())) {
        newErrors.ip = "Invalid IP address format";
      }
    }

    if (selectedGroupIdsForManualDevice.size === 0) {
      newErrors.groups = "Select at least one group";
    }

    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      // Create the device
      const deviceId = await addDevice({
        name: deviceName.trim(),
        ip: deviceIp.trim(),
        mac: deviceMac.trim() || undefined,
        manufacturer: deviceManufacturer.trim() || undefined,
        friendlyName: deviceFriendlyName.trim() || undefined,
      });

      if (deviceId) {
        // Add device to selected groups
        for (const groupId of selectedGroupIdsForManualDevice) {
          await addDeviceToGroup(deviceId, groupId);
        }

        setSaving(false);
        onClose();
      } else {
        setSaving(false);
        setErrors({ form: "Failed to create device. Please try again." });
      }
    } catch (err) {
      console.error("Error saving device:", err);
      setSaving(false);
      setErrors({
        form: `Failed to create device: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  };

  const isValid =
    deviceName.trim() &&
    deviceIp.trim() &&
    selectedGroupIdsForManualDevice.size > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Device Manually"
      size="medium"
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="filled"
            onClick={handleSave}
            disabled={!isValid}
            loading={saving}
          >
            Save Device
          </Button>
        </>
      }
    >
      {errors.form && (
        <div className="form-error-banner">
          <span className="material-icons">error</span>
          {errors.form}
        </div>
      )}

      <Input
        label="Device Name *"
        value={deviceName}
        onChange={(e) => setDeviceName(e.target.value)}
        placeholder="e.g., My Device"
        error={errors.name}
        fullWidth
      />

      <Input
        label="IP Address *"
        value={deviceIp}
        onChange={(e) => setDeviceIp(e.target.value)}
        placeholder="e.g., 192.168.1.100"
        error={errors.ip}
        fullWidth
      />

      <Input
        label="MAC Address"
        value={deviceMac}
        onChange={(e) => setDeviceMac(e.target.value)}
        placeholder="e.g., 00:11:22:33:44:55"
        fullWidth
      />

      <Input
        label="Manufacturer"
        value={deviceManufacturer}
        onChange={(e) => setDeviceManufacturer(e.target.value)}
        placeholder="e.g., Apple Inc."
        fullWidth
      />

      <Input
        label="Friendly Name"
        value={deviceFriendlyName}
        onChange={(e) => setDeviceFriendlyName(e.target.value)}
        placeholder="e.g., Living Room TV"
        fullWidth
      />

      {groupsLoading ? (
        <Loading message="Loading groups..." />
      ) : (
        <MultiSelect
          label="Select Groups *"
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
          selected={selectedGroupIdsForManualDevice}
          onChange={setSelectedGroupIdsForManualDevice}
          placeholder="Select groups"
          error={errors.groups}
          helperText={
            groups.length === 0
              ? "No groups available. Create one in the Device Groups tab."
              : undefined
          }
          fullWidth
        />
      )}
    </Modal>
  );
}
