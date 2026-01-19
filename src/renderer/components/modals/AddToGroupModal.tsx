import { useState, useEffect } from "react";
import { Modal, Button, Input, Loading, MultiSelect } from "../ui";
import { useGroups } from "../../hooks";
import { useAppContext } from "../../context/AppContext";
import type { Device } from "@/types/api";

interface AddToGroupModalProps {
  open: boolean;
  onClose: () => void;
  device?: Device | null;
}

export function AddToGroupModal({
  open,
  onClose,
  device,
}: AddToGroupModalProps) {
  console.log("AddToGroupModal RENDER:", { open, device: device?.id });

  const {
    groups,
    loading: groupsLoading,
    createGroup,
    addDeviceToGroup,
    removeDeviceFromGroup,
    getGroupsForDevice,
  } = useGroups();
  const {
    selectedGroupIds,
    originalGroupIds,
    setSelectedGroupIds,
    setOriginalGroupIds,
    hasGroupSelectionChanged,
  } = useAppContext();

  const [saving, setSaving] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  console.log("AddToGroupModal state:", {
    selectedGroupIds: Array.from(selectedGroupIds),
    open,
    device: device?.id,
  });

  // Load device's current groups when modal opens
  useEffect(() => {
    console.log("AddToGroupModal effect running:", { open, device });
    if (open && device) {
      console.log("Loading groups for device:", device.id);
      getGroupsForDevice(device.id).then((deviceGroups) => {
        console.log("Device groups loaded:", deviceGroups);
        const groupIds = new Set(deviceGroups.map((g) => g.id));
        console.log("Setting selected group IDs:", Array.from(groupIds));
        setSelectedGroupIds(groupIds);
        setOriginalGroupIds(new Set(groupIds));
      });
    } else {
      console.log("Not loading groups - conditions not met");
    }
  }, [open, device, getGroupsForDevice]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      console.log("Modal closing, resetting state");
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedGroupIds(new Set());
      setOriginalGroupIds(new Set());
    }
  }, [open]);

  const handleSave = async () => {
    if (!device) return;

    setSaving(true);

    // Determine groups to add and remove
    const groupsToAdd = [...selectedGroupIds].filter(
      (id) => !originalGroupIds.has(id),
    );
    const groupsToRemove = [...originalGroupIds].filter(
      (id) => !selectedGroupIds.has(id),
    );

    // Add device to new groups
    for (const groupId of groupsToAdd) {
      await addDeviceToGroup(device.id, groupId);
    }

    // Remove device from unchecked groups
    for (const groupId of groupsToRemove) {
      await removeDeviceFromGroup(device.id, groupId);
    }

    setSaving(false);
    onClose();
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    // Check if group name already exists
    const groupExists = groups.some(
      (g) => g.name.toLowerCase() === newGroupName.trim().toLowerCase(),
    );
    if (groupExists) {
      alert(
        "A group with this name already exists. Please choose a different name.",
      );
      return;
    }

    setCreatingGroup(true);
    const groupId = await createGroup(
      newGroupName.trim(),
      newGroupDescription.trim() || undefined,
    );
    setCreatingGroup(false);

    if (groupId) {
      // Auto-select the newly created group
      const newSelected = new Set(selectedGroupIds);
      newSelected.add(groupId);
      setSelectedGroupIds(newSelected);
      setNewGroupName("");
      setNewGroupDescription("");
      setShowCreateGroup(false);
    }
  };

  const deviceName = device?.friendlyName || device?.name || "Device";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add ${deviceName} to Group`}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="filled"
            onClick={handleSave}
            disabled={!hasGroupSelectionChanged()}
            loading={saving}
          >
            Save
          </Button>
        </>
      }
    >
      {groupsLoading ? (
        <Loading message="Loading groups..." />
      ) : (
        <>
          <MultiSelect
            label="Groups"
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
            selected={selectedGroupIds}
            onChange={(ids) => {
              console.log("MultiSelect onChange called with:", Array.from(ids));
              setSelectedGroupIds(ids);
            }}
            placeholder="Select groups"
            fullWidth
          />
          {/* Debug info */}
          <div style={{ fontSize: "10px", color: "#666", marginTop: "8px" }}>
            Debug: Selected IDs:{" "}
            {Array.from(selectedGroupIds).join(", ") || "none"}
          </div>

          <div className="modal-divider">
            <details
              open={showCreateGroup}
              onToggle={(e) => setShowCreateGroup(e.currentTarget.open)}
            >
              <summary className="details-summary">Create new group</summary>
              <div className="details-content">
                <Input
                  label="Group Name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  fullWidth
                />
                <Input
                  label="Description (optional)"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Enter description"
                  fullWidth
                />
                <Button
                  variant="filled"
                  fullWidth
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  loading={creatingGroup}
                >
                  Create Group
                </Button>
              </div>
            </details>
          </div>
        </>
      )}
    </Modal>
  );
}
