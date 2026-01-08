/**
 * Group Storage API Bridge
 * Exposes group storage/CRUD IPC operations to renderer process
 */

import pkg from "electron";
const { ipcRenderer } = pkg;

/**
 * Group storage API object with CRUD operations
 */
const groupStorageApi = {
  /**
   * Create a new group
   * @param {string} name - Group name
   * @param {string} description - Group description
   * @returns {Promise} Created group
   */
  createGroup: (name, description) =>
    ipcRenderer.invoke("storage:createGroup", name, description),

  /**
   * Update group metadata
   * @param {string} groupId - Group ID
   * @param {string} name - New group name
   * @param {string} description - New group description
   * @returns {Promise} Updated group
   */
  updateGroup: (groupId, name, description) =>
    ipcRenderer.invoke("storage:updateGroup", groupId, name, description),

  /**
   * Get group by ID
   * @param {string} groupId - Group ID
   * @returns {Promise} Group object
   */
  getGroup: (groupId) => ipcRenderer.invoke("storage:getGroup", groupId),

  /**
   * Get all groups
   * @returns {Promise} Array of groups
   */
  getAllGroups: () => ipcRenderer.invoke("storage:getAllGroups"),

  /**
   * Delete group
   * @param {string} groupId - Group ID
   * @returns {Promise} Deletion result
   */
  deleteGroup: (groupId) => ipcRenderer.invoke("storage:deleteGroup", groupId),
};

export default groupStorageApi;
