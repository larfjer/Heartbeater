import { useState, useCallback } from "react";
import { Card, Button, Loading, Badge, Input } from "../components/ui";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "../components/ui";
import { Modal } from "../components/ui";
import { useGroups } from "../hooks";
import type { Device, Group } from "@/types/api";

export function DeviceGroupsPage() {
  const {
    groups,
    loading,
    error,
    refresh,
    createGroup,
    updateGroup,
    deleteGroup,
    getDevicesInGroup,
    removeDeviceFromGroup,
  } = useGroups();

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupDevices, setGroupDevices] = useState<Map<string, Device[]>>(
    new Map(),
  );
  const [loadingDevices, setLoadingDevices] = useState<Set<string>>(new Set());

  // Create group modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit group modal state
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  // Load devices for a group
  const loadGroupDevices = useCallback(
    async (groupId: string) => {
      setLoadingDevices((prev) => new Set(prev).add(groupId));
      const devices = await getDevicesInGroup(groupId);
      setGroupDevices((prev) => {
        const newMap = new Map(prev);
        newMap.set(groupId, devices);
        return newMap;
      });
      setLoadingDevices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    },
    [getDevicesInGroup],
  );

  // Toggle group expansion
  const toggleGroup = async (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
    } else {
      setExpandedGroupId(groupId);
      if (!groupDevices.has(groupId)) {
        await loadGroupDevices(groupId);
      }
    }
  };

  // Create new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setCreating(true);
    const groupId = await createGroup(
      newGroupName.trim(),
      newGroupDescription.trim() || undefined,
    );
    setCreating(false);

    if (groupId) {
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
    }
  };

  // Update group
  const handleUpdateGroup = async () => {
    if (!editingGroup || !editGroupName.trim()) return;

    setSaving(true);
    const success = await updateGroup(
      editingGroup.id,
      editGroupName.trim(),
      editGroupDescription.trim() || undefined,
    );
    setSaving(false);

    if (success) {
      setEditingGroup(null);
      setEditGroupName("");
      setEditGroupDescription("");
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;

    const success = await deleteGroup(deletingGroup.id);
    if (success) {
      setDeletingGroup(null);
      if (expandedGroupId === deletingGroup.id) {
        setExpandedGroupId(null);
      }
    }
  };

  // Remove device from group
  const handleRemoveDevice = async (deviceId: string, groupId: string) => {
    const success = await removeDeviceFromGroup(deviceId, groupId);
    if (success) {
      await loadGroupDevices(groupId);
    }
  };

  // Open edit modal
  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || "");
  };

  if (loading) {
    return (
      <div id="device-group">
        <Loading message="Loading groups..." />
      </div>
    );
  }

  return (
    <div id="device-group">
      <Card title="Device Groups" subtitle="Organize and manage device groups">
        <Button
          variant="filled"
          icon="add"
          onClick={() => setShowCreateModal(true)}
        >
          Create Group
        </Button>
      </Card>

      {error && (
        <Card>
          <div className="error-message">
            <span className="material-icons">error</span>
            <span>{error}</span>
            <Button variant="text" icon="refresh" onClick={refresh}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      <div id="groups-container">
        {groups.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="material-icons empty-state-icon">
                folder_open
              </span>
              <h3>No Groups Yet</h3>
              <p>
                Create your first device group to start organizing your devices.
              </p>
              <Button
                variant="filled"
                icon="add"
                onClick={() => setShowCreateModal(true)}
              >
                Create Group
              </Button>
            </div>
          </Card>
        ) : (
          groups.map((group) => {
            const isExpanded = expandedGroupId === group.id;
            const devices = groupDevices.get(group.id) || [];
            const isLoadingDevices = loadingDevices.has(group.id);

            return (
              <Card key={group.id} className="group-card">
                <div
                  className={`group-header ${isExpanded ? "expanded" : ""}`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="group-info">
                    <span className="material-icons group-expand-icon">
                      {isExpanded ? "expand_less" : "expand_more"}
                    </span>
                    <div className="group-details">
                      <h3 className="group-name">{group.name}</h3>
                      {group.description && (
                        <p className="group-description">{group.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="group-meta">
                    <Badge variant="info">
                      {devices.length} device{devices.length !== 1 ? "s" : ""}
                    </Badge>
                    <div
                      className="group-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="text"
                        size="small"
                        icon="edit"
                        onClick={() => openEditModal(group)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        icon="delete"
                        onClick={() => setDeletingGroup(group)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="group-content">
                    {isLoadingDevices ? (
                      <Loading message="Loading devices..." />
                    ) : devices.length === 0 ? (
                      <div className="group-empty">
                        <span className="material-icons">devices</span>
                        <p>
                          No devices in this group. Add devices from the Device
                          Scan tab.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell>Device</TableHeaderCell>
                            <TableHeaderCell>IP Address</TableHeaderCell>
                            <TableHeaderCell>MAC Address</TableHeaderCell>
                            <TableHeaderCell>Actions</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {devices.map((device) => (
                            <TableRow key={device.id}>
                              <TableCell>
                                <div className="device-name">
                                  <span className="material-icons">
                                    computer
                                  </span>
                                  {device.friendlyName || device.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <code>{device.ip}</code>
                              </TableCell>
                              <TableCell>
                                <code>{device.mac || "N/A"}</code>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="text"
                                  size="small"
                                  icon="remove_circle"
                                  onClick={() =>
                                    handleRemoveDevice(device.id, group.id)
                                  }
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Group"
        footer={
          <>
            <Button variant="text" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="filled"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              loading={creating}
            >
              Create
            </Button>
          </>
        }
      >
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
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        open={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        title="Edit Group"
        footer={
          <>
            <Button variant="text" onClick={() => setEditingGroup(null)}>
              Cancel
            </Button>
            <Button
              variant="filled"
              onClick={handleUpdateGroup}
              disabled={!editGroupName.trim()}
              loading={saving}
            >
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Group Name"
          value={editGroupName}
          onChange={(e) => setEditGroupName(e.target.value)}
          placeholder="Enter group name"
          fullWidth
        />
        <Input
          label="Description (optional)"
          value={editGroupDescription}
          onChange={(e) => setEditGroupDescription(e.target.value)}
          placeholder="Enter description"
          fullWidth
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        title="Delete Group"
        size="small"
        footer={
          <>
            <Button variant="text" onClick={() => setDeletingGroup(null)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={handleDeleteGroup}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete the group{" "}
          <strong>"{deletingGroup?.name}"</strong>? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
